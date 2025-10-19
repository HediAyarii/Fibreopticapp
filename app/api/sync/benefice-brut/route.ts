import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Début de la synchronisation Bénéfice Brut → Charges par Salarié...')
    
    // Récupérer tous les enregistrements de cout_par_salaire
    const coutParSalaireResult = await query(`
      SELECT id, nom, prenom, mois, annee, total_genere
      FROM cout_par_salaire
      ORDER BY nom, prenom, annee, mois
    `)
    
    const synchronisations = []
    
    for (const record of coutParSalaireResult.rows) {
      // Calculer le bénéfice brut pour ce technicien et cette période
      const beneficeBrutResult = await query(`
        SELECT COALESCE(SUM(
          CASE 
            WHEN i.statut = 'CLOTURE TERMINEE' THEN
              COALESCE(
                (SELECT SUM(
                  CASE 
                    WHEN cp.prix_tech IS NOT NULL THEN cp.prix_tech
                    ELSE 0
                  END
                )
                FROM unnest(string_to_array(i.articles, ',')) as article_item
                LEFT JOIN company_pricing cp ON 
                  TRIM(SPLIT_PART(article_item, 'x', 1)) = cp.service_code
                  AND cp.company_name = 'ERT OUEST'
                  AND cp.category = i.type_intervention
                ), 0
              )
            ELSE 0
          END
        ), 0) as benefice_total
        FROM interventions i
        WHERE i.statut = 'CLOTURE TERMINEE'
          AND i.articles IS NOT NULL 
          AND i.articles != ''
          AND LOWER(i.nom_technicien) = LOWER($1)
          AND LOWER(i.prenom_technicien) = LOWER($2)
          AND (
            (i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND 
             i.cloture_tech ~ '^[0-9]' AND 
             (i.cloture_tech::date >= DATE($3 || '-' || LPAD($4::text, 2, '0') || '-01') AND 
              i.cloture_tech::date <= (DATE($3 || '-' || LPAD($4::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))) OR
            (i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND 
             i.cloture_hotline ~ '^[0-9]' AND 
             (i.cloture_hotline::date >= DATE($3 || '-' || LPAD($4::text, 2, '0') || '-01') AND 
              i.cloture_hotline::date <= (DATE($3 || '-' || LPAD($4::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))) OR
            (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND 
             i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND 
             i.date_rdv ~ '^[0-9]' AND 
             (i.date_rdv::date >= DATE($3 || '-' || LPAD($4::text, 2, '0') || '-01') AND 
              i.date_rdv::date <= (DATE($3 || '-' || LPAD($4::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day')))
          )
      `, [record.nom, record.prenom, record.annee, record.mois])
      
      const beneficeTotal = parseFloat(beneficeBrutResult.rows[0]?.benefice_total || 0)
      const currentTotal = parseFloat(record.total_genere || 0)
      
      // Vérifier s'il y a une différence significative
      if (Math.abs(beneficeTotal - currentTotal) > 0.01) {
        // Mettre à jour le total_genere
        await query(`
          UPDATE cout_par_salaire 
          SET total_genere = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [beneficeTotal, record.id])
        
        // Recalculer le RAP
        const rapResult = await query(`
          SELECT calculer_rap_avec_paiements($1) as rap_actuel
        `, [record.id])
        
        const newRap = parseFloat(rapResult.rows[0]?.rap_actuel || 0)
        
        await query(`
          UPDATE cout_par_salaire 
          SET rap = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [newRap, record.id])
        
        synchronisations.push({
          employe_nom: record.nom,
          employe_prenom: record.prenom,
          mois: record.mois,
          annee: record.annee,
          ancien_total: currentTotal,
          nouveau_total: beneficeTotal,
          difference: beneficeTotal - currentTotal,
          nouveau_rap: newRap
        })
        
        console.log(`✅ Synchronisé: ${record.nom} ${record.prenom} (${record.mois}/${record.annee}): ${currentTotal.toFixed(2)}€ → ${beneficeTotal.toFixed(2)}€`)
      }
    }
    
    console.log(`🎯 Synchronisation terminée: ${synchronisations.length} enregistrements mis à jour`)
    
    return NextResponse.json({
      success: true,
      message: `Synchronisation terminée: ${synchronisations.length} enregistrements mis à jour`,
      synchronisations,
      total_synchronisations: synchronisations.length
    })
    
  } catch (error) {
    console.error("❌ Erreur synchronisation:", error)
    return NextResponse.json({ 
      success: false,
      error: "Erreur lors de la synchronisation",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Vérification des incohérences...')
    
    // Récupérer tous les enregistrements de cout_par_salaire
    const coutParSalaireResult = await query(`
      SELECT id, nom, prenom, mois, annee, total_genere
      FROM cout_par_salaire
      ORDER BY nom, prenom, annee, mois
    `)
    
    const incohérences = []
    
    for (const record of coutParSalaireResult.rows) {
      // Calculer le bénéfice brut pour ce technicien et cette période
      const beneficeBrutResult = await query(`
        SELECT COALESCE(SUM(
          CASE 
            WHEN i.statut = 'CLOTURE TERMINEE' THEN
              COALESCE(
                (SELECT SUM(
                  CASE 
                    WHEN cp.prix_tech IS NOT NULL THEN cp.prix_tech
                    ELSE 0
                  END
                )
                FROM unnest(string_to_array(i.articles, ',')) as article_item
                LEFT JOIN company_pricing cp ON 
                  TRIM(SPLIT_PART(article_item, 'x', 1)) = cp.service_code
                  AND cp.company_name = 'ERT OUEST'
                  AND cp.category = i.type_intervention
                ), 0
              )
            ELSE 0
          END
        ), 0) as benefice_total
        FROM interventions i
        WHERE i.statut = 'CLOTURE TERMINEE'
          AND i.articles IS NOT NULL 
          AND i.articles != ''
          AND LOWER(i.nom_technicien) = LOWER($1)
          AND LOWER(i.prenom_technicien) = LOWER($2)
          AND (
            (i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND 
             i.cloture_tech ~ '^[0-9]' AND 
             (i.cloture_tech::date >= DATE($3 || '-' || LPAD($4::text, 2, '0') || '-01') AND 
              i.cloture_tech::date <= (DATE($3 || '-' || LPAD($4::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))) OR
            (i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND 
             i.cloture_hotline ~ '^[0-9]' AND 
             (i.cloture_hotline::date >= DATE($3 || '-' || LPAD($4::text, 2, '0') || '-01') AND 
              i.cloture_hotline::date <= (DATE($3 || '-' || LPAD($4::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))) OR
            (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND 
             i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND 
             i.date_rdv ~ '^[0-9]' AND 
             (i.date_rdv::date >= DATE($3 || '-' || LPAD($4::text, 2, '0') || '-01') AND 
              i.date_rdv::date <= (DATE($3 || '-' || LPAD($4::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day')))
          )
      `, [record.nom, record.prenom, record.annee, record.mois])
      
      const beneficeTotal = parseFloat(beneficeBrutResult.rows[0]?.benefice_total || 0)
      const currentTotal = parseFloat(record.total_genere || 0)
      
      // Vérifier s'il y a une différence significative
      if (Math.abs(beneficeTotal - currentTotal) > 0.01) {
        incohérences.push({
          employe_nom: record.nom,
          employe_prenom: record.prenom,
          mois: record.mois,
          annee: record.annee,
          total_genere_actuel: currentTotal,
          benefice_brut_calcule: beneficeTotal,
          difference: beneficeTotal - currentTotal,
          pourcentage_ecart: ((beneficeTotal - currentTotal) / Math.max(beneficeTotal, currentTotal)) * 100
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      incohérences,
      total_incohérences: incohérences.length,
      message: incohérences.length === 0 ? "Aucune incohérence détectée" : `${incohérences.length} incohérences détectées`
    })
    
  } catch (error) {
    console.error("❌ Erreur vérification:", error)
    return NextResponse.json({ 
      success: false,
      error: "Erreur lors de la vérification",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 })
  }
}

