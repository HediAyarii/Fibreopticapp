import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Début de la synchronisation intelligente Bénéfice Brut → Charges par Salarié...')
    
    // Utiliser la fonction de synchronisation intelligente
    const result = await query(`SELECT * FROM smart_sync_benefice_brut()`)
    
    const synchronisations = result.rows.map((row: any) => ({
      employe_nom: row.employe_nom,
      employe_prenom: row.employe_prenom,
      ancien_total: parseFloat(row.ancien_total || 0),
      nouveau_total: parseFloat(row.nouveau_total || 0),
      difference: parseFloat(row.difference || 0)
    }))
    
    console.log(`🎯 Synchronisation intelligente terminée: ${synchronisations.length} enregistrements mis à jour`)
    
    return NextResponse.json({
      success: true,
      message: `Synchronisation intelligente terminée: ${synchronisations.length} enregistrements mis à jour`,
      synchronisations,
      total_synchronisations: synchronisations.length
    })
    
  } catch (error) {
    console.error("❌ Erreur synchronisation intelligente:", error)
    return NextResponse.json({ 
      success: false,
      error: "Erreur lors de la synchronisation intelligente",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Vérification intelligente des incohérences...')
    
    // Utiliser la fonction de synchronisation intelligente pour détecter les incohérences
    const result = await query(`SELECT * FROM smart_sync_benefice_brut()`)
    
    const incohérences = result.rows.map((row: any) => ({
      employe_nom: row.employe_nom,
      employe_prenom: row.employe_prenom,
      total_genere_actuel: parseFloat(row.ancien_total || 0),
      benefice_brut_calcule: parseFloat(row.nouveau_total || 0),
      difference: parseFloat(row.difference || 0),
      pourcentage_ecart: parseFloat(row.difference || 0) / Math.max(parseFloat(row.nouveau_total || 0), 0.01) * 100
    }))
    
    return NextResponse.json({
      success: true,
      incohérences,
      total_incohérences: incohérences.length,
      message: incohérences.length === 0 ? "Aucune incohérence détectée" : `${incohérences.length} incohérences détectées`
    })
    
  } catch (error) {
    console.error("❌ Erreur vérification intelligente:", error)
    return NextResponse.json({ 
      success: false,
      error: "Erreur lors de la vérification intelligente",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 })
  }
}

