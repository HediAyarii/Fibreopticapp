import pkg from 'pg'
const { Pool } = pkg

// Configuration de la base de données
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

async function fixRevenueInconsistency() {
  try {
    console.log('🔍 Analyse de l\'incohérence entre les sections...')
    console.log('📊 Problème: "Charges par Salarié" = 3710€ vs "Bénéfice Brut" = 3770€')
    
    // 1. Vérifier les données dans cout_par_salaire (Charges par Salarié)
    console.log('\n📋 Section "Charges par Salarié" (cout_par_salaire):')
    const coutResult = await pool.query(`
      SELECT 
        nom, prenom, matricule, mois, annee,
        total_genere, salaire_net, charge, taxe, rap
      FROM cout_par_salaire 
      WHERE LOWER(nom) = LOWER('CHIKHA') AND LOWER(prenom) = LOWER('SALEM')
      AND mois = 5 AND annee = 2025
    `)
    
    if (coutResult.rows.length > 0) {
      const row = coutResult.rows[0]
      console.log(`✅ ${row.nom} ${row.prenom} (${row.matricule})`)
      console.log(`   - Total Généré (Charges par Salarié): ${row.total_genere}€`)
      console.log(`   - Salaire Net: ${row.salaire_net}€`)
      console.log(`   - Charge: ${row.charge}€`)
      console.log(`   - Taxe: ${row.taxe}%`)
      console.log(`   - RAP: ${row.rap}€`)
    }
    
    // 2. Calculer les recettes réelles (ce que devrait afficher Bénéfice Brut)
    console.log('\n💰 Section "Bénéfice Brut" (calcul en temps réel):')
    const realRevenue = await pool.query(`
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
      WHERE LOWER(i.nom_technicien) = LOWER('CHIKHA') AND LOWER(i.prenom_technicien) = LOWER('SALEM')
      AND (
        (i.date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' AND TO_DATE(i.date_rdv, 'DD.MM.YYYY') >= '2025-05-01' AND TO_DATE(i.date_rdv, 'DD.MM.YYYY') <= '2025-05-31')
        OR (i.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND i.date_rdv::date >= '2025-05-01' AND i.date_rdv::date <= '2025-05-31')
        OR (i.date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') >= '2025-05-01' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') <= '2025-05-31')
      )
    `)
    
    const realTotal = parseFloat(realRevenue.rows[0].total_recettes_reel) || 0
    console.log(`✅ Total recettes réelles (Bénéfice Brut): ${realTotal}€`)
    
    // 3. Identifier la source de l'incohérence
    console.log('\n🔍 Analyse de l\'incohérence:')
    if (coutResult.rows.length > 0) {
      const coutTotal = parseFloat(coutResult.rows[0].total_genere) || 0
      const difference = realTotal - coutTotal
      
      console.log(`   - "Charges par Salarié": ${coutTotal}€`)
      console.log(`   - "Bénéfice Brut": ${realTotal}€`)
      console.log(`   - Différence: ${difference}€`)
      
      if (Math.abs(difference) > 0.01) {
        console.log('❌ INCOHÉRENCE DÉTECTÉE !')
        console.log('💡 Cause: Les données dans cout_par_salaire ne sont pas synchronisées')
        
        // 4. Corriger l'incohérence
        console.log('\n🔧 Correction de l\'incohérence...')
        await pool.query(`
          UPDATE cout_par_salaire 
          SET 
            total_genere = $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE LOWER(nom) = LOWER('CHIKHA') AND LOWER(prenom) = LOWER('SALEM')
          AND mois = 5 AND annee = 2025
        `, [realTotal])
        
        console.log(`✅ Synchronisé: ${coutTotal}€ → ${realTotal}€`)
        
        // 5. Recalculer le RAP avec la nouvelle formule
        console.log('\n🧮 Recalcul du RAP...')
        const rapResult = await pool.query(`
          SELECT calculer_rap_avec_paiements(id) as nouveau_rap
          FROM cout_par_salaire 
          WHERE LOWER(nom) = LOWER('CHIKHA') AND LOWER(prenom) = LOWER('SALEM')
          AND mois = 5 AND annee = 2025
        `)
        
        if (rapResult.rows.length > 0) {
          const nouveauRap = rapResult.rows[0].nouveau_rap
          console.log(`✅ Nouveau RAP: ${nouveauRap}€`)
        }
        
        // 6. Vérifier que les deux sections affichent maintenant la même valeur
        console.log('\n✅ Vérification finale:')
        const finalCheck = await pool.query(`
          SELECT total_genere FROM cout_par_salaire 
          WHERE LOWER(nom) = LOWER('CHIKHA') AND LOWER(prenom) = LOWER('SALEM')
          AND mois = 5 AND annee = 2025
        `)
        
        if (finalCheck.rows.length > 0) {
          const finalTotal = parseFloat(finalCheck.rows[0].total_genere) || 0
          console.log(`   - "Charges par Salarié" (après correction): ${finalTotal}€`)
          console.log(`   - "Bénéfice Brut" (calcul temps réel): ${realTotal}€`)
          
          if (Math.abs(finalTotal - realTotal) < 0.01) {
            console.log('✅ PARFAIT ! Les deux sections affichent maintenant la même valeur')
          } else {
            console.log('❌ Il y a encore une différence')
          }
        }
        
      } else {
        console.log('✅ Les deux sections sont déjà cohérentes')
      }
    }
    
    // 7. Recommandations pour éviter le problème à l'avenir
    console.log('\n💡 Recommandations:')
    console.log('   ✅ Exécutez régulièrement: node scripts/sync_all_employees_revenue.mjs')
    console.log('   ✅ Vérifiez la cohérence avec: node scripts/maintenance_check_revenue.mjs')
    console.log('   ✅ Les deux sections devraient toujours afficher les mêmes valeurs')
    
    console.log('\n🎯 Correction terminée !')
    console.log('📊 Maintenant, les deux sections devraient afficher 3770€')
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error.message)
  } finally {
    await pool.end()
  }
}

fixRevenueInconsistency()
