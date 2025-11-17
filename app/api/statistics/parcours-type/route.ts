import { NextResponse } from 'next/server'
import { query } from '@/lib/database'

export async function GET() {
  try {
    console.log('📊 Récupération des statistiques par type de parcours...')

    const queryText = `
      SELECT 
        parcours_type,
        CASE 
          WHEN grille LIKE '%AXECOM%' THEN 'AXECOM'
          ELSE 'ERT OUEST'
        END as grille,
        CASE 
          WHEN statut = 'CLOTURE TERMINEE' THEN 'cloture'
          WHEN statut = 'ECHEC TERMINE' THEN 'echec'
          ELSE 'autre'
        END as statut,
        COUNT(*) as total
      FROM interventions
      WHERE 
        statut IN ('CLOTURE TERMINEE', 'ECHEC TERMINE')
        AND parcours_type IS NOT NULL
        AND parcours_type != ''
        AND parcours_type != 'nan'
      GROUP BY parcours_type, grille, statut
      ORDER BY grille, parcours_type, statut
    `

    console.log('🔍 Exécution de la requête parcours-type...')
    const result = await query(queryText)

    console.log(`✅ ${result.rows.length} combinaisons parcours/grille/statut trouvées`)
    if (result.rows.length > 0) {
      console.log('Premier résultat:', result.rows[0])
    }

    // Convertir les totaux en nombres
    const stats = result.rows.map((row: any) => ({
      ...row,
      total: parseInt(row.total, 10)
    }))

    return NextResponse.json({
      success: true,
      stats: stats,
      total: stats.reduce((sum: number, row: any) => sum + row.total, 0)
    })

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques de parcours:', error)
    console.error('Message:', error instanceof Error ? error.message : 'Erreur inconnue')
    console.error('Stack:', error instanceof Error ? error.stack : undefined)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des statistiques',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
