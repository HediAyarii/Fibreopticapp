import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Comparer seulement les champs vraiment essentiels pour identifier les vrais doublons
    const fieldsToCompare = `
      num_inter, date_rdv, client, nom_technicien, prenom_technicien
    `
    
    // Requête pour trouver les doublons en comparant TOUS les champs
    const duplicatesQuery = `
      SELECT
        ${fieldsToCompare},
        COUNT(*) as count
      FROM interventions
      GROUP BY ${fieldsToCompare}
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `
    
    const duplicates = await query(duplicatesQuery)
    
    // Supprimer les doublons en comparant TOUS les champs
    let deletedCount = 0
    
    try {
      const deleteQuery = `
        DELETE FROM interventions
        WHERE id NOT IN (
          SELECT MIN(id)
          FROM interventions
          GROUP BY ${fieldsToCompare}
        )
      `
      
      const result = await query(deleteQuery)
      deletedCount = result.rowCount || 0

    } catch (error) {
      console.error("Erreur lors de la suppression des doublons:", error)
      throw error
    }
    
    return NextResponse.json({
      duplicates: duplicates.rows,
      totalDuplicates: duplicates.rows.length,
      deletedCount: deletedCount,
      message: `${deletedCount} doublons supprimés, ${duplicates.rows.length} groupes de doublons traités`
    })
    
  } catch (error) {
    console.error("Erreur lors de la vérification des doublons:", error)
    return NextResponse.json({
      error: "Erreur lors de la vérification des doublons" 
    }, { status: 500 })
  }
}
