import { NextResponse } from 'next/server'
import { query } from '@/lib/database'

export async function GET() {
  try {
    console.log('📊 Récupération des statistiques RACC par type de logement...')

    const queryText = `
      SELECT 
        COALESCE(i.type_logement, 'Non spécifié') as type_logement,
        COALESCE(i.grille, 'Non spécifié') as grille,
        COUNT(*) as total
      FROM interventions i
      WHERE 
        i.cloture_tech = 'oui'
        AND (
          i.articles ILIKE '%RACC%'
          OR i.type_intervention ILIKE '%RACC%'
          OR i.type_intervention ILIKE '%raccordement%'
        )
      GROUP BY i.type_logement, i.grille
      ORDER BY i.grille, i.type_logement
    `

    const result = await query(queryText)

    console.log(`✅ ${result.rows.length} types de logement trouvés`)
    console.log('Détails:', result.rows)

    return NextResponse.json({
      success: true,
      stats: result.rows,
      total: result.rows.reduce((sum: number, row: any) => sum + parseInt(row.total), 0)
    })

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques RACC:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des statistiques',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
