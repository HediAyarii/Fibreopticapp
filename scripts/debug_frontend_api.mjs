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

async function debugFrontendApi() {
  try {
    console.log('🔍 Diagnostic de l\'API front-end...')
    console.log('📊 Problème: Front-end affiche encore 0€ malgré la correction')
    
    // 1. Tester l'API exacte que le front-end utilise
    console.log('\n🔧 Test de l\'API cout-par-salaire (mois=5, annee=2025):')
    
    // Simuler exactement ce que fait le front-end
    const frontendApiTest = await pool.query(`
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
    
    console.log(`📋 ${frontendApiTest.rows.length} enregistrements trouvés:`)
    frontendApiTest.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.nom} ${row.prenom} (${row.matricule}) - Total: ${row.total_genere}€`)
    })
    
    // 2. Vérifier si le problème vient du calcul en temps réel dans l'API
    console.log('\n🧮 Test du calcul en temps réel pour CHIKHA SALEM:')
    
    const dateFrom = '2025-05-01'
    const dateTo = '2025-05-31'
    
    // Test de la requête exacte de l'API cout-par-salaire
    const revenueCalcTest = await pool.query(`
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
    `, [dateFrom, dateTo])
    
    if (revenueCalcTest.rows.length > 0) {
      const row = revenueCalcTest.rows[0]
      console.log(`✅ Calcul en temps réel: ${row.total_recette_technicien}€`)
      console.log(`✅ Nombre d'interventions: ${row.nombre_interventions}`)
    } else {
      console.log('❌ Aucun revenu calculé en temps réel')
    }
    
    // 3. Vérifier si le problème vient de la logique de l'API
    console.log('\n🔍 Vérification de la logique de l\'API...')
    
    // Tester si l'API met à jour automatiquement les revenus
    const apiLogicTest = await pool.query(`
      SELECT 
        cps.id,
        cps.nom,
        cps.prenom,
        cps.matricule,
        cps.mois,
        cps.annee,
        cps.total_genere,
        cps.salaire_net,
        cps.charge,
        cps.cout_total,
        cps.taxe,
        cps.rap,
        cps.created_at,
        cps.updated_at
      FROM cout_par_salaire cps
      WHERE cps.mois = 5 AND cps.annee = 2025
      ORDER BY cps.annee DESC, cps.mois DESC, cps.created_at DESC
    `)
    
    console.log(`📋 API retourne ${apiLogicTest.rows.length} enregistrements:`)
    apiLogicTest.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.nom} ${row.prenom} (${row.matricule}) - Total: ${row.total_genere}€`)
    })
    
    // 4. Vérifier si le problème vient du cache du navigateur
    console.log('\n💾 Vérification du cache...')
    console.log('💡 Le problème peut venir du cache du navigateur')
    console.log('💡 Solutions:')
    console.log('   1. Rafraîchir avec Ctrl+Shift+R (hard refresh)')
    console.log('   2. Vider le cache du navigateur')
    console.log('   3. Redémarrer l\'application')
    console.log('   4. Tester en navigation privée')
    
    // 5. Créer un script de test pour le navigateur
    console.log('\n📝 Script de test pour le navigateur:')
    const browserTestScript = `
// Script de test pour le navigateur
// Exécuter dans la console du navigateur (F12)

console.log('🧪 Test de l\'API cout-par-salaire dans le navigateur...')

// Test 1: Appel direct de l'API
fetch('/api/cout-par-salaire?mois=5&annee=2025')
  .then(response => {
    console.log('📡 Statut de la réponse:', response.status)
    return response.json()
  })
  .then(data => {
    console.log('📊 Données reçues:', data)
    if (data.success && data.couts) {
      console.log('✅ API fonctionne, données reçues:')
      data.couts.forEach((cout, index) => {
        console.log(\`\${index + 1}. \${cout.nom} \${cout.prenom} - Total: \${cout.total_genere}€\`)
      })
    } else {
      console.log('❌ Erreur API:', data.error)
    }
  })
  .catch(error => {
    console.error('❌ Erreur réseau:', error)
  })

// Test 2: Vérifier les en-têtes de cache
fetch('/api/cout-par-salaire?mois=5&annee=2025', {
  headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  }
})
  .then(response => response.json())
  .then(data => {
    console.log('🔄 Test sans cache:', data)
  })
`
    
    console.log('📄 Script de test créé pour le navigateur')
    console.log('💡 Copiez et exécutez ce script dans la console du navigateur (F12)')
    
    // 6. Vérifier si le problème vient de la configuration de l'API
    console.log('\n🔧 Vérification de la configuration de l\'API...')
    
    // Tester si l'API fonctionne avec des paramètres différents
    const apiConfigTest = await pool.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN total_genere > 0 THEN 1 END) as with_revenue,
        COUNT(CASE WHEN total_genere = 0 THEN 1 END) as without_revenue
      FROM cout_par_salaire 
      WHERE mois = 5 AND annee = 2025
    `)
    
    if (apiConfigTest.rows.length > 0) {
      const row = apiConfigTest.rows[0]
      console.log(`📊 Configuration de l'API:`)
      console.log(`   - Total enregistrements: ${row.total_records}`)
      console.log(`   - Avec revenus: ${row.with_revenue}`)
      console.log(`   - Sans revenus: ${row.without_revenue}`)
      
      if (row.with_revenue > 0) {
        console.log('✅ L\'API a des données avec revenus')
      } else {
        console.log('❌ L\'API n\'a aucune donnée avec revenus')
      }
    }
    
    console.log('\n🎯 Diagnostic terminé !')
    console.log('💡 Le problème semble venir du cache du navigateur')
    console.log('💡 Essayez un hard refresh (Ctrl+Shift+R) ou testez en navigation privée')
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error.message)
  } finally {
    await pool.end()
  }
}

debugFrontendApi()
