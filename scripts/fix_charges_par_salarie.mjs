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

async function fixChargesParSalarie() {
  try {
    console.log('🔧 Correction de la section "Charges par Salarié"...')
    console.log('📊 Problème: Affiche 3710€ au lieu de 3770€')
    
    // 1. Vérifier la valeur actuelle dans cout_par_salaire
    console.log('\n📋 Valeur actuelle dans cout_par_salaire:')
    const currentResult = await pool.query(`
      SELECT 
        nom, prenom, matricule, mois, annee,
        total_genere, salaire_net, charge, taxe, rap, updated_at
      FROM cout_par_salaire 
      WHERE LOWER(nom) = LOWER('CHIKHA') AND LOWER(prenom) = LOWER('SALEM')
      AND mois = 5 AND annee = 2025
    `)
    
    if (currentResult.rows.length > 0) {
      const row = currentResult.rows[0]
      console.log(`✅ ${row.nom} ${row.prenom} (${row.matricule})`)
      console.log(`   - Total Généré actuel: ${row.total_genere}€`)
      console.log(`   - Mis à jour le: ${row.updated_at}`)
    }
    
    // 2. Calculer la valeur correcte
    console.log('\n💰 Calcul de la valeur correcte:')
    const correctValue = await pool.query(`
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
        ) as total_recettes_correct
      FROM interventions i
      WHERE LOWER(i.nom_technicien) = LOWER('CHIKHA') AND LOWER(i.prenom_technicien) = LOWER('SALEM')
      AND (
        (i.date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' AND TO_DATE(i.date_rdv, 'DD.MM.YYYY') >= '2025-05-01' AND TO_DATE(i.date_rdv, 'DD.MM.YYYY') <= '2025-05-31')
        OR (i.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND i.date_rdv::date >= '2025-05-01' AND i.date_rdv::date <= '2025-05-31')
        OR (i.date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') >= '2025-05-01' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') <= '2025-05-31')
      )
    `)
    
    const correctTotal = parseFloat(correctValue.rows[0].total_recettes_correct) || 0
    console.log(`✅ Valeur correcte: ${correctTotal}€`)
    
    // 3. Comparer et corriger si nécessaire
    if (currentResult.rows.length > 0) {
      const currentTotal = parseFloat(currentResult.rows[0].total_genere) || 0
      const difference = correctTotal - currentTotal
      
      console.log('\n🔍 Comparaison:')
      console.log(`   - Valeur actuelle: ${currentTotal}€`)
      console.log(`   - Valeur correcte: ${correctTotal}€`)
      console.log(`   - Différence: ${difference}€`)
      
      if (Math.abs(difference) > 0.01) {
        console.log('❌ Correction nécessaire !')
        
        // Mettre à jour la valeur
        console.log('\n🔧 Mise à jour de la valeur...')
        await pool.query(`
          UPDATE cout_par_salaire 
          SET 
            total_genere = $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE LOWER(nom) = LOWER('CHIKHA') AND LOWER(prenom) = LOWER('SALEM')
          AND mois = 5 AND annee = 2025
        `, [correctTotal])
        
        console.log(`✅ Mis à jour: ${currentTotal}€ → ${correctTotal}€`)
        
        // Recalculer le RAP avec la nouvelle formule
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
        
        // Vérifier la mise à jour
        console.log('\n✅ Vérification de la mise à jour...')
        const verifyResult = await pool.query(`
          SELECT total_genere, rap FROM cout_par_salaire 
          WHERE LOWER(nom) = LOWER('CHIKHA') AND LOWER(prenom) = LOWER('SALEM')
          AND mois = 5 AND annee = 2025
        `)
        
        if (verifyResult.rows.length > 0) {
          const row = verifyResult.rows[0]
          console.log(`✅ Valeur mise à jour: ${row.total_genere}€`)
          console.log(`✅ RAP mis à jour: ${row.rap}€`)
        }
        
      } else {
        console.log('✅ La valeur est déjà correcte')
      }
    }
    
    // 4. Vérifier que les deux sections sont maintenant cohérentes
    console.log('\n🔍 Vérification de la cohérence entre les sections...')
    
    // Section "Charges par Salarié" (cout_par_salaire)
    const chargesResult = await pool.query(`
      SELECT total_genere FROM cout_par_salaire 
      WHERE LOWER(nom) = LOWER('CHIKHA') AND LOWER(prenom) = LOWER('SALEM')
      AND mois = 5 AND annee = 2025
    `)
    
    // Section "Bénéfice Brut" (calcul en temps réel)
    const beneficeResult = await pool.query(`
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
        ) as total_recettes
      FROM interventions i
      WHERE LOWER(i.nom_technicien) = LOWER('CHIKHA') AND LOWER(i.prenom_technicien) = LOWER('SALEM')
      AND (
        (i.date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' AND TO_DATE(i.date_rdv, 'DD.MM.YYYY') >= '2025-05-01' AND TO_DATE(i.date_rdv, 'DD.MM.YYYY') <= '2025-05-31')
        OR (i.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND i.date_rdv::date >= '2025-05-01' AND i.date_rdv::date <= '2025-05-31')
        OR (i.date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') >= '2025-05-01' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') <= '2025-05-31')
      )
    `)
    
    if (chargesResult.rows.length > 0 && beneficeResult.rows.length > 0) {
      const chargesTotal = parseFloat(chargesResult.rows[0].total_genere) || 0
      const beneficeTotal = parseFloat(beneficeResult.rows[0].total_recettes) || 0
      
      console.log(`📊 Comparaison finale:`)
      console.log(`   - "Charges par Salarié": ${chargesTotal}€`)
      console.log(`   - "Bénéfice Brut": ${beneficeTotal}€`)
      
      if (Math.abs(chargesTotal - beneficeTotal) < 0.01) {
        console.log('✅ PARFAIT ! Les deux sections sont maintenant cohérentes')
        console.log(`✅ Les deux sections affichent ${chargesTotal}€`)
      } else {
        console.log('❌ Il y a encore une différence entre les sections')
      }
    }
    
    console.log('\n🎯 Correction terminée !')
    console.log('💡 Rafraîchissez votre front-end pour voir les changements')
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error.message)
  } finally {
    await pool.end()
  }
}

fixChargesParSalarie()
