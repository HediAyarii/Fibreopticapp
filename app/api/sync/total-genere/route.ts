import { NextRequest, NextResponse } from 'next/server'
import { queryWithClient } from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Démarrage de la synchronisation automatique du Total Généré...')
    
    // 1. Récupérer tous les employés avec des charges
    console.log('📊 1. Récupération des employés...')
    const employees = await queryWithClient(`
      SELECT DISTINCT nom, prenom, mois, annee, id, total_genere
      FROM cout_par_salaire 
      WHERE nom IS NOT NULL AND prenom IS NOT NULL
      ORDER BY nom, prenom, annee, mois
    `)
    
    console.log(`📋 ${employees.rows.length} employés trouvés`)
    
    let totalUpdated = 0
    let totalSkipped = 0
    const updates = []
    
    // 2. Calculer le Total Généré pour chaque employé
    for (const employee of employees.rows) {
      try {
        console.log(`👤 Traitement: ${employee.nom} ${employee.prenom} (${employee.mois}/${employee.annee})`)
        
        // Calculer le total généré réel
        const realTimeCalculation = await queryWithClient(`
          SELECT 
            SUM(
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
            ) as total_recettes_reel
          FROM interventions i
          WHERE LOWER(i.nom_technicien) = LOWER($1) AND LOWER(i.prenom_technicien) = LOWER($2)
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
        `, [employee.nom, employee.prenom, employee.annee, employee.mois])
        
        const totalReel = parseFloat(realTimeCalculation.rows[0]?.total_recettes_reel) || 0
        const current = parseFloat(employee.total_genere) || 0
        const difference = totalReel - current
        
        // Mettre à jour si nécessaire
        if (Math.abs(difference) > 0.01) {
          console.log(`🔄 Mise à jour: ${employee.nom} ${employee.prenom} (${current}€ → ${totalReel}€)`)
          
          // Mettre à jour le total_genere
          await queryWithClient(`
            UPDATE cout_par_salaire 
            SET 
              total_genere = $1,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [totalReel, employee.id])
          
          // Recalculer le RAP
          const newRapResult = await queryWithClient(`
            SELECT calculer_rap_avec_paiements($1) as nouveau_rap
          `, [employee.id])
          
          if (newRapResult.rows.length > 0) {
            const nouveauRap = newRapResult.rows[0].nouveau_rap
            console.log(`✅ RAP recalculé: ${nouveauRap}€`)
          }
          
          totalUpdated++
          updates.push({
            employe: `${employee.nom} ${employee.prenom}`,
            periode: `${employee.mois}/${employee.annee}`,
            ancien_total: current,
            nouveau_total: totalReel,
            difference: difference
          })
        } else {
          totalSkipped++
        }
        
      } catch (error) {
        console.error(`❌ Erreur pour ${employee.nom} ${employee.prenom}:`, error.message)
      }
    }
    
    console.log(`🎯 Synchronisation terminée !`)
    console.log(`📊 Résultats: ${totalUpdated} mis à jour, ${totalSkipped} déjà à jour`)
    
    return NextResponse.json({
      success: true,
      message: 'Synchronisation automatique terminée',
      total_employees: employees.rows.length,
      updated: totalUpdated,
      skipped: totalSkipped,
      updates: updates
    })
    
  } catch (error) {
    console.error('❌ Erreur synchronisation automatique:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la synchronisation automatique',
      details: error.message 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Vérification de l\'état de synchronisation...')
    
    // Vérifier les incohérences
    const incoherences = await queryWithClient(`
      SELECT 
        cps.nom,
        cps.prenom,
        cps.mois,
        cps.annee,
        cps.total_genere as total_stocke,
        COALESCE(SUM(
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
        ), 0) as total_calcule,
        ABS(cps.total_genere - COALESCE(SUM(
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
        ), 0)) as difference
      FROM cout_par_salaire cps
      LEFT JOIN interventions i ON 
        LOWER(i.nom_technicien) = LOWER(cps.nom) AND 
        LOWER(i.prenom_technicien) = LOWER(cps.prenom) AND
        (
          (i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND 
           i.cloture_tech ~ '^[0-9]' AND 
           (i.cloture_tech::date >= DATE(cps.annee || '-' || LPAD(cps.mois::text, 2, '0') || '-01') AND 
            i.cloture_tech::date <= (DATE(cps.annee || '-' || LPAD(cps.mois::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))) OR
          (i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND 
           i.cloture_hotline ~ '^[0-9]' AND 
           (i.cloture_hotline::date >= DATE(cps.annee || '-' || LPAD(cps.mois::text, 2, '0') || '-01') AND 
            i.cloture_hotline::date <= (DATE(cps.annee || '-' || LPAD(cps.mois::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))) OR
          (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND 
           i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND 
           i.date_rdv ~ '^[0-9]' AND 
           (i.date_rdv::date >= DATE(cps.annee || '-' || LPAD(cps.mois::text, 2, '0') || '-01') AND 
            i.date_rdv::date <= (DATE(cps.annee || '-' || LPAD(cps.mois::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day')))
        )
      WHERE cps.nom IS NOT NULL AND cps.prenom IS NOT NULL
      GROUP BY cps.id, cps.nom, cps.prenom, cps.mois, cps.annee, cps.total_genere
      HAVING ABS(cps.total_genere - COALESCE(SUM(
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
      ), 0)) > 0.01
      ORDER BY ABS(cps.total_genere - COALESCE(SUM(
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
      ), 0)) DESC
    `)
    
    return NextResponse.json({
      success: true,
      total_employees: incoherences.rows.length,
      incoherences: incoherences.rows.map(row => ({
        employe: `${row.nom} ${row.prenom}`,
        periode: `${row.mois}/${row.annee}`,
        total_stocke: parseFloat(row.total_stocke),
        total_calcule: parseFloat(row.total_calcule),
        difference: parseFloat(row.difference)
      }))
    })
    
  } catch (error) {
    console.error('❌ Erreur vérification synchronisation:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la vérification',
      details: error.message 
    }, { status: 500 })
  }
}
