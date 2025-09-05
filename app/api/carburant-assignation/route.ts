import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/database'

export async function GET() {
  try {
    console.log('✅ Connexion PostgreSQL établie avec succès')
    
    // Récupérer l'historique complet des assignations
    const query = `
      SELECT 
        ca.*,
        e.nom as employe_nom,
        e.prenom as employe_prenom,
        e.matricule as employe_matricule,
        c.montant as carte_montant,
        c.date_livraison as carte_date_livraison
      FROM carburant_assignations ca
      LEFT JOIN employes e ON ca.employe_id = e.id
      LEFT JOIN carburant c ON ca.numero_carte = c.numero_carte
      ORDER BY ca.date_assignation DESC, ca.created_at DESC
    `
    
    const startTime = Date.now()
    const pool = getPool()
    const result = await pool.query(query)
    const duration = Date.now() - startTime
    
    console.log(`📊 Query executed in ${duration}ms: ${query.substring(0, 100)}...`)
    
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des assignations:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des assignations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { numero_carte, employe_id, employe_nom, date_assignation, statut } = data
    
    console.log('✅ Connexion PostgreSQL établie avec succès')
    
    // Vérifier si l'employé a déjà une carte assignée
    const checkQuery = `
      SELECT id, numero_carte, statut 
      FROM carburant_assignations 
      WHERE employe_id = $1 AND statut = 'active'
    `
    
    const pool = getPool()
    const checkResult = await pool.query(checkQuery, [employe_id])
    
    if (checkResult.rows.length > 0) {
      // Désactiver l'ancienne assignation
      const deactivateQuery = `
        UPDATE carburant_assignations 
        SET statut = 'inactive', date_fin = NOW()
        WHERE employe_id = $1 AND statut = 'active'
      `
      const pool2 = getPool()
      await pool2.query(deactivateQuery, [employe_id])
      console.log(`📊 Ancienne carte désactivée pour l'employé ${employe_id}`)
      
      // Retirer l'assignation de la table carburant_consommation pour l'ancienne carte
      const oldCardNumber = checkResult.rows[0].numero_carte
      const removeOldAssignmentQuery = `
        UPDATE carburant_consommation 
        SET employe_assigné = NULL
        WHERE numero_carte = $1
      `
      await pool2.query(removeOldAssignmentQuery, [oldCardNumber])
      console.log(`📊 Ancienne assignation retirée de carburant_consommation pour carte ${oldCardNumber}`)
    }
    
    // Créer la nouvelle assignation
    const insertQuery = `
      INSERT INTO carburant_assignations (
        numero_carte, 
        employe_id, 
        employe_nom, 
        date_assignation, 
        statut,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `
    
    const startTime = Date.now()
    const pool3 = getPool()
    const result = await pool3.query(insertQuery, [
      numero_carte,
      employe_id,
      employe_nom,
      date_assignation || new Date().toISOString().split('T')[0],
      statut || 'active'
    ])
    const duration = Date.now() - startTime
    
    console.log(`📊 Query executed in ${duration}ms: ${insertQuery.substring(0, 100)}...`)
    
    // Mettre à jour la table carburant_consommation pour associer la carte à l'employé
    const updateConsumptionQuery = `
      UPDATE carburant_consommation 
      SET employe_assigné = $1
      WHERE numero_carte = $2
    `
    
    const pool4 = getPool()
    await pool4.query(updateConsumptionQuery, [employe_id, numero_carte])
    console.log(`📊 Mise à jour carburant_consommation: carte ${numero_carte} assignée à employé ${employe_id}`)
    
    return NextResponse.json({
      success: true,
      assignation: result.rows[0],
      message: `Carte ${numero_carte} assignée avec succès à ${employe_nom}`
    })
  } catch (error) {
    console.error('❌ Erreur lors de l\'assignation de la carte:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'assignation de la carte' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { id, numero_carte, employe_id, employe_nom, date_assignation, statut } = data
    
    console.log('✅ Connexion PostgreSQL établie avec succès')
    
    const updateQuery = `
      UPDATE carburant_assignations 
      SET 
        numero_carte = $1,
        employe_id = $2,
        employe_nom = $3,
        date_assignation = $4,
        statut = $5,
        updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `
    
    const startTime = Date.now()
    const pool4 = getPool()
    const result = await pool4.query(updateQuery, [
      numero_carte,
      employe_id,
      employe_nom,
      date_assignation,
      statut,
      id
    ])
    const duration = Date.now() - startTime
    
    console.log(`📊 Query executed in ${duration}ms: ${updateQuery.substring(0, 100)}...`)
    
    return NextResponse.json({
      success: true,
      assignation: result.rows[0],
      message: 'Assignation mise à jour avec succès'
    })
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de l\'assignation:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'assignation' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de l\'assignation requis' },
        { status: 400 }
      )
    }
    
    console.log('✅ Connexion PostgreSQL établie avec succès')
    
    const deleteQuery = `
      DELETE FROM carburant_assignations 
      WHERE id = $1
      RETURNING *
    `
    
    const startTime = Date.now()
    const pool5 = getPool()
    const result = await pool5.query(deleteQuery, [id])
    const duration = Date.now() - startTime
    
    console.log(`📊 Query executed in ${duration}ms: ${deleteQuery.substring(0, 100)}...`)
    
    return NextResponse.json({
      success: true,
      message: 'Assignation supprimée avec succès'
    })
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de l\'assignation:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'assignation' },
      { status: 500 }
    )
  }
}