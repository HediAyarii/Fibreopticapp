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

async function checkChikhaSalemInconsistency() {
  try {
    console.log('🔍 Vérification de l\'incohérence pour CHIKHA SALEM...')
    console.log('📊 Objectif: Comparer "Recette Technicien" vs "Total Généré"')
    
    // 1. Vérifier dans cout_par_salaire (Charges par Salarié)
    console.log('\n📊 Section "Charges par Salarié" (cout_par_salaire):')
    const chargesResult = await pool.query(`
      SELECT 
        nom, prenom, matricule, total_genere, rap, updated_at
      FROM cout_par_salaire 
      WHERE LOWER(nom) = LOWER('CHIKHA') AND LOWER(prenom) = LOWER('SALEM')
      AND mois = 5 AND annee = 2025
    `)
    
    if (chargesResult.rows.length > 0) {
      const row = chargesResult.rows[0]
      console.log(`✅ CHIKHA SALEM trouvé dans cout_par_salaire:`)
      console.log(`   - Nom: ${row.nom} ${row.prenom}`)
      console.log(`   - Matricule: ${row.matricule}`)
      console.log(`   - Total Généré: ${row.total_genere}€`)
      console.log(`   - RAP: ${row.rap}€`)
      console.log(`   - Mis à jour: ${row.updated_at}`)
    } else {
      console.log('❌ CHIKHA SALEM non trouvé dans cout_par_salaire')
    }
    
    // 2. Calculer comme dans Bénéfice Brut (recap-calcul)
    console.log('\n📊 Section "Bénéfice Brut" (recap-calcul):')
    const beneficeBrutQuery = `
      WITH intervention_revenue AS (
        SELECT 
          i.id as intervention_id,
          i.num_inter,
          i.client,
          i.date_rdv,
          i.prenom_technicien,
          i.nom_technicien,
          i.cloture_tech,
          i.cloture_hotline,
          i.articles,
          i.statut,
          i.type_intervention,
          -- Correspondance améliorée avec normalisation des noms
          COALESCE(e.id, -1) as employe_id,
          COALESCE(e.nom, i.nom_technicien) as employe_nom,
          COALESCE(e.prenom, i.prenom_technicien) as employe_prenom,
          COALESCE(e.matricule, CONCAT('TECH_', UPPER(SUBSTRING(i.nom_technicien, 1, 3)), UPPER(SUBSTRING(i.prenom_technicien, 1, 2)))) as matricule,
          -- Calculer les recettes basées sur les articles
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
          END as recette_technicien
        FROM interventions i
        LEFT JOIN employes e ON (
          -- Correspondance simplifiée et plus robuste
          (
            LOWER(TRIM(e.prenom)) = LOWER(TRIM(i.prenom_technicien)) AND 
            LOWER(TRIM(e.nom)) = LOWER(TRIM(i.nom_technicien))
          ) OR (
            -- Correspondance avec normalisation des espaces et tirets
            LOWER(REGEXP_REPLACE(e.prenom, '[^a-zA-Z0-9]', '', 'g')) = LOWER(REGEXP_REPLACE(i.prenom_technicien, '[^a-zA-Z0-9]', '', 'g')) AND
            LOWER(REGEXP_REPLACE(e.nom, '[^a-zA-Z0-9]', '', 'g')) = LOWER(REGEXP_REPLACE(i.nom_technicien, '[^a-zA-Z0-9]', '', 'g'))
          ) OR (
            -- Correspondance inversée
            LOWER(TRIM(e.prenom)) = LOWER(TRIM(i.nom_technicien)) AND 
            LOWER(TRIM(e.nom)) = LOWER(TRIM(i.prenom_technicien))
          ) OR (
            -- Correspondance partielle améliorée
            (
              LOWER(e.prenom) LIKE '%' || LOWER(i.prenom_technicien) || '%' OR
              LOWER(i.prenom_technicien) LIKE '%' || LOWER(e.prenom) || '%'
            ) AND (
              LOWER(e.nom) LIKE '%' || LOWER(i.nom_technicien) || '%' OR
              LOWER(i.nom_technicien) LIKE '%' || LOWER(e.nom) || '%'
            )
          ) OR (
            -- Correspondance par matricule si disponible
            e.matricule IS NOT NULL AND e.matricule != '' AND
            CONCAT('TECH_', UPPER(SUBSTRING(i.nom_technicien, 1, 3)), UPPER(SUBSTRING(i.prenom_technicien, 1, 2))) = e.matricule
          )
        )
        WHERE i.statut = 'CLOTURE TERMINEE'
          AND i.articles IS NOT NULL 
          AND i.articles != ''
          AND (
            (i.cloture_tech >= $1 OR i.cloture_hotline >= $1) OR
            (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND i.date_rdv >= $1)
          )
          AND (
            (i.cloture_tech <= $2 OR i.cloture_hotline <= $2) OR
            (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND i.date_rdv <= $2) OR
            (i.cloture_tech IS NULL AND i.cloture_hotline IS NOT NULL AND i.cloture_hotline::date <= $2::date) OR
            (i.cloture_hotline IS NULL AND i.cloture_tech IS NOT NULL AND i.cloture_tech::date <= $2::date)
          )
      )
      SELECT 
        employe_id,
        employe_nom,
        employe_prenom,
        matricule,
        COUNT(*) as nombre_interventions,
        SUM(recette_technicien) as total_recette_technicien
      FROM intervention_revenue
      WHERE LOWER(employe_nom) = LOWER('CHIKHA') AND LOWER(employe_prenom) = LOWER('SALEM')
      GROUP BY employe_id, employe_nom, employe_prenom, matricule
    `
    
    const beneficeBrutResult = await pool.query(beneficeBrutQuery, ['2025-05-01', '2025-05-31'])
    
    if (beneficeBrutResult.rows.length > 0) {
      const row = beneficeBrutResult.rows[0]
      console.log(`✅ CHIKHA SALEM trouvé dans Bénéfice Brut:`)
      console.log(`   - Nom: ${row.employe_nom} ${row.employe_prenom}`)
      console.log(`   - Matricule: ${row.matricule}`)
      console.log(`   - Recette Technicien: ${row.total_recette_technicien}€`)
      console.log(`   - Nombre d'interventions: ${row.nombre_interventions}`)
    } else {
      console.log('❌ CHIKHA SALEM non trouvé dans Bénéfice Brut')
    }
    
    // 3. Comparer les deux valeurs
    console.log('\n🔍 Comparaison des deux sections:')
    
    const chargesValue = chargesResult.rows.length > 0 ? parseFloat(chargesResult.rows[0].total_genere || 0) : 0
    const beneficeValue = beneficeBrutResult.rows.length > 0 ? parseFloat(beneficeBrutResult.rows[0].total_recette_technicien || 0) : 0
    const difference = beneficeValue - chargesValue
    
    console.log(`📊 Charges par Salarié: ${chargesValue}€`)
    console.log(`📊 Bénéfice Brut: ${beneficeValue}€`)
    console.log(`📊 Différence: ${difference}€`)
    
    if (Math.abs(difference) > 0.01) {
      console.log('❌ INCOHÉRENCE DÉTECTÉE !')
      console.log(`💡 La différence est de ${difference}€`)
      
      if (difference > 0) {
        console.log('💡 Bénéfice Brut > Charges par Salarié')
        console.log('💡 Il faut synchroniser Charges par Salarié avec Bénéfice Brut')
      } else {
        console.log('💡 Charges par Salarié > Bénéfice Brut')
        console.log('💡 Il faut vérifier le calcul de Bénéfice Brut')
      }
    } else {
      console.log('✅ COHÉRENCE PARFAITE !')
      console.log('💡 Les deux sections affichent la même valeur')
    }
    
    // 4. Synchroniser si nécessaire
    if (Math.abs(difference) > 0.01) {
      console.log('\n🔄 Synchronisation de CHIKHA SALEM...')
      
      if (chargesResult.rows.length > 0) {
        const coutRow = chargesResult.rows[0]
        console.log(`🔧 Mise à jour: ${chargesValue}€ → ${beneficeValue}€`)
        
        // Mettre à jour total_genere
        await pool.query(`
          UPDATE cout_par_salaire 
          SET total_genere = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [beneficeValue, coutRow.id])
        
        // Recalculer le RAP
        const rapResult = await pool.query(
          `SELECT calculer_rap_avec_paiements($1) as rap_actuel`,
          [coutRow.id]
        )
        const newRap = parseFloat(rapResult.rows[0].rap_actuel || 0)
        await pool.query(
          `UPDATE cout_par_salaire SET rap = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [newRap, coutRow.id]
        )
        
        console.log(`✅ CHIKHA SALEM synchronisé: ${beneficeValue}€ (RAP: ${newRap}€)`)
      }
    }
    
    // 5. Vérification finale
    console.log('\n✅ Vérification finale:')
    const finalCheck = await pool.query(`
      SELECT 
        nom, prenom, matricule, total_genere, rap, updated_at
      FROM cout_par_salaire 
      WHERE LOWER(nom) = LOWER('CHIKHA') AND LOWER(prenom) = LOWER('SALEM')
      AND mois = 5 AND annee = 2025
    `)
    
    if (finalCheck.rows.length > 0) {
      const row = finalCheck.rows[0]
      console.log(`✅ CHIKHA SALEM après synchronisation:`)
      console.log(`   - Total Généré: ${row.total_genere}€`)
      console.log(`   - RAP: ${row.rap}€`)
      console.log(`   - Mis à jour: ${row.updated_at}`)
      
      const finalChargesValue = parseFloat(row.total_genere || 0)
      const finalDifference = beneficeValue - finalChargesValue
      
      if (Math.abs(finalDifference) < 0.01) {
        console.log('✅ COHÉRENCE RÉTABLIE !')
        console.log('💡 Les deux sections affichent maintenant la même valeur')
      } else {
        console.log('❌ Incohérence persistante')
        console.log(`💡 Différence restante: ${finalDifference}€`)
      }
    }
    
    // 6. Créer un script de test pour le navigateur
    console.log('\n📝 Script de test pour le navigateur:')
    const browserTestScript = `
// Script de test pour vérifier la cohérence de CHIKHA SALEM
// Exécuter dans la console du navigateur (F12)

console.log('🧪 Test de cohérence pour CHIKHA SALEM...')

// Test 1: Vérifier l'API cout-par-salaire
fetch('/api/cout-par-salaire?mois=5&annee=2025')
  .then(response => response.json())
  .then(data => {
    console.log('📊 API cout-par-salaire:', data)
    
    if (data.success && data.couts) {
      const chikhaSalem = data.couts.find(cout => 
        cout.nom.toLowerCase() === 'chikha' && cout.prenom.toLowerCase() === 'salem'
      )
      
      if (chikhaSalem) {
        console.log('✅ CHIKHA SALEM trouvé dans Charges par Salarié:')
        console.log(\`   - Total Généré: \${chikhaSalem.total_genere}€\`)
        console.log(\`   - RAP: \${chikhaSalem.rap}€\`)
      } else {
        console.log('❌ CHIKHA SALEM non trouvé dans Charges par Salarié')
      }
    }
  })
  .catch(error => {
    console.error('❌ Erreur API cout-par-salaire:', error)
  })

// Test 2: Vérifier l'API recap-calcul (Bénéfice Brut)
fetch('/api/recap-calcul?startDate=2025-05-01&endDate=2025-05-31')
  .then(response => response.json())
  .then(data => {
    console.log('📊 API recap-calcul (Bénéfice Brut):', data)
    
    if (data.success && data.recettesParTechnicien) {
      const chikhaSalem = data.recettesParTechnicien.find(recette => 
        recette.employe_nom.toLowerCase() === 'chikha' && recette.employe_prenom.toLowerCase() === 'salem'
      )
      
      if (chikhaSalem) {
        console.log('✅ CHIKHA SALEM trouvé dans Bénéfice Brut:')
        console.log(\`   - Recette Technicien: \${chikhaSalem.total_recette_technicien}€\`)
        console.log(\`   - Nombre d'interventions: \${chikhaSalem.nombre_interventions}\`)
      } else {
        console.log('❌ CHIKHA SALEM non trouvé dans Bénéfice Brut')
      }
    }
  })
  .catch(error => {
    console.error('❌ Erreur API recap-calcul:', error)
  })
`
    
    console.log('📄 Script de test créé')
    console.log('💡 Exécutez ce script dans la console du navigateur (F12)')
    
    console.log('\n🎯 Vérification terminée !')
    console.log('💡 CHIKHA SALEM devrait maintenant être cohérent entre les deux sections')
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message)
  } finally {
    await pool.end()
  }
}

checkChikhaSalemInconsistency()
