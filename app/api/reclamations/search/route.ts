import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const searchTerm = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!searchTerm || searchTerm.length < 2) {
      return NextResponse.json({
        success: true,
        reclamations: []
      })
    }

    // Recherche par numéro de réclamation, numéro d'intervention ou nom du technicien
    const sql = `
      SELECT 
        r.id,
        r.numero_reclamation,
        r.intervention_id,
        r.date_reclamation,
        r.type_reclamation,
        r.statut,
        r.employe_id,
        i.num_inter,
        e.nom as nom_technicien,
        e.prenom as prenom_technicien
      FROM reclamations r
      LEFT JOIN employes e ON r.employe_id = e.id
      LEFT JOIN interventions i ON r.intervention_id = i.id
      WHERE 
        r.numero_reclamation ILIKE $1
        OR i.num_inter ILIKE $1
        OR e.nom ILIKE $1
        OR e.prenom ILIKE $1
        OR CONCAT(e.prenom, ' ', e.nom) ILIKE $1
      ORDER BY r.date_reclamation DESC
      LIMIT $2
    `

    const result = await query(sql, [`%${searchTerm}%`, limit])

    return NextResponse.json({
      success: true,
      reclamations: result.rows
    })
  } catch (error) {
    console.error('Erreur lors de la recherche de réclamations:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erreur lors de la recherche de réclamations',
        reclamations: []
      },
      { status: 500 }
    )
  }
}
