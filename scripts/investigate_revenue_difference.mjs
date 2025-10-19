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

async function investigateRevenueDifference() {
  try {
    console.log('🔍 Investigation de la différence de revenus pour CHIKHA SALEM...')
    console.log('📊 Problème: API trouve 3710€, calcul manuel trouve 3770€')
    
    // 1. Calcul manuel (comme dans nos scripts précédents)
    console.log('\n🧮 Calcul manuel (méthode précédente):')
    const manualResult = await pool.query(`
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
        ) as total_recettes_manual
      FROM interventions i
      WHERE LOWER(i.nom_technicien) = LOWER('CHIKHA') AND LOWER(i.prenom_technicien) = LOWER('SALEM')
      AND (
        (i.date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' AND TO_DATE(i.date_rdv, 'DD.MM.YYYY') >= '2025-05-01' AND TO_DATE(i.date_rdv, 'DD.MM.YYYY') <= '2025-05-31')
        OR (i.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND i.date_rdv::date >= '2025-05-01' AND i.date_rdv::date <= '2025-05-31')
        OR (i.date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') >= '2025-05-01' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') <= '2025-05-31')
      )
    `)
    
    const manualTotal = parseFloat(manualResult.rows[0].total_recettes_manual) || 0
    console.log(`✅ Calcul manuel: ${manualTotal}€`)
    
    // 2. Calcul de l'API (méthode cout-par-salaire)
    console.log('\n🔧 Calcul de l\'API (méthode cout-par-salaire):')
    const apiResult = await pool.query(`
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
          AND (i.cloture_tech >= $1 OR i.cloture_hotline >= $1)
          AND (i.cloture_tech <= $2 OR i.cloture_hotline <= $2)
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
    
    if (apiResult.rows.length > 0) {
      const apiTotal = parseFloat(apiResult.rows[0].total_recette_technicien) || 0
      console.log(`✅ Calcul API: ${apiTotal}€`)
      console.log(`✅ Nombre d'interventions: ${apiResult.rows[0].nombre_interventions}`)
    } else {
      console.log('❌ Aucun résultat trouvé par l\'API')
    }
    
    // 3. Comparer les deux méthodes
    console.log('\n📊 Comparaison:')
    console.log(`   - Calcul manuel: ${manualTotal}€`)
    if (apiResult.rows.length > 0) {
      const apiTotal = parseFloat(apiResult.rows[0].total_recette_technicien) || 0
      console.log(`   - Calcul API: ${apiTotal}€`)
      console.log(`   - Différence: ${Math.abs(manualTotal - apiTotal)}€`)
    }
    
    // 4. Analyser les différences dans les filtres
    console.log('\n🔍 Analyse des différences de filtres:')
    
    // Filtre manuel: date_rdv
    console.log('\n📅 Filtre manuel (date_rdv):')
    const manualFilterResult = await pool.query(`
      SELECT 
        i.id, i.num_inter, i.date_rdv, i.statut, i.articles,
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
        END as recette
      FROM interventions i
      WHERE LOWER(i.nom_technicien) = LOWER('CHIKHA') AND LOWER(i.prenom_technicien) = LOWER('SALEM')
      AND (
        (i.date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' AND TO_DATE(i.date_rdv, 'DD.MM.YYYY') >= '2025-05-01' AND TO_DATE(i.date_rdv, 'DD.MM.YYYY') <= '2025-05-31')
        OR (i.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND i.date_rdv::date >= '2025-05-01' AND i.date_rdv::date <= '2025-05-31')
        OR (i.date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') >= '2025-05-01' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') <= '2025-05-31')
      )
      AND i.statut = 'CLOTURE TERMINEE'
      ORDER BY i.date_rdv
    `)
    
    console.log(`📋 ${manualFilterResult.rows.length} interventions trouvées avec filtre manuel:`)
    let manualSum = 0
    manualFilterResult.rows.forEach((row, index) => {
      const recette = parseFloat(row.recette) || 0
      manualSum += recette
      console.log(`${index + 1}. ${row.num_inter} - ${row.date_rdv} - ${recette}€`)
    })
    console.log(`✅ Total manuel: ${manualSum}€`)
    
    // Filtre API: cloture_tech/cloture_hotline
    console.log('\n📅 Filtre API (cloture_tech/cloture_hotline):')
    const apiFilterResult = await pool.query(`
      SELECT 
        i.id, i.num_inter, i.date_rdv, i.cloture_tech, i.cloture_hotline, i.statut, i.articles,
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
        END as recette
      FROM interventions i
      WHERE LOWER(i.nom_technicien) = LOWER('CHIKHA') AND LOWER(i.prenom_technicien) = LOWER('SALEM')
      AND i.statut = 'CLOTURE TERMINEE'
      AND i.articles IS NOT NULL 
      AND i.articles != ''
      AND (i.cloture_tech >= '2025-05-01' OR i.cloture_hotline >= '2025-05-01')
      AND (i.cloture_tech <= '2025-05-31' OR i.cloture_hotline <= '2025-05-31')
      ORDER BY i.date_rdv
    `)
    
    console.log(`📋 ${apiFilterResult.rows.length} interventions trouvées avec filtre API:`)
    let apiSum = 0
    apiFilterResult.rows.forEach((row, index) => {
      const recette = parseFloat(row.recette) || 0
      apiSum += recette
      console.log(`${index + 1}. ${row.num_inter} - ${row.date_rdv} (clôture: ${row.cloture_tech || row.cloture_hotline}) - ${recette}€`)
    })
    console.log(`✅ Total API: ${apiSum}€`)
    
    // 5. Identifier les interventions manquantes
    console.log('\n🔍 Identification des interventions manquantes:')
    const manualIds = manualFilterResult.rows.map(row => row.id)
    const apiIds = apiFilterResult.rows.map(row => row.id)
    
    const missingInApi = manualIds.filter(id => !apiIds.includes(id))
    const missingInManual = apiIds.filter(id => !manualIds.includes(id))
    
    console.log(`📊 Interventions manquantes dans l'API: ${missingInApi.length}`)
    if (missingInApi.length > 0) {
      console.log(`   IDs: ${missingInApi.join(', ')}`)
    }
    
    console.log(`📊 Interventions manquantes dans le calcul manuel: ${missingInManual.length}`)
    if (missingInManual.length > 0) {
      console.log(`   IDs: ${missingInManual.join(', ')}`)
    }
    
    console.log('\n🎯 Conclusion:')
    console.log(`   - Calcul manuel (date_rdv): ${manualSum}€`)
    console.log(`   - Calcul API (cloture): ${apiSum}€`)
    console.log(`   - Différence: ${Math.abs(manualSum - apiSum)}€`)
    
    if (Math.abs(manualSum - apiSum) > 0.01) {
      console.log('❌ Les deux méthodes donnent des résultats différents')
      console.log('💡 La différence vient des filtres de dates utilisés')
    } else {
      console.log('✅ Les deux méthodes donnent le même résultat')
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'investigation:', error.message)
  } finally {
    await pool.end()
  }
}

investigateRevenueDifference()
