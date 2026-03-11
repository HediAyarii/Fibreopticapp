import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Synchronisation automatique des pénalités...')
    
    // 1. D'abord, récupérer toutes les pénalités récentes (basées sur date_attribution)
    console.log('📋 1. Récupération des pénalités récentes (basées sur date_attribution)...')
    const allPenalites = await query(`
      SELECT 
        p.id,
        p.montant,
        p.date_attribution,
        p.motif,
        p.type_penalite,
        e.id as employe_id,
        e.nom as employe_nom,
        e.prenom as employe_prenom,
        e.matricule as employe_matricule
      FROM penalites p
      LEFT JOIN employes e ON p.employe_id = e.id
      WHERE p.date_attribution >= CURRENT_DATE - INTERVAL '6 months'
      ORDER BY p.date_attribution DESC
    `)
    
    console.log(`📊 Pénalités récentes trouvées: ${allPenalites.rows.length}`)
    
    // 2. Récupérer tous les coûts par salarié
    const allCouts = await query(`
      SELECT 
        id, nom, prenom, mois, annee, matricule, penalite, employe_id
      FROM cout_par_salaire 
      ORDER BY annee DESC, mois DESC, nom, prenom
    `)
    
    let totalSynchronise = 0
    let totalDeductionsCreees = 0
    let totalCoutsCrees = 0
    
    // 3. Créer des coûts par salarié manquants pour les pénalités
    console.log('📋 3. Vérification et création de coûts manquants...')
    
    for (const penalite of allPenalites.rows) {
      const penaliteDate = new Date(penalite.date_attribution)
      const penaliteMonth = penaliteDate.getMonth() + 1
      const penaliteYear = penaliteDate.getFullYear()
      
      // Vérifier s'il existe déjà un coût pour cet employé ce mois
      // Vérification par employe_id OU par nom/prénom (case-insensitive)
      const existingCout = await query(`
        SELECT id, employe_id FROM cout_par_salaire 
        WHERE mois = $1 
          AND annee = $2
          AND (
            employe_id = $3
            OR (
              LOWER(TRIM(nom)) = LOWER(TRIM($4)) 
              AND LOWER(TRIM(prenom)) = LOWER(TRIM($5))
            )
          )
        ORDER BY employe_id NULLS LAST
        LIMIT 1
      `, [penaliteMonth, penaliteYear, penalite.employe_id, penalite.employe_nom, penalite.employe_prenom])
      
      if (existingCout.rows.length === 0) {
        console.log(`🔧 Création d'un coût manquant pour ${penalite.employe_nom} ${penalite.employe_prenom} (${penaliteMonth}/${penaliteYear})`)
        
        try {
          // Créer un coût par salarié basique pour cet employé ce mois
          const newCout = await query(`
            INSERT INTO cout_par_salaire (
              nom, prenom, mois, annee, matricule, 
              salaire_net, salaire_brut, cout_total, charge, 
              taxe, impot, penalite, employe_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
          `, [
            penalite.employe_nom,
            penalite.employe_prenom,
            penaliteMonth,
            penaliteYear,
            penalite.employe_matricule,
            1000.00, // salaire_net par défaut
            1200.00, // salaire_brut par défaut
            1400.00, // cout_total par défaut
            200.00,  // charge par défaut
            50.0,    // taxe 50% par défaut
            100.00,  // impot par défaut
            0.00,    // penalite (sera calculée)
            penalite.employe_id
          ])
          
          console.log(`  ✅ Coût créé: ID ${newCout.rows[0].id}`)
          totalCoutsCrees++
          
          // Ajouter ce nouveau coût à la liste pour synchronisation
          allCouts.rows.push(newCout.rows[0])
          
        } catch (createError) {
          console.error(`  ❌ Erreur création coût:`, createError.message)
        }
      } else {
        // Si un coût existe mais avec employe_id=null, mettre à jour employe_id
        const existing = existingCout.rows[0]
        if (existing.employe_id === null && penalite.employe_id) {
          console.log(`🔧 Mise à jour employe_id pour ${penalite.employe_nom} ${penalite.employe_prenom} (${penaliteMonth}/${penaliteYear})`)
          await query(`
            UPDATE cout_par_salaire 
            SET employe_id = $1, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $2
          `, [penalite.employe_id, existing.id])
        }
      }
    }
    
    // 3b. Nettoyer les doublons (fusionner les données, garder l'entrée avec les vraies données)
    console.log('📋 3b. Nettoyage des doublons...')
    
    // D'abord, identifier les doublons et fusionner les données
    const duplicatesInfo = await query(`
      WITH duplicates AS (
        SELECT id, nom, prenom, mois, annee, employe_id, salaire_net, prime,
          ROW_NUMBER() OVER (
            PARTITION BY LOWER(TRIM(nom)), LOWER(TRIM(prenom)), mois, annee 
            -- Garder l'entrée avec les vraies données (pas les valeurs par défaut 1000.00)
            ORDER BY 
              CASE WHEN salaire_net = 1000.00 THEN 1 ELSE 0 END,  -- Éviter les valeurs par défaut
              CASE WHEN employe_id IS NULL THEN 1 ELSE 0 END,     -- Préférer avec employe_id
              id                                                   -- Plus ancien
          ) as rn
        FROM cout_par_salaire
      )
      SELECT * FROM duplicates WHERE rn <= 2
      ORDER BY LOWER(TRIM(nom)), LOWER(TRIM(prenom)), mois, annee, rn
    `)
    
    // Grouper par nom/prenom/mois/annee pour traiter les paires
    const duplicateGroups: Record<string, any[]> = {}
    for (const row of duplicatesInfo.rows) {
      const key = `${row.nom.toLowerCase().trim()}_${row.prenom.toLowerCase().trim()}_${row.mois}_${row.annee}`
      if (!duplicateGroups[key]) duplicateGroups[key] = []
      duplicateGroups[key].push(row)
    }
    
    let duplicatesDeleted = 0
    for (const [key, rows] of Object.entries(duplicateGroups)) {
      if (rows.length > 1) {
        const toKeep = rows[0]  // Premier = meilleures données
        const toDelete = rows[1]  // Second = à supprimer
        
        // Si le premier n'a pas d'employe_id mais le second oui, mettre à jour
        if (toKeep.employe_id === null && toDelete.employe_id !== null) {
          await query(`UPDATE cout_par_salaire SET employe_id = $1 WHERE id = $2`, [toDelete.employe_id, toKeep.id])
          console.log(`  ✅ Fusionné employe_id=${toDelete.employe_id} vers ID ${toKeep.id}`)
        }
        
        // Supprimer le doublon
        await query(`DELETE FROM cout_par_salaire WHERE id = $1`, [toDelete.id])
        console.log(`  🗑️ Supprimé doublon ID ${toDelete.id}: ${toDelete.prenom} ${toDelete.nom} (${toDelete.mois}/${toDelete.annee})`)
        duplicatesDeleted++
      }
    }
    
    if (duplicatesDeleted > 0) {
      console.log(`🗑️ ${duplicatesDeleted} doublons supprimés après fusion`)
    }
    
    // 4. Synchroniser tous les coûts (existants + nouveaux)
    console.log('📋 4. Synchronisation des pénalités...')
    
    for (const cout of allCouts.rows) {
      console.log(`🔧 Synchronisation pour ${cout.nom} ${cout.prenom} (${cout.mois}/${cout.annee}):`)
      
      // Calculer les pénalités pour ce mois
      let totalPenalites = 0
      
      if (cout.matricule) {
        try {
          const penalitesQuery = `
            SELECT 
              p.id,
              p.montant,
              p.date_attribution,
              p.motif,
              p.type_penalite,
              e.nom as employe_nom,
              e.prenom as employe_prenom,
              e.matricule as employe_matricule
            FROM penalites p
            LEFT JOIN employes e ON p.employe_id = e.id
            WHERE (
              -- Correspondance par matricule
              e.matricule = $1
              OR
              -- Correspondance par nom/prénom avec normalisation
              (
                LOWER(TRIM(e.prenom)) = LOWER(TRIM($2)) AND 
                LOWER(TRIM(e.nom)) = LOWER(TRIM($3))
              ) OR (
                -- Correspondance inversée
                LOWER(TRIM(e.prenom)) = LOWER(TRIM($3)) AND 
                LOWER(TRIM(e.nom)) = LOWER(TRIM($2))
              ) OR (
                -- Correspondance avec tirets
                LOWER(REGEXP_REPLACE(e.prenom, '[^a-zA-Z0-9]', '', 'g')) = LOWER(REGEXP_REPLACE($2, '[^a-zA-Z0-9]', '', 'g')) AND
                LOWER(REGEXP_REPLACE(e.nom, '[^a-zA-Z0-9]', '', 'g')) = LOWER(REGEXP_REPLACE($3, '[^a-zA-Z0-9]', '', 'g'))
              ) OR (
                -- Correspondance inversée avec tirets
                LOWER(REGEXP_REPLACE(e.prenom, '[^a-zA-Z0-9]', '', 'g')) = LOWER(REGEXP_REPLACE($3, '[^a-zA-Z0-9]', '', 'g')) AND
                LOWER(REGEXP_REPLACE(e.nom, '[^a-zA-Z0-9]', '', 'g')) = LOWER(REGEXP_REPLACE($2, '[^a-zA-Z0-9]', '', 'g'))
              )
            )
            AND EXTRACT(YEAR FROM p.date_attribution) = $4
            AND EXTRACT(MONTH FROM p.date_attribution) = $5
            ORDER BY p.date_attribution DESC
          `
          
          const penalitesResult = await query(penalitesQuery, [
            cout.matricule,
            cout.prenom,
            cout.nom,
            cout.annee,
            cout.mois
          ])
          
          totalPenalites = penalitesResult.rows.reduce((sum, penalite) => {
            return sum + (parseFloat(penalite.montant) || 0)
          }, 0)
          
          console.log(`  - Pénalités trouvées: ${penalitesResult.rows.length}`)
          console.log(`  - Montant total: ${totalPenalites.toFixed(2)}€`)
          
        } catch (penaliteError) {
          console.error(`  ❌ Erreur calcul pénalités:`, penaliteError.message)
        }
      }
      
      // Mettre à jour la colonne penalite dans cout_par_salaire
      try {
        await query(`
          UPDATE cout_par_salaire 
          SET 
            penalite = $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [totalPenalites, cout.id])
        
        if (totalPenalites > 0) {
          console.log(`  ✅ Pénalités mises à jour: ${totalPenalites.toFixed(2)}€`)
          totalSynchronise++
          
          // Créer ou mettre à jour les déductions automatiques
          const existingPenaliteDeduction = await query(`
            SELECT id, montant_verse 
            FROM paiements_employes 
            WHERE cout_par_salaire_id = $1 
              AND commentaires LIKE '%Déduction pénalités%'
              AND EXTRACT(YEAR FROM date_paiement) = $2
              AND EXTRACT(MONTH FROM date_paiement) = $3
            LIMIT 1
          `, [cout.id, cout.annee, cout.mois])
          
          if (existingPenaliteDeduction.rows.length === 0) {
            // Créer une déduction automatique pour les pénalités
            await query(`
              INSERT INTO paiements_employes (
                cout_par_salaire_id,
                employe_id,
                montant_verse,
                date_paiement,
                methode_paiement,
                reference_paiement,
                commentaires,
                statut
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
              cout.id,
              cout.employe_id,
              -totalPenalites, // Montant négatif pour déduction
              new Date(cout.annee, cout.mois - 1, 1).toISOString().split('T')[0], // Premier jour du mois
              'deduction_penalite',
              `PENALITE-${cout.mois}-${cout.annee}`,
              `Déduction pénalités automatique - ${cout.mois}/${cout.annee} (${totalPenalites.toFixed(2)}€)`,
              'confirme'
            ])
            
            console.log(`  ✅ Déduction de pénalité créée: -${totalPenalites.toFixed(2)}€`)
            totalDeductionsCreees++
          } else {
            const existingDeduction = existingPenaliteDeduction.rows[0]
            const existingAmount = parseFloat(existingDeduction.montant_verse) || 0
            
            if (Math.abs(existingAmount) !== totalPenalites) {
              // Mettre à jour la déduction existante si le montant a changé
              await query(`
                UPDATE paiements_employes 
                SET 
                  montant_verse = $1,
                  commentaires = $2,
                  updated_at = CURRENT_TIMESTAMP
                WHERE id = $3
              `, [
                -totalPenalites,
                `Déduction pénalités automatique - ${cout.mois}/${cout.annee} (${totalPenalites.toFixed(2)}€)`,
                existingDeduction.id
              ])
              
              console.log(`  ✅ Déduction de pénalité mise à jour: -${totalPenalites.toFixed(2)}€`)
            }
          }
        }
        
      } catch (updateError) {
        console.error(`  ❌ Erreur mise à jour:`, updateError.message)
      }
    }
    
    console.log(`🎯 Synchronisation terminée: ${totalSynchronise} coûts synchronisés, ${totalDeductionsCreees} déductions créées, ${totalCoutsCrees} coûts créés`)
    
    return NextResponse.json({
      success: true,
      message: 'Synchronisation des pénalités terminée',
      data: {
        couts_synchronises: totalSynchronise,
        deductions_creees: totalDeductionsCreees,
        couts_crees: totalCoutsCrees
      }
    })
    
  } catch (error: any) {
    console.error('❌ Erreur synchronisation pénalités:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Erreur serveur: ${error.message}` 
    }, { status: 500 })
  }
}
