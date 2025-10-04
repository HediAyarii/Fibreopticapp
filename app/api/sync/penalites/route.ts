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
      const existingCout = await query(`
        SELECT id FROM cout_par_salaire 
        WHERE employe_id = $1 
          AND mois = $2 
          AND annee = $3
      `, [penalite.employe_id, penaliteMonth, penaliteYear])
      
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
      }
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
