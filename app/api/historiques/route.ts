import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const action = searchParams.get('action')
    const tableName = searchParams.get('table_name')
    const section = searchParams.get('section')
    const dateDebut = searchParams.get('date_debut')
    const dateFin = searchParams.get('date_fin')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    let queryText = 'SELECT * FROM historiques'
    const params: any[] = []
    const conditions: string[] = []
    let paramIndex = 1

    // Filtres
    if (userId) {
      conditions.push(`user_id = $${paramIndex}`)
      params.push(userId)
      paramIndex++
    }

    if (action) {
      conditions.push(`action = $${paramIndex}`)
      params.push(action)
      paramIndex++
    }

    if (tableName) {
      conditions.push(`table_name = $${paramIndex}`)
      params.push(tableName)
      paramIndex++
    }

    if (section) {
      conditions.push(`section = $${paramIndex}`)
      params.push(section)
      paramIndex++
    }

    if (dateDebut) {
      conditions.push(`created_at >= $${paramIndex}::date`)
      params.push(dateDebut)
      paramIndex++
    }

    if (dateFin) {
      conditions.push(`created_at <= $${paramIndex}::date`)
      params.push(dateFin)
      paramIndex++
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ')
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const result = await query(queryText, params)

    // Compter le total
    let countQuery = 'SELECT COUNT(*) as total FROM historiques'
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ')
    }
    const countResult = await query(countQuery, params.slice(0, -2))

    return NextResponse.json({
      success: true,
      historiques: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset
    })
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur serveur', historiques: [] },
      { status: 500 }
    )
  }
}
