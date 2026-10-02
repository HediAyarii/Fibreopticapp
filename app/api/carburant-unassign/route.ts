import { NextRequest, NextResponse } from 'next/server'
import { getPool, getClient } from '@/lib/database'
import {
  AssignationErreur,
  commencer,
  libererCarte,
  messageErreurBase,
  verifierDate
} from '@/lib/carburant-assignations'

export const dynamic = 'force-dynamic'

// Retire la carte à l'employé à partir de date_fin (incluse : la consommation de
// ce jour ne lui est plus attribuée). Par défaut : aujourd'hui.
export async function POST(request: NextRequest) {
  const client = await getClient()
  try {
    const { employe_id, numero_carte, date_fin, commentaires } = await request.json()

    if (!employe_id) {
      return NextResponse.json(
        { error: 'ID de l\'employé requis' },
        { status: 400 }
      )
    }

    const dateFin = date_fin
      ? verifierDate(date_fin, 'Date de fin')
      : new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' })

    await commencer(client)
    const resultat = await libererCarte(client, {
      employeId: parseInt(employe_id),
      carte: numero_carte ? String(numero_carte) : null,
      dateFin,
      commentaires
    })
    await client.query('COMMIT')

    return NextResponse.json({
      success: true,
      actions: resultat.actions,
      message: resultat.actions.join('\n')
    })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    const erreur = error instanceof AssignationErreur ? error : messageErreurBase(error)
    if (erreur) {
      return NextResponse.json({ error: erreur.message, ...erreur.details }, { status: erreur.status })
    }
    console.error('❌ Erreur lors de la désassignation de la carte:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la désassignation de la carte' },
      { status: 500 }
    )
  } finally {
    client.release()
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
        ca.carte_id,
        ca.employe_id,
        e.nom || ' ' || e.prenom as employe_nom,
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
    
    query += ` ORDER BY ca.carte_id, ca.date_assignation`
    
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
