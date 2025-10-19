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

async function debugApiFrontendIssue() {
  try {
    console.log('🔍 Diagnostic approfondi du problème "Total Généré = 0"...')
    console.log('📊 Problème: Front-end affiche 0€ malgré les corrections')
    
    // 1. Vérifier exactement ce que l'API retourne
    console.log('\n🔧 Test de l\'API cout-par-salaire exacte:')
    
    // Simuler exactement l'appel que fait le front-end
    const frontendApiCall = await pool.query(`
      SELECT 
        id,
        nom,
        prenom,
        salaire_net,
        salaire_brut,
        cout_total,
        charge,
        mois,
        annee,
        matricule,
        taxe,
        impot,
        penalite,
        total_genere,
        rap,
        created_at,
        updated_at
      FROM cout_par_salaire 
      WHERE mois = 5 AND annee = 2025
      ORDER BY annee DESC, mois DESC, nom, prenom
    `)
    
    console.log(`📋 API retourne ${frontendApiCall.rows.length} enregistrements:`)
    frontendApiCall.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.nom} ${row.prenom} (${row.matricule}) - Total: ${row.total_genere}€`)
    })
    
    // 2. Vérifier si le problème vient de la logique de calcul en temps réel
    console.log('\n🧮 Test de la logique de calcul en temps réel:')
    
    // Tester pour un technicien spécifique (CHIKHA SALEM)
    const realTimeCalc = await pool.query(`
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
          -- Correspondance améliorée avec normalisation
          (
            LOWER(TRIM(e.prenom)) = LOWER(TRIM(i.prenom_technicien)) AND 
            LOWER(TRIM(e.nom)) = LOWER(TRIM(i.nom_technicien))
          ) OR (
            -- Correspondance avec tirets (ex: Mohamed-Bechir vs BECHIRMOULAHI)
            LOWER(REGEXP_REPLACE(e.prenom, '[^a-zA-Z0-9]', '', 'g')) = LOWER(REGEXP_REPLACE(i.prenom_technicien, '[^a-zA-Z0-9]', '', 'g')) AND
            LOWER(REGEXP_REPLACE(e.nom, '[^a-zA-Z0-9]', '', 'g')) = LOWER(REGEXP_REPLACE(i.nom_technicien, '[^a-zA-Z0-9]', '', 'g'))
          ) OR (
            -- Correspondance inversée
            LOWER(TRIM(e.prenom)) = LOWER(TRIM(i.nom_technicien)) AND 
            LOWER(TRIM(e.nom)) = LOWER(TRIM(i.prenom_technicien))
          ) OR (
            -- Correspondance partielle (contient)
            (
              LOWER(e.prenom) LIKE '%' || LOWER(i.prenom_technicien) || '%' OR
              LOWER(i.prenom_technicien) LIKE '%' || LOWER(e.prenom) || '%'
            ) AND (
              LOWER(e.nom) LIKE '%' || LOWER(i.nom_technicien) || '%' OR
              LOWER(i.nom_technicien) LIKE '%' || LOWER(e.nom) || '%'
            )
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
    `, ['2025-05-01', '2025-05-31'])
    
    if (realTimeCalc.rows.length > 0) {
      const row = realTimeCalc.rows[0]
      console.log(`✅ Calcul en temps réel pour CHIKHA SALEM: ${row.total_recette_technicien}€`)
      console.log(`✅ Nombre d'interventions: ${row.nombre_interventions}`)
    } else {
      console.log('❌ Aucun revenu calculé en temps réel pour CHIKHA SALEM')
    }
    
    // 3. Vérifier si le problème vient de la correspondance des noms
    console.log('\n🔍 Vérification de la correspondance des noms:')
    
    // Vérifier les employés dans la table employes
    const employesCheck = await pool.query(`
      SELECT id, nom, prenom, matricule
      FROM employes 
      WHERE LOWER(nom) = LOWER('CHIKHA') AND LOWER(prenom) = LOWER('SALEM')
    `)
    
    if (employesCheck.rows.length > 0) {
      console.log(`✅ Employé trouvé dans la table employes: ${employesCheck.rows[0].nom} ${employesCheck.rows[0].prenom}`)
    } else {
      console.log('❌ Employé non trouvé dans la table employes')
    }
    
    // 4. Vérifier les interventions pour CHIKHA SALEM
    console.log('\n📊 Vérification des interventions pour CHIKHA SALEM:')
    const interventionsCheck = await pool.query(`
      SELECT 
        COUNT(*) as total_interventions,
        COUNT(CASE WHEN statut = 'CLOTURE TERMINEE' THEN 1 END) as cloture_terminee,
        COUNT(CASE WHEN articles IS NOT NULL AND articles != '' THEN 1 END) as with_articles
      FROM interventions
      WHERE LOWER(nom_technicien) = LOWER('CHIKHA') AND LOWER(prenom_technicien) = LOWER('SALEM')
      AND (
        (date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' AND TO_DATE(date_rdv, 'DD.MM.YYYY') >= '2025-05-01' AND TO_DATE(date_rdv, 'DD.MM.YYYY') <= '2025-05-31')
        OR (date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND date_rdv::date >= '2025-05-01' AND date_rdv::date <= '2025-05-31')
        OR (date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' AND TO_DATE(date_rdv, 'DD/MM/YYYY') >= '2025-05-01' AND TO_DATE(date_rdv, 'DD/MM/YYYY') <= '2025-05-31')
      )
    `)
    
    if (interventionsCheck.rows.length > 0) {
      const row = interventionsCheck.rows[0]
      console.log(`✅ Interventions trouvées: ${row.total_interventions}`)
      console.log(`✅ CLOTURE TERMINEE: ${row.cloture_terminee}`)
      console.log(`✅ Avec articles: ${row.with_articles}`)
    }
    
    // 5. Tester la correspondance exacte
    console.log('\n🔍 Test de correspondance exacte:')
    const exactMatchTest = await pool.query(`
      SELECT 
        e.id, e.nom, e.prenom, e.matricule,
        COUNT(i.id) as interventions_count
      FROM employes e
      LEFT JOIN interventions i ON (
        LOWER(TRIM(e.prenom)) = LOWER(TRIM(i.prenom_technicien)) AND 
        LOWER(TRIM(e.nom)) = LOWER(TRIM(i.nom_technicien))
      )
      WHERE e.nom = 'CHIKHA' AND e.prenom = 'SALEM'
      GROUP BY e.id, e.nom, e.prenom, e.matricule
    `)
    
    if (exactMatchTest.rows.length > 0) {
      const row = exactMatchTest.rows[0]
      console.log(`✅ Correspondance exacte: ${row.interventions_count} interventions`)
    } else {
      console.log('❌ Aucune correspondance exacte trouvée')
    }
    
    // 6. Vérifier si le problème vient de l'API elle-même
    console.log('\n🔧 Test de l\'API avec simulation complète:')
    
    // Simuler le processus complet de l'API
    const apiSimulation = await pool.query(`
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
          -- Correspondance améliorée avec normalisation
          (
            LOWER(TRIM(e.prenom)) = LOWER(TRIM(i.prenom_technicien)) AND 
            LOWER(TRIM(e.nom)) = LOWER(TRIM(i.nom_technicien))
          ) OR (
            -- Correspondance avec tirets (ex: Mohamed-Bechir vs BECHIRMOULAHI)
            LOWER(REGEXP_REPLACE(e.prenom, '[^a-zA-Z0-9]', '', 'g')) = LOWER(REGEXP_REPLACE(i.prenom_technicien, '[^a-zA-Z0-9]', '', 'g')) AND
            LOWER(REGEXP_REPLACE(e.nom, '[^a-zA-Z0-9]', '', 'g')) = LOWER(REGEXP_REPLACE(i.nom_technicien, '[^a-zA-Z0-9]', '', 'g'))
          ) OR (
            -- Correspondance inversée
            LOWER(TRIM(e.prenom)) = LOWER(TRIM(i.nom_technicien)) AND 
            LOWER(TRIM(e.nom)) = LOWER(TRIM(i.prenom_technicien))
          ) OR (
            -- Correspondance partielle (contient)
            (
              LOWER(e.prenom) LIKE '%' || LOWER(i.prenom_technicien) || '%' OR
              LOWER(i.prenom_technicien) LIKE '%' || LOWER(e.prenom) || '%'
            ) AND (
              LOWER(e.nom) LIKE '%' || LOWER(i.nom_technicien) || '%' OR
              LOWER(i.nom_technicien) LIKE '%' || LOWER(e.nom) || '%'
            )
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
      GROUP BY employe_id, employe_nom, employe_prenom, matricule
      ORDER BY total_recette_technicien DESC
    `, ['2025-05-01', '2025-05-31'])
    
    console.log(`📋 Simulation API: ${apiSimulation.rows.length} techniciens trouvés:`)
    apiSimulation.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.employe_nom} ${row.employe_prenom} (${row.matricule}) - ${row.total_recette_technicien}€`)
    })
    
    // 7. Créer un script de test pour le navigateur
    console.log('\n📝 Script de test pour le navigateur:')
    const browserTestScript = `
// Script de test pour diagnostiquer le problème
// Exécuter dans la console du navigateur (F12)

console.log('🧪 Test de l\'API cout-par-salaire...')

// Test 1: Appel direct de l'API
fetch('/api/cout-par-salaire?mois=5&annee=2025')
  .then(response => {
    console.log('📡 Statut:', response.status)
    console.log('📡 Headers:', response.headers)
    return response.json()
  })
  .then(data => {
    console.log('📊 Données reçues:', data)
    
    if (data.success && data.couts) {
      console.log('✅ API fonctionne:')
      data.couts.forEach((cout, index) => {
        console.log(\`\${index + 1}. \${cout.nom} \${cout.prenom} - Total: \${cout.total_genere}€\`)
      })
      
      const withRevenue = data.couts.filter(cout => cout.total_genere > 0)
      const withoutRevenue = data.couts.filter(cout => cout.total_genere === 0)
      
      console.log(\`📈 Avec revenus: \${withRevenue.length}\`)
      console.log(\`📉 Sans revenus: \${withoutRevenue.length}\`)
      
      if (withoutRevenue.length > 0) {
        console.log('❌ Problème: Certains techniciens ont 0€')
        console.log('💡 Solutions:')
        console.log('   1. Vérifier la correspondance des noms')
        console.log('   2. Vérifier les interventions CLOTURE TERMINEE')
        console.log('   3. Vérifier les articles et pricing')
      }
    } else {
      console.log('❌ Erreur API:', data.error)
    }
  })
  .catch(error => {
    console.error('❌ Erreur réseau:', error)
  })
`
    
    console.log('📄 Script de test créé')
    console.log('💡 Exécutez ce script dans la console du navigateur (F12)')
    
    console.log('\n🎯 Diagnostic terminé !')
    console.log('💡 Le problème semble venir de la logique de calcul en temps réel')
    console.log('💡 L\'API ne trouve pas les correspondances entre employes et interventions')
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error.message)
  } finally {
    await pool.end()
  }
}

debugApiFrontendIssue()
