import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Construire les filtres de date pour les interventions
    const queryParams: any[] = []
    let paramIndex = 1

    let dateFilter = ""
    if (startDate) {
      dateFilter += ` AND (
        (cloture_tech IS NOT NULL AND cloture_tech != '' AND 
         (TO_DATE(cloture_tech, 'DD.MM.YYYY') >= $${paramIndex} OR 
          TO_DATE(cloture_tech, 'YYYY-MM-DD') >= $${paramIndex} OR
          cloture_tech >= $${paramIndex})) OR
        (cloture_hotline IS NOT NULL AND cloture_hotline != '' AND 
         (TO_DATE(cloture_hotline, 'DD.MM.YYYY') >= $${paramIndex} OR 
          TO_DATE(cloture_hotline, 'YYYY-MM-DD') >= $${paramIndex} OR
          cloture_hotline >= $${paramIndex})) OR
        (cloture_tech IS NULL AND cloture_hotline IS NULL AND date_rdv >= $${paramIndex})
      )`
      queryParams.push(startDate)
      paramIndex++
    }
    if (endDate) {
      dateFilter += ` AND (
        (cloture_tech IS NOT NULL AND cloture_tech != '' AND 
         (TO_DATE(cloture_tech, 'DD.MM.YYYY') <= $${paramIndex} OR 
          TO_DATE(cloture_tech, 'YYYY-MM-DD') <= $${paramIndex} OR
          cloture_tech <= $${paramIndex})) OR
        (cloture_hotline IS NOT NULL AND cloture_hotline != '' AND 
         (TO_DATE(cloture_hotline, 'DD.MM.YYYY') <= $${paramIndex} OR 
          TO_DATE(cloture_hotline, 'YYYY-MM-DD') <= $${paramIndex} OR
          cloture_hotline <= $${paramIndex})) OR
        (cloture_tech IS NULL AND cloture_hotline IS NULL AND date_rdv <= $${paramIndex})
      )`
      queryParams.push(endDate)
      paramIndex++
    }

    // Requête pour obtenir les statistiques des interventions CLOTURE TERMINEE avec filtrage par date
    const statsQuery = `
      SELECT 
        COUNT(*) as total_cloture_terminee,
        COUNT(CASE 
          WHEN articles IS NOT NULL 
            AND articles != '' 
            AND UPPER(articles) NOT IN ('NAN', 'N/A')
          THEN 1 
        END) as avec_articles,
        COUNT(CASE 
          WHEN articles IS NULL 
            OR articles = '' 
            OR UPPER(articles) IN ('NAN', 'N/A')
          THEN 1 
        END) as sans_articles
      FROM interventions 
      WHERE statut = 'CLOTURE TERMINEE'${dateFilter}
    `

    const result = await query(statsQuery, queryParams)
    const stats = result.rows[0]

    return NextResponse.json({
      success: true,
      stats: {
        total_cloture_terminee: parseInt(stats.total_cloture_terminee),
        avec_articles: parseInt(stats.avec_articles),
        sans_articles: parseInt(stats.sans_articles)
      }
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    return NextResponse.json({
      error: 'Erreur lors de la récupération des statistiques'
    }, { status: 500 })
  }
}
