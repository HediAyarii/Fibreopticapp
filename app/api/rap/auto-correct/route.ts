import { type NextRequest, NextResponse } from "next/server"
import { queryWithClient } from "@/lib/database"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Démarrage de la correction automatique des RAP...')
    
    // 1. Vérifier la cohérence actuelle
    console.log('📊 1. Vérification de la cohérence actuelle...')
    const verificationResult = await queryWithClient(`
      SELECT * FROM verifier_coherence_rap()
      WHERE est_coherent = false
    `)
    
    const incohérents = verificationResult.rows.length
    console.log(`   📊 RAP incohérents détectés: ${incohérents}`)
    
    if (incohérents === 0) {
      return NextResponse.json({ 
        success: true,
        message: "Tous les RAP sont déjà cohérents",
        corrections: 0,
        incohérents: 0
      })
    }
    
    // 2. Corriger tous les RAP
    console.log('📊 2. Correction des RAP incohérents...')
    const correctionResult = await queryWithClient(`
      SELECT * FROM corriger_tous_les_rap()
      WHERE ABS(difference) > 0.01
    `)
    
    const corrections = correctionResult.rows.length
    console.log(`   📊 RAP corrigés: ${corrections}`)
    
    // 3. Vérification finale
    console.log('📊 3. Vérification finale...')
    const finalVerification = await queryWithClient(`
      SELECT * FROM verifier_coherence_rap()
      WHERE est_coherent = false
    `)
    
    const finalIncohérents = finalVerification.rows.length
    console.log(`   📊 RAP incohérents restants: ${finalIncohérents}`)
    
    // 4. Préparer la réponse
    const response = {
      success: true,
      message: corrections > 0 
        ? `${corrections} RAP corrigés avec succès` 
        : "Aucune correction nécessaire",
      corrections: corrections,
      incohérents: finalIncohérents,
      details: correctionResult.rows.map(row => ({
        id: row.id,
        nom: row.nom,
        prenom: row.prenom,
        ancien_rap: parseFloat(row.ancien_rap),
        nouveau_rap: parseFloat(row.nouveau_rap),
        difference: parseFloat(row.difference)
      }))
    }
    
    console.log('✅ Correction automatique terminée')
    return NextResponse.json(response)
    
  } catch (error) {
    console.error("❌ Erreur API correction automatique RAP:", error)
    return NextResponse.json({ 
      error: "Erreur serveur lors de la correction automatique des RAP" 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Vérification de la cohérence des RAP...')
    
    // Vérifier la cohérence de tous les RAP
    const verificationResult = await queryWithClient(`
      SELECT * FROM verifier_coherence_rap()
      ORDER BY nom, prenom
    `)
    
    const total = verificationResult.rows.length
    const cohérents = verificationResult.rows.filter(row => row.est_coherent).length
    const incohérents = total - cohérents
    
    console.log(`📊 Résultat: ${cohérents}/${total} RAP cohérents`)
    
    const response = {
      success: true,
      total: total,
      cohérents: cohérents,
      incohérents: incohérents,
      details: verificationResult.rows.map(row => ({
        id: row.id,
        nom: row.nom,
        prenom: row.prenom,
        rap_actuel: parseFloat(row.rap_actuel),
        rap_calcule: parseFloat(row.rap_calcule),
        difference: parseFloat(row.difference),
        est_coherent: row.est_coherent
      }))
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error("❌ Erreur API vérification RAP:", error)
    return NextResponse.json({ 
      error: "Erreur serveur lors de la vérification des RAP" 
    }, { status: 500 })
  }
}
