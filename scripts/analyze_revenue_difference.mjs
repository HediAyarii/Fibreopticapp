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

async function analyzeRevenueDifference() {
  try {
    console.log('🔍 Analyse de la différence de recettes pour CHIKHA SALEM...')
    console.log('📊 Différence: 3770.00€ (calcul interventions) - 3710.00€ (cout_par_salaire) = 60.00€')
    
    // 1. Vérifier les interventions avec recettes détaillées
    console.log('\n🔧 Analyse des interventions avec recettes:')
    const interventionDetails = await pool.query(`
      SELECT 
        i.id,
        i.num_inter,
        i.client,
        i.date_rdv,
        i.statut,
        i.articles,
        i.type_intervention,
        i.grille,
        -- Calcul de la recette pour chaque intervention
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
        END as recette_intervention
      FROM interventions i
      WHERE LOWER(i.nom_technicien) = LOWER('CHIKHA') AND LOWER(i.prenom_technicien) = LOWER('SALEM')
      AND (
        (i.date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' AND TO_DATE(i.date_rdv, 'DD.MM.YYYY') >= '2025-05-01' AND TO_DATE(i.date_rdv, 'DD.MM.YYYY') <= '2025-05-31')
        OR (i.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND i.date_rdv::date >= '2025-05-01' AND i.date_rdv::date <= '2025-05-31')
        OR (i.date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') >= '2025-05-01' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') <= '2025-05-31')
      )
      ORDER BY i.date_rdv DESC
      LIMIT 10
    `)
    
    console.log(`📋 ${interventionDetails.rows.length} interventions analysées:`)
    let totalRecettes = 0
    interventionDetails.rows.forEach((row, index) => {
      const recette = parseFloat(row.recette_intervention) || 0
      totalRecettes += recette
      console.log(`${index + 1}. ${row.num_inter} - ${row.client} - ${row.date_rdv} - ${row.statut} - ${recette}€`)
    })
    console.log(`💰 Total recettes (10 premières): ${totalRecettes}€`)
    
    // 2. Vérifier les interventions avec recettes > 0
    console.log('\n💎 Interventions avec recettes > 0:')
    const interventionsWithRevenue = await pool.query(`
      SELECT 
        i.id,
        i.num_inter,
        i.client,
        i.date_rdv,
        i.statut,
        i.articles,
        i.type_intervention,
        -- Calcul de la recette pour chaque intervention
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
        END as recette_intervention
      FROM interventions i
      WHERE LOWER(i.nom_technicien) = LOWER('CHIKHA') AND LOWER(i.prenom_technicien) = LOWER('SALEM')
      AND (
        (i.date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' AND TO_DATE(i.date_rdv, 'DD.MM.YYYY') >= '2025-05-01' AND TO_DATE(i.date_rdv, 'DD.MM.YYYY') <= '2025-05-31')
        OR (i.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND i.date_rdv::date >= '2025-05-01' AND i.date_rdv::date <= '2025-05-31')
        OR (i.date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') >= '2025-05-01' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') <= '2025-05-31')
      )
      AND (
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
      ) > 0
      ORDER BY recette_intervention DESC
    `)
    
    console.log(`📋 ${interventionsWithRevenue.rows.length} interventions avec recettes > 0:`)
    let totalRecettesPositives = 0
    interventionsWithRevenue.rows.forEach((row, index) => {
      const recette = parseFloat(row.recette_intervention) || 0
      totalRecettesPositives += recette
      console.log(`${index + 1}. ${row.num_inter} - ${row.client} - ${row.date_rdv} - ${recette}€`)
    })
    console.log(`💰 Total recettes positives: ${totalRecettesPositives}€`)
    
    // 3. Vérifier les interventions récentes (possibles mises à jour)
    console.log('\n🕒 Vérification des interventions récentes:')
    const recentInterventions = await pool.query(`
      SELECT 
        COUNT(*) as total,
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
    
    if (recentInterventions.rows.length > 0) {
      const row = recentInterventions.rows[0]
      console.log(`📊 Total interventions: ${row.total}`)
      console.log(`💰 Total recettes calculées: ${row.total_recettes}€`)
      console.log(`📈 Différence avec cout_par_salaire: ${(row.total_recettes - 3710).toFixed(2)}€`)
    }
    
    // 4. Vérifier si le total_généré a été mis à jour récemment
    console.log('\n🔄 Vérification de la mise à jour du total_généré:')
    const updateCheck = await pool.query(`
      SELECT 
        total_genere,
        updated_at,
        created_at
      FROM cout_par_salaire 
      WHERE LOWER(nom) = LOWER('CHIKHA') AND LOWER(prenom) = LOWER('SALEM')
      AND mois = 5 AND annee = 2025
    `)
    
    if (updateCheck.rows.length > 0) {
      const row = updateCheck.rows[0]
      console.log(`📅 Total généré: ${row.total_genere}€`)
      console.log(`📅 Créé le: ${row.created_at}`)
      console.log(`📅 Mis à jour le: ${row.updated_at}`)
    }
    
    console.log('\n🎯 Analyse terminée !')
    console.log('💡 La différence de 60€ peut être due à:')
    console.log('   - Des interventions ajoutées après la dernière mise à jour du total_généré')
    console.log('   - Des modifications de statut d\'interventions')
    console.log('   - Des mises à jour de pricing')
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error.message)
  } finally {
    await pool.end()
  }
}

analyzeRevenueDifference()
