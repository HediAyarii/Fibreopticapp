import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function DELETE(request: NextRequest) {
  try {
    // Supprimer toutes les interventions
    const result = await query("DELETE FROM interventions")
    
    const deletedCount = result.rowCount || 0

    return NextResponse.json({
      success: true,
      deletedCount: deletedCount,
      message: `${deletedCount} interventions supprimées de la base de données`
    })

  } catch (error) {
    console.error("Erreur lors de la suppression des interventions:", error)
    return NextResponse.json({
      error: "Erreur lors de la suppression des interventions"
    }, { status: 500 })
  }
}
