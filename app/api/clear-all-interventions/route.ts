import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

export async function DELETE(request: NextRequest) {
  try {
    // Compter d'abord le nombre d'interventions
    const countResult = await query('SELECT COUNT(*) as count FROM interventions')
    const totalCount = countResult.rows[0]?.count || 0

    if (totalCount === 0) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        message: "Aucune intervention à supprimer"
      })
    }

    // Supprimer toutes les interventions
    const result = await query('DELETE FROM interventions')
    const deletedCount = result.rowCount || 0

    return NextResponse.json({
      success: true,
      deletedCount: deletedCount,
      message: `${deletedCount} interventions supprimées de la base de données`
    })

  } catch (error) {
    console.error("Erreur lors de la suppression de toutes les interventions:", error)
    return NextResponse.json({
      error: "Erreur lors de la suppression de toutes les interventions"
    }, { status: 500 })
  }
}
