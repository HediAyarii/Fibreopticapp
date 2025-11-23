import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const employeId = searchParams.get('employeId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!employeId) {
      return NextResponse.json(
        { error: 'ID employé requis' },
        { status: 400 }
      )
    }

    let sql = `
      SELECT 
        a.id as affectation_id,
        a.date_affectation,
        a.quantite_assignee,
        a.type_affectation,
        a.commentaires,
        m.id as materiel_id,
        m.nom_equipement,
        m.type_materiel,
        m.marque,
        m.modele,
        m.depot,
        m.prix_unitaire,
        e.nom as employe_nom,
        e.prenom as employe_prenom,
        e.matricule as employe_matricule
      FROM affectations_materiel a
      INNER JOIN materiel m ON a.materiel_id = m.id
      INNER JOIN employes e ON a.employe_id = e.id
      WHERE a.employe_id = $1
        AND a.statut = 'active'
    `

    const params: any[] = [employeId]
    let paramIndex = 2

    if (startDate) {
      sql += ` AND a.date_affectation >= $${paramIndex}`
      params.push(startDate)
      paramIndex++
    }

    if (endDate) {
      sql += ` AND a.date_affectation <= $${paramIndex}`
      params.push(endDate)
      paramIndex++
    }

    sql += ` ORDER BY a.date_affectation DESC`

    const result = await query(sql, params)

    return NextResponse.json({
      materials: result.rows,
      count: result.rows.length
    })
  } catch (error) {
    console.error('Erreur dans employee-material-details API:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des détails',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
