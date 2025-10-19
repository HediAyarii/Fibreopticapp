import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 Début de la synchronisation automatique avec détection...')
    
    // Utiliser la fonction de synchronisation automatique avec détection
    const result = await query(`SELECT * FROM auto_sync_with_detection()`)
    
    const synchronisations = result.rows.map((row: any) => ({
      employe_nom: row.employe_nom,
      employe_prenom: row.employe_prenom,
      ancien_total: parseFloat(row.ancien_total || 0),
      nouveau_total: parseFloat(row.nouveau_total || 0),
      difference: parseFloat(row.difference || 0),
      match_type: row.match_type
    }))
    
    console.log(`🎯 Synchronisation automatique terminée: ${synchronisations.length} enregistrements mis à jour`)
    
    return NextResponse.json({
      success: true,
      message: `Synchronisation automatique terminée: ${synchronisations.length} enregistrements mis à jour`,
      synchronisations,
      total_synchronisations: synchronisations.length
    })
    
  } catch (error) {
    console.error("❌ Erreur synchronisation automatique:", error)
    return NextResponse.json({ 
      success: false,
      error: "Erreur lors de la synchronisation automatique",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Détection automatique des correspondances...')
    
    // Utiliser la fonction de détection automatique
    const detectionResult = await query(`SELECT * FROM auto_detect_name_matches() ORDER BY match_score DESC`)
    
    const correspondances = detectionResult.rows.map((row: any) => ({
      cout_nom: row.cout_nom,
      cout_prenom: row.cout_prenom,
      int_nom: row.int_nom,
      int_prenom: row.int_prenom,
      match_score: parseFloat(row.match_score || 0),
      match_type: row.match_type
    }))
    
    // Utiliser la fonction de monitoring
    const monitorResult = await query(`SELECT * FROM monitor_name_matches() ORDER BY match_score DESC`)
    
    const monitoring = monitorResult.rows.map((row: any) => ({
      cout_nom: row.cout_nom,
      cout_prenom: row.cout_prenom,
      int_nom: row.int_nom,
      int_prenom: row.int_prenom,
      match_score: parseFloat(row.match_score || 0),
      match_type: row.match_type,
      status: row.status
    }))
    
    return NextResponse.json({
      success: true,
      correspondances,
      monitoring,
      total_correspondances: correspondances.length,
      message: `${correspondances.length} correspondances détectées automatiquement`
    })
    
  } catch (error) {
    console.error("❌ Erreur détection automatique:", error)
    return NextResponse.json({ 
      success: false,
      error: "Erreur lors de la détection automatique",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 })
  }
}

