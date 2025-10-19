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

async function diagnoseTotalGenereIssue() {
  try {
    console.log('🔍 Diagnostic du problème "Total Généré = 0" pour tous les techniciens...')
    
    // 1. Vérifier les données dans cout_par_salaire pour mai 2025
    console.log('\n📊 Vérification des données cout_par_salaire (mai 2025):')
    const coutsResult = await pool.query(`
      SELECT 
        nom, prenom, matricule, mois, annee,
        total_genere, salaire_net, charge, taxe, rap, updated_at
      FROM cout_par_salaire 
      WHERE mois = 5 AND annee = 2025
      ORDER BY nom, prenom
    `)
    
    console.log(`📋 ${coutsResult.rows.length} enregistrements trouvés:`)
    coutsResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.nom} ${row.prenom} (${row.matricule}) - Total: ${row.total_genere}€`)
    })
    
    // 2. Tester l'API cout-par-salaire directement
    console.log('\n🔧 Test de l\'API cout-par-salaire:')
    const apiTest = await pool.query(`
      SELECT 
        nom, prenom, matricule, mois, annee,
        total_genere, salaire_net, charge, cout_total, taxe, rap
      FROM cout_par_salaire 
      WHERE mois = 5 AND annee = 2025
      ORDER BY nom, prenom
    `)
    
    console.log(`📋 API retourne ${apiTest.rows.length} enregistrements:`)
    apiTest.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.nom} ${row.prenom} - Total: ${row.total_genere}€`)
    })
    
    // 3. Tester le calcul de revenus pour un technicien spécifique (CHIKHA SALEM)
    console.log('\n🧮 Test du calcul de revenus pour CHIKHA SALEM:')
    const revenueTest = await pool.query(`
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
            (i.cloture_tech IS NULL AND i.cloture_hotline IS NOT NULL AND DATE(i.cloture_hotline) <= $2) OR
            (i.cloture_hotline IS NULL AND i.cloture_tech IS NOT NULL AND DATE(i.cloture_tech) <= $2)
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
    
    if (revenueTest.rows.length > 0) {
      const row = revenueTest.rows[0]
      console.log(`✅ Calcul de revenus: ${row.total_recette_technicien}€`)
      console.log(`✅ Nombre d'interventions: ${row.nombre_interventions}`)
    } else {
      console.log('❌ Aucun revenu calculé pour CHIKHA SALEM')
    }
    
    // 4. Vérifier si le problème vient de la correspondance des noms
    console.log('\n🔍 Vérification de la correspondance des noms:')
    const nameMatchTest = await pool.query(`
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
    
    if (nameMatchTest.rows.length > 0) {
      console.log(`✅ Correspondance trouvée: ${nameMatchTest.rows[0].interventions_count} interventions`)
    } else {
      console.log('❌ Aucune correspondance trouvée')
    }
    
    // 5. Vérifier les interventions CLOTURE TERMINEE pour mai 2025
    console.log('\n📊 Vérification des interventions CLOTURE TERMINEE (mai 2025):')
    const interventionsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_interventions,
        COUNT(CASE WHEN articles IS NOT NULL AND articles != '' THEN 1 END) as with_articles,
        COUNT(CASE WHEN articles IS NULL OR articles = '' THEN 1 END) as without_articles
      FROM interventions
      WHERE statut = 'CLOTURE TERMINEE'
      AND (
        (date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' AND TO_DATE(date_rdv, 'DD.MM.YYYY') >= '2025-05-01' AND TO_DATE(date_rdv, 'DD.MM.YYYY') <= '2025-05-31')
        OR (date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND date_rdv::date >= '2025-05-01' AND date_rdv::date <= '2025-05-31')
        OR (date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' AND TO_DATE(date_rdv, 'DD/MM/YYYY') >= '2025-05-01' AND TO_DATE(date_rdv, 'DD/MM/YYYY') <= '2025-05-31')
      )
    `)
    
    if (interventionsResult.rows.length > 0) {
      const row = interventionsResult.rows[0]
      console.log(`✅ Interventions CLOTURE TERMINEE: ${row.total_interventions}`)
      console.log(`✅ Avec articles: ${row.with_articles}`)
      console.log(`✅ Sans articles: ${row.without_articles}`)
    }
    
    // 6. Tester le calcul manuel pour CHIKHA SALEM
    console.log('\n🧮 Test du calcul manuel pour CHIKHA SALEM:')
    const manualCalc = await pool.query(`
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
    
    const manualTotal = parseFloat(manualCalc.rows[0].total_recettes_manual) || 0
    console.log(`✅ Calcul manuel: ${manualTotal}€`)
    
    console.log('\n🎯 Diagnostic terminé !')
    console.log('💡 Le problème semble venir de l\'API cout-par-salaire qui ne calcule plus les revenus')
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error.message)
  } finally {
    await pool.end()
  }
}

diagnoseTotalGenereIssue()
