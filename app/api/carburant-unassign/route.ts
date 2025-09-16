import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { employe_id, employe_nom, numero_carte, commentaires } = data
    
    console.log('🔄 Début de la désassignation de carte pour l\'employé:', employe_nom)
    
    if (!employe_id) {
      return NextResponse.json(
        { error: 'ID de l\'employé requis' },
        { status: 400 }
      )
    }
    
    const pool = getPool()
    
    // Vérifier si l'employé a une carte assignée
    const checkQuery = `
      SELECT id, numero_carte, statut, employe_nom, date_assignation
      FROM carburant_assignations 
      WHERE employe_id = $1 AND statut = 'active'
    `
    
    const checkResult = await pool.query(checkQuery, [employe_id])
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Aucune carte assignée à cet employé' },
        { status: 404 }
      )
    }
    
    const currentAssignment = checkResult.rows[0]
    const cardToUnassign = numero_carte || currentAssignment.numero_carte
    
    // Vérifier si la carte spécifiée correspond à l'assignation actuelle
    if (numero_carte && numero_carte !== currentAssignment.numero_carte) {
      return NextResponse.json(
        { error: `L'employé n'a pas la carte ${numero_carte} assignée` },
        { status: 400 }
      )
    }
    
    // Désactiver l'assignation actuelle
    const unassignComment = commentaires 
      ? `Désassignation le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')} | ${commentaires}`
      : `Désassignation le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`
    
    const unassignQuery = `
      UPDATE carburant_assignations 
      SET statut = 'inactive', 
          date_fin = NOW(),
          commentaires = CASE 
            WHEN commentaires IS NULL OR commentaires = '' 
            THEN $2
            ELSE commentaires || ' | ' || $2
          END,
          updated_at = NOW()
      WHERE employe_id = $1 AND statut = 'active'
      RETURNING *
    `
    
    const startTime = Date.now()
    const result = await pool.query(unassignQuery, [employe_id, unassignComment])
    const duration = Date.now() - startTime
    
    console.log(`📊 Unassign query executed in ${duration}ms`)
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Erreur lors de la désassignation' },
        { status: 500 }
      )
    }
    
    const unassignedAssignment = result.rows[0]
    
    // Retirer l'assignation de la table carburant_consommation pour cette carte
    const removeAssignmentQuery = `
      UPDATE carburant_consommation 
      SET employe_assigné = NULL
      WHERE numero_carte = $1
    `
    
    await pool.query(removeAssignmentQuery, [cardToUnassign])
    console.log(`📊 Assignation retirée de carburant_consommation pour carte ${cardToUnassign}`)
    
    return NextResponse.json({
      success: true,
      message: `Carte ${cardToUnassign} désassignée avec succès de ${employe_nom}`,
      unassigned_assignment: unassignedAssignment,
      summary: {
        employe_id: employe_id,
        employe_nom: employe_nom,
        numero_carte: cardToUnassign,
        date_desassignation: new Date().toISOString(),
        duree_execution_ms: duration
      }
    })
    
  } catch (error) {
    console.error('❌ Erreur lors de la désassignation de la carte:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la désassignation de la carte' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeId = searchParams.get('employe_id')
    
    console.log('📊 Récupération des assignations actives')
    
    const pool = getPool()
    
    let query = `
      SELECT 
        ca.id,
        ca.numero_carte,
        ca.employe_id,
        ca.employe_nom,
        ca.date_assignation,
        ca.date_fin,
        ca.statut,
        ca.commentaires,
        ca.created_at,
        ca.updated_at,
        e.nom as employe_nom_complet,
        e.prenom as employe_prenom_complet,
        e.matricule,
        e.email,
        e.telephone
      FROM carburant_assignations ca
      LEFT JOIN employes e ON ca.employe_id = e.id
      WHERE ca.statut = 'active'
    `
    
    const params = []
    if (employeId) {
      query += ` AND ca.employe_id = $1`
      params.push(employeId)
    }
    
    query += ` ORDER BY ca.numero_carte, ca.date_assignation`
    
    const startTime = Date.now()
    const result = await pool.query(query, params)
    const duration = Date.now() - startTime
    
    console.log(`📊 Query executed in ${duration}ms`)
    
    return NextResponse.json({
      success: true,
      assignations_actives: result.rows,
      resume: {
        total_assignations: result.rows.length,
        duree_query_ms: duration,
        employe_filter: employeId || 'Tous les employés'
      }
    })
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des assignations:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des assignations' },
      { status: 500 }
    )
  }
}
