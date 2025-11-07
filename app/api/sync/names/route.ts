import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Synchronisation automatique des noms via matricule...')
    
    // 1. Vérifier l'état avant correction
    const beforeState = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN employe_id IS NULL THEN 1 ELSE 0 END) as sans_employe_id
      FROM cout_par_salaire
    `)
    
    console.log(`📊 État initial: ${beforeState.rows[0].total} entrées, ${beforeState.rows[0].sans_employe_id} sans employe_id`)
    
    // 2. Corriger les noms en utilisant le matricule
    // Les noms de cout_par_salaire doivent correspondre EXACTEMENT aux noms de employes
    const correctionResult = await query(`
      UPDATE cout_par_salaire cps
      SET 
        nom = e.nom,
        prenom = e.prenom,
        employe_id = e.id,
        taxe = e.pourcentage_taxe,
        impot = cps.charge * (e.pourcentage_taxe / 100),
        updated_at = CURRENT_TIMESTAMP
      FROM employes e
      WHERE cps.matricule = e.matricule
      AND cps.matricule IS NOT NULL
      AND cps.matricule != ''
      AND e.statut = 'actif'
      AND (
        cps.nom != e.nom 
        OR cps.prenom != e.prenom
        OR cps.employe_id IS NULL
        OR cps.employe_id != e.id
        OR cps.taxe != e.pourcentage_taxe
      )
      RETURNING cps.id, cps.matricule, e.nom as nom_employe, e.prenom as prenom_employe, cps.nom as ancien_nom, cps.prenom as ancien_prenom, cps.mois, cps.annee
    `)
    
    console.log(`✅ ${correctionResult.rowCount} entrées corrigées`)
    
    // Afficher les corrections effectuées
    if (correctionResult.rowCount > 0) {
      console.log('📝 Détails des corrections:')
      correctionResult.rows.forEach((row: any) => {
        console.log(`   ID ${row.id} (${row.matricule}): "${row.ancien_nom} ${row.ancien_prenom}" → "${row.nom_employe} ${row.prenom_employe}" - ${row.mois}/${row.annee}`)
      })
    }
    
    // 3. Identifier les entrées sans matricule
    const noMatricule = await query(`
      SELECT 
        id,
        nom,
        prenom,
        matricule,
        mois,
        annee
      FROM cout_par_salaire
      WHERE matricule IS NULL OR matricule = ''
      ORDER BY nom, prenom
    `)
    
    // 4. Vérifier la synchronisation finale pour octobre 2025
    const syncCheck = await query(`
      SELECT 
        CASE 
          WHEN e.id IS NULL THEN 'Employé introuvable'
          WHEN e.statut != 'actif' THEN 'Employé inactif'
          WHEN cps.nom != e.nom OR cps.prenom != e.prenom THEN 'Nom différent'
          WHEN e.pourcentage_taxe != cps.taxe THEN 'Taxe désynchronisée'
          ELSE 'OK'
        END as statut,
        COUNT(*) as nombre
      FROM cout_par_salaire cps
      LEFT JOIN employes e ON cps.matricule = e.matricule
      WHERE cps.mois = 10 AND cps.annee = 2025
      GROUP BY 
        CASE 
          WHEN e.id IS NULL THEN 'Employé introuvable'
          WHEN e.statut != 'actif' THEN 'Employé inactif'
          WHEN cps.nom != e.nom OR cps.prenom != e.prenom THEN 'Nom différent'
          WHEN e.pourcentage_taxe != cps.taxe THEN 'Taxe désynchronisée'
          ELSE 'OK'
        END
      ORDER BY nombre DESC
    `)
    
    // 5. Recalculer le RAP après correction des taxes
    if (correctionResult.rowCount > 0) {
      await query(`
        UPDATE cout_par_salaire
        SET rap = total_genere - salaire_net - impot + COALESCE(prime, 0) - COALESCE(penalite, 0),
            updated_at = CURRENT_TIMESTAMP
        WHERE id IN (
          SELECT DISTINCT cps.id
          FROM cout_par_salaire cps
          JOIN employes e ON cps.matricule = e.matricule
          WHERE cps.matricule IS NOT NULL
        )
      `)
    }
    
    // Étape 4: Ajouter automatiquement les employés avec recettes mais absents de cout_par_salarie
    console.log('🔍 Recherche des employés avec recettes non présents dans cout_par_salarie...')
    
    let autoAdded = 0
    const body = await request.json().catch(() => ({}))
    const targetMonth = body.mois
    const targetYear = body.annee
    
    if (targetMonth && targetYear) {
      // Calculer les recettes depuis les interventions
      const employeesWithRevenue = await query(`
        SELECT 
          e.nom,
          e.prenom,
          e.matricule,
          COALESCE(e.pourcentage_taxe, 50) as taxe,
          SUM(
            CASE 
              WHEN i.statut = 'CLOTURE TERMINEE' THEN
                COALESCE((
                  SELECT SUM(
                    CASE 
                      WHEN TRIM(SPLIT_PART(article_item, 'x', 1)) = 'DEP_OFFE' 
                           AND i.articles LIKE '%SAV%' THEN 0
                      WHEN cp.prix_tech IS NOT NULL THEN cp.prix_tech
                      ELSE 0
                    END
                  )
                  FROM unnest(string_to_array(i.articles, ',')) as article_item
                  LEFT JOIN company_pricing cp ON 
                    TRIM(SPLIT_PART(article_item, 'x', 1)) = cp.service_code
                    AND cp.company_name = CASE 
                      WHEN i.grille LIKE '%AXECOM MANCHE%' THEN 'AXECOM'
                      ELSE 'ERT OUEST'
                    END
                    AND cp.category = i.type_intervention
                ), 0)
              ELSE 0
            END
          ) as total_genere
        FROM employes e
        LEFT JOIN interventions i ON LOWER(i.nom_technicien) = LOWER(e.nom) 
          AND LOWER(i.prenom_technicien) = LOWER(e.prenom)
          AND i.date_rdv IS NOT NULL
          AND (
            (i.date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' 
             AND EXTRACT(MONTH FROM TO_DATE(i.date_rdv, 'DD/MM/YYYY')) = $1
             AND EXTRACT(YEAR FROM TO_DATE(i.date_rdv, 'DD/MM/YYYY')) = $2)
            OR
            (i.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' 
             AND EXTRACT(MONTH FROM TO_DATE(SUBSTRING(i.date_rdv, 1, 10), 'YYYY-MM-DD')) = $1
             AND EXTRACT(YEAR FROM TO_DATE(SUBSTRING(i.date_rdv, 1, 10), 'YYYY-MM-DD')) = $2)
          )
        WHERE e.statut = 'actif'
        GROUP BY e.nom, e.prenom, e.matricule, e.pourcentage_taxe
        HAVING SUM(
          CASE 
            WHEN i.statut = 'CLOTURE TERMINEE' THEN
              COALESCE((
                SELECT SUM(
                  CASE 
                    WHEN TRIM(SPLIT_PART(article_item, 'x', 1)) = 'DEP_OFFE' 
                         AND i.articles LIKE '%SAV%' THEN 0
                    WHEN cp.prix_tech IS NOT NULL THEN cp.prix_tech
                    ELSE 0
                  END
                )
                FROM unnest(string_to_array(i.articles, ',')) as article_item
                LEFT JOIN company_pricing cp ON 
                  TRIM(SPLIT_PART(article_item, 'x', 1)) = cp.service_code
                  AND cp.company_name = CASE 
                    WHEN i.grille LIKE '%AXECOM MANCHE%' THEN 'AXECOM'
                    ELSE 'ERT OUEST'
                  END
                  AND cp.category = i.type_intervention
              ), 0)
            ELSE 0
          END
        ) > 0
      `, [targetMonth, targetYear])
      
      console.log(`📊 Trouvé ${employeesWithRevenue.rows.length} employés avec recettes pour ${targetMonth}/${targetYear}`)
      
      // Vérifier lesquels ne sont pas dans cout_par_salarie
      for (const emp of employeesWithRevenue.rows) {
        const existing = await query(
          'SELECT id FROM cout_par_salaire WHERE LOWER(nom) = LOWER($1) AND LOWER(prenom) = LOWER($2) AND mois = $3 AND annee = $4',
          [emp.nom, emp.prenom, targetMonth, targetYear]
        )
        
        if (existing.rows.length === 0) {
          // Créer l'entrée avec salaire_net = total_genere et taxe = 0 (pas de charges pour les auto-ajoutés)
          const totalGenereValue = parseFloat(emp.total_genere) || 0
          const matriculeValue = emp.matricule
          
          await query(`
            INSERT INTO cout_par_salaire 
            (nom, prenom, salaire_net, salaire_brut, cout_total, charge, mois, annee, matricule, taxe, impot, auto_added, total_genere, employe_id)
            VALUES ($1, $2, $3, 0, 0, 0, $4, $5, $6, 0, 0, true, $3, (SELECT id FROM employes WHERE matricule = $7))
          `, [emp.nom, emp.prenom, totalGenereValue, targetMonth, targetYear, matriculeValue, matriculeValue])
          
          autoAdded++
          console.log(`✅ Auto-ajouté: ${emp.nom} ${emp.prenom} avec recettes ${totalGenereValue.toFixed(2)}€ (taxe=0, impot=0)`)
        }
      }
      
      console.log(`✅ ${autoAdded} employés auto-ajoutés`)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Synchronisation des noms terminée avec succès',
      corrected: correctionResult.rowCount,
      corrections: correctionResult.rows,
      auto_added: autoAdded,
      without_matricule: noMatricule.rowCount,
      without_matricule_details: noMatricule.rows,
      sync_status: syncCheck.rows,
      summary: {
        total_before: parseInt(beforeState.rows[0].total),
        without_employe_id_before: parseInt(beforeState.rows[0].sans_employe_id),
        corrected_now: correctionResult.rowCount,
        auto_added: autoAdded
      }
    })
    
  } catch (error) {
    console.error('❌ Erreur synchronisation noms:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur lors de la synchronisation des noms',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}

// GET pour vérifier l'état sans corriger
export async function GET() {
  try {
    // Vérifier les noms désynchronisés
    const mismatchCheck = await query(`
      SELECT 
        cps.id,
        cps.nom as nom_cout,
        cps.prenom as prenom_cout,
        cps.matricule,
        e.nom as nom_employe,
        e.prenom as prenom_employe,
        e.pourcentage_taxe,
        cps.taxe,
        cps.mois,
        cps.annee,
        CASE 
          WHEN e.id IS NULL THEN 'Employé introuvable'
          WHEN e.statut != 'actif' THEN 'Employé inactif'
          WHEN cps.nom != e.nom OR cps.prenom != e.prenom THEN 'Nom différent'
          WHEN e.pourcentage_taxe != cps.taxe THEN 'Taxe désynchronisée'
          ELSE 'OK'
        END as statut
      FROM cout_par_salaire cps
      LEFT JOIN employes e ON cps.matricule = e.matricule
      WHERE cps.matricule IS NOT NULL
      AND (
        e.id IS NULL
        OR e.statut != 'actif'
        OR cps.nom != e.nom
        OR cps.prenom != e.prenom
        OR e.pourcentage_taxe != cps.taxe
      )
      ORDER BY cps.mois DESC, cps.annee DESC, cps.nom
    `)
    
    // Compter par statut
    const statusCount = await query(`
      SELECT 
        CASE 
          WHEN e.id IS NULL THEN 'Employé introuvable'
          WHEN e.statut != 'actif' THEN 'Employé inactif'
          WHEN cps.nom != e.nom OR cps.prenom != e.prenom THEN 'Nom différent'
          WHEN e.pourcentage_taxe != cps.taxe THEN 'Taxe désynchronisée'
          ELSE 'OK'
        END as statut,
        COUNT(*) as nombre
      FROM cout_par_salaire cps
      LEFT JOIN employes e ON cps.matricule = e.matricule
      WHERE cps.matricule IS NOT NULL
      GROUP BY statut
      ORDER BY nombre DESC
    `)
    
    return NextResponse.json({
      success: true,
      mismatches: mismatchCheck.rows,
      mismatch_count: mismatchCheck.rowCount,
      status_summary: statusCount.rows
    })
    
  } catch (error) {
    console.error('❌ Erreur vérification noms:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur lors de la vérification des noms' 
    }, { status: 500 })
  }
}
