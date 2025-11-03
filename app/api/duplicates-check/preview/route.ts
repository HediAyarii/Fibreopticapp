import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

/**
 * Preview duplicates without deleting them
 * Fast preview using indexed fields only
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('🔍 Prévisualisation des doublons (sans suppression)...')
    
    // Trouver les doublons par clé composite
    const previewQuery = `
      WITH duplicate_groups AS (
        SELECT 
          num_inter,
          date_rdv,
          statut,
          COUNT(*) as duplicate_count,
          ARRAY_AGG(id ORDER BY created_at) as ids,
          MIN(created_at) as first_created,
          MAX(created_at) as last_created,
          ARRAY_AGG(DISTINCT nom_technicien || ' ' || prenom_technicien) as technicians
        FROM interventions
        WHERE num_inter IS NOT NULL 
          AND num_inter != ''
        GROUP BY num_inter, date_rdv, statut
        HAVING COUNT(*) > 1
      )
      SELECT 
        num_inter,
        date_rdv,
        statut,
        duplicate_count,
        ids,
        first_created,
        last_created,
        technicians,
        (duplicate_count - 1) as will_be_deleted
      FROM duplicate_groups
      ORDER BY duplicate_count DESC, num_inter
      LIMIT 100
    `
    
    const result = await query(previewQuery)
    
    // Compter les entrées _DUP_
    const dupCountQuery = `
      SELECT COUNT(*) as dup_count
      FROM interventions
      WHERE num_inter LIKE '%_DUP_%'
    `
    
    const dupCountResult = await query(dupCountQuery)
    const dupCount = parseInt(dupCountResult.rows[0]?.dup_count || '0')
    
    // Calculer les statistiques
    const totalDuplicates = result.rows.reduce((sum: number, row: any) => sum + (row.duplicate_count - 1), 0)
    
    const executionTime = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      preview: result.rows,
      statistics: {
        totalDuplicateGroups: result.rows.length,
        totalRecordsThatWillBeDeleted: totalDuplicates,
        recordsWithDupSuffix: dupCount,
        estimatedTimeToClean: `~${Math.ceil(totalDuplicates / 100)}s`
      },
      executionTime: `${executionTime}ms`,
      message: `Trouvé ${result.rows.length} groupes de doublons (${totalDuplicates} enregistrements à supprimer)`
    })
    
  } catch (error) {
    console.error("❌ Erreur lors de la prévisualisation:", error)
    return NextResponse.json({
      error: "Erreur lors de la prévisualisation",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
