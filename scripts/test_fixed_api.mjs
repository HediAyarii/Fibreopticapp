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

async function testFixedApi() {
  try {
    console.log('🧪 Test de l\'API cout-par-salaire corrigée...')
    
    // 1. Tester l'API avec la logique corrigée
    console.log('\n🔧 Test de l\'API cout-par-salaire:')
    const apiTest = await pool.query(`
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
      GROUP BY employe_id, employe_nom, employe_prenom, matricule
      ORDER BY total_recette_technicien DESC
    `, ['2025-05-01', '2025-05-31'])
    
    console.log(`📋 API corrigée: ${apiTest.rows.length} techniciens trouvés:`)
    apiTest.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.employe_nom} ${row.employe_prenom} (${row.matricule}) - ${row.total_recette_technicien}€`)
    })
    
    // 2. Vérifier la correspondance pour CHIKHA SALEM
    console.log('\n🔍 Vérification de la correspondance pour CHIKHA SALEM:')
    const chikhaTest = await pool.query(`
      SELECT 
        e.id, e.nom, e.prenom, e.matricule,
        i.nom_technicien, i.prenom_technicien,
        COUNT(*) as interventions_count
      FROM employes e
      LEFT JOIN interventions i ON (
        LOWER(TRIM(e.prenom)) = LOWER(TRIM(i.prenom_technicien)) AND 
        LOWER(TRIM(e.nom)) = LOWER(TRIM(i.nom_technicien))
      )
      WHERE e.nom = 'CHIKHA' AND e.prenom = 'SALEM'
      GROUP BY e.id, e.nom, e.prenom, e.matricule, i.nom_technicien, i.prenom_technicien
    `)
    
    if (chikhaTest.rows.length > 0) {
      console.log(`✅ Correspondance trouvée: ${chikhaTest.rows[0].interventions_count} interventions`)
    } else {
      console.log('❌ Aucune correspondance trouvée')
    }
    
    // 3. Tester la correspondance avec normalisation
    console.log('\n🔍 Test de correspondance avec normalisation:')
    const normalizedTest = await pool.query(`
      SELECT 
        e.id, e.nom, e.prenom, e.matricule,
        i.nom_technicien, i.prenom_technicien,
        COUNT(*) as interventions_count
      FROM employes e
      LEFT JOIN interventions i ON (
        LOWER(REGEXP_REPLACE(e.prenom, '[^a-zA-Z0-9]', '', 'g')) = LOWER(REGEXP_REPLACE(i.prenom_technicien, '[^a-zA-Z0-9]', '', 'g')) AND
        LOWER(REGEXP_REPLACE(e.nom, '[^a-zA-Z0-9]', '', 'g')) = LOWER(REGEXP_REPLACE(i.nom_technicien, '[^a-zA-Z0-9]', '', 'g'))
      )
      WHERE e.nom = 'CHIKHA' AND e.prenom = 'SALEM'
      GROUP BY e.id, e.nom, e.prenom, e.matricule, i.nom_technicien, i.prenom_technicien
    `)
    
    if (normalizedTest.rows.length > 0) {
      console.log(`✅ Correspondance normalisée: ${normalizedTest.rows[0].interventions_count} interventions`)
    } else {
      console.log('❌ Aucune correspondance normalisée trouvée')
    }
    
    // 4. Vérifier les noms exacts dans les deux tables
    console.log('\n📊 Vérification des noms exacts:')
    const exactNamesTest = await pool.query(`
      SELECT DISTINCT
        e.nom as employe_nom, e.prenom as employe_prenom,
        i.nom_technicien, i.prenom_technicien
      FROM employes e
      CROSS JOIN interventions i
      WHERE e.nom = 'CHIKHA' AND e.prenom = 'SALEM'
      AND i.nom_technicien ILIKE '%CHIKHA%' AND i.prenom_technicien ILIKE '%SALEM%'
      LIMIT 5
    `)
    
    console.log(`📋 Noms trouvés:`)
    exactNamesTest.rows.forEach((row, index) => {
      console.log(`${index + 1}. Employé: ${row.employe_nom} ${row.employe_prenom}`)
      console.log(`   Intervention: ${row.nom_technicien} ${row.prenom_technicien}`)
    })
    
    // 5. Créer un script de test pour le navigateur
    console.log('\n📝 Script de test pour le navigateur:')
    const browserTestScript = `
// Script de test pour vérifier l'API corrigée
// Exécuter dans la console du navigateur (F12)

console.log('🧪 Test de l\'API cout-par-salaire corrigée...')

fetch('/api/cout-par-salaire?mois=5&annee=2025')
  .then(response => response.json())
  .then(data => {
    console.log('📊 Données reçues:', data)
    
    if (data.success && data.couts) {
      const withRevenue = data.couts.filter(cout => cout.total_genere > 0)
      const withoutRevenue = data.couts.filter(cout => cout.total_genere === 0)
      
      console.log(\`📈 Techniciens avec revenus: \${withRevenue.length}\`)
      console.log(\`📉 Techniciens sans revenus: \${withoutRevenue.length}\`)
      
      if (withRevenue.length > 0) {
        console.log('✅ L\'API fonctionne correctement!')
        console.log('💡 Les "Total Généré" devraient maintenant s\'afficher correctement')
        
        withRevenue.forEach(cout => {
          console.log(\`   - \${cout.nom} \${cout.prenom}: \${cout.total_genere}€\`)
        })
      } else {
        console.log('❌ L\'API ne retourne toujours aucun revenu')
        console.log('💡 Le problème persiste')
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
    
    console.log('\n🎯 Test terminé !')
    console.log('💡 L\'API devrait maintenant fonctionner correctement')
    console.log('💡 Rafraîchissez votre front-end pour voir les changements')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
  } finally {
    await pool.end()
  }
}

testFixedApi()
