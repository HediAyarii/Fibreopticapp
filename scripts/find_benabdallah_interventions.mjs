import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024',
  ssl: false,
  max: 50,
  min: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
  acquireTimeoutMillis: 10000,
  allowExitOnIdle: true,
});

async function findBenabdallahInterventions() {
  console.log('🔍 Recherche des interventions BENADBALLAH...');
  
  try {
    // 1. Rechercher toutes les variations possibles du nom
    console.log('\n📊 1. Recherche par variations du nom:');
    const variationsResult = await pool.query(`
      SELECT 
        nom_technicien,
        prenom_technicien,
        COUNT(*) as nombre_interventions,
        SUM(
          CASE 
            WHEN statut = 'CLOTURE TERMINEE' THEN
              COALESCE(
                (SELECT SUM(
                  CASE 
                    WHEN cp.prix_tech IS NOT NULL THEN cp.prix_tech
                    ELSE 0
                  END
                )
                FROM unnest(string_to_array(articles, ',')) as article_item
                LEFT JOIN company_pricing cp ON 
                  TRIM(SPLIT_PART(article_item, 'x', 1)) = cp.service_code
                  AND cp.company_name = 'ERT OUEST'
                  AND cp.category = type_intervention
                ), 0
              )
            ELSE 0
          END
        ) as total_recette
      FROM interventions
      WHERE (
        LOWER(nom_technicien) LIKE '%ben%' AND LOWER(nom_technicien) LIKE '%abdallah%'
        OR LOWER(nom_technicien) LIKE '%ben%' AND LOWER(nom_technicien) LIKE '%adballah%'
        OR LOWER(nom_technicien) LIKE '%ben%' AND LOWER(nom_technicien) LIKE '%abdallah%'
        OR LOWER(nom_technicien) LIKE '%ben%' AND LOWER(nom_technicien) LIKE '%adballah%'
        OR LOWER(prenom_technicien) LIKE '%walid%'
        OR LOWER(prenom_technicien) LIKE '%taoufik%'
      )
      AND statut = 'CLOTURE TERMINEE'
      AND articles IS NOT NULL 
      AND articles != ''
      GROUP BY nom_technicien, prenom_technicien
      ORDER BY total_recette DESC
    `);
    
    console.log(`   📊 Résultats: ${variationsResult.rows.length} enregistrements`);
    variationsResult.rows.forEach((row, index) => {
      console.log(`      ${index + 1}. ${row.nom_technicien} ${row.prenom_technicien}`);
      console.log(`         Interventions: ${row.nombre_interventions}`);
      console.log(`         Total Recette: ${row.total_recette}€`);
    });
    
    // 2. Rechercher par matricule TECH_BENWA
    console.log('\n📊 2. Recherche par matricule TECH_BENWA:');
    const matriculeResult = await pool.query(`
      SELECT 
        nom_technicien,
        prenom_technicien,
        COUNT(*) as nombre_interventions,
        SUM(
          CASE 
            WHEN statut = 'CLOTURE TERMINEE' THEN
              COALESCE(
                (SELECT SUM(
                  CASE 
                    WHEN cp.prix_tech IS NOT NULL THEN cp.prix_tech
                    ELSE 0
                  END
                )
                FROM unnest(string_to_array(articles, ',')) as article_item
                LEFT JOIN company_pricing cp ON 
                  TRIM(SPLIT_PART(article_item, 'x', 1)) = cp.service_code
                  AND cp.company_name = 'ERT OUEST'
                  AND cp.category = type_intervention
                ), 0
              )
            ELSE 0
          END
        ) as total_recette
      FROM interventions
      WHERE CONCAT('TECH_', UPPER(SUBSTRING(nom_technicien, 1, 3)), UPPER(SUBSTRING(prenom_technicien, 1, 2))) = 'TECH_BENWA'
        AND statut = 'CLOTURE TERMINEE'
        AND articles IS NOT NULL 
        AND articles != ''
      GROUP BY nom_technicien, prenom_technicien
      ORDER BY total_recette DESC
    `);
    
    console.log(`   📊 Résultats: ${matriculeResult.rows.length} enregistrements`);
    matriculeResult.rows.forEach((row, index) => {
      console.log(`      ${index + 1}. ${row.nom_technicien} ${row.prenom_technicien}`);
      console.log(`         Interventions: ${row.nombre_interventions}`);
      console.log(`         Total Recette: ${row.total_recette}€`);
    });
    
    // 3. Rechercher toutes les interventions récentes pour identifier le bon nom
    console.log('\n📊 3. Toutes les interventions récentes (Mai 2025):');
    const allRecentResult = await pool.query(`
      SELECT 
        nom_technicien,
        prenom_technicien,
        COUNT(*) as nombre_interventions,
        SUM(
          CASE 
            WHEN statut = 'CLOTURE TERMINEE' THEN
              COALESCE(
                (SELECT SUM(
                  CASE 
                    WHEN cp.prix_tech IS NOT NULL THEN cp.prix_tech
                    ELSE 0
                  END
                )
                FROM unnest(string_to_array(articles, ',')) as article_item
                LEFT JOIN company_pricing cp ON 
                  TRIM(SPLIT_PART(article_item, 'x', 1)) = cp.service_code
                  AND cp.company_name = 'ERT OUEST'
                  AND cp.category = type_intervention
                ), 0
              )
            ELSE 0
          END
        ) as total_recette
      FROM interventions
      WHERE statut = 'CLOTURE TERMINEE'
        AND articles IS NOT NULL 
        AND articles != ''
        AND (
          (cloture_tech IS NOT NULL AND cloture_tech != '' AND cloture_tech != 'nan' AND 
           cloture_tech ~ '^[0-9]' AND 
           (cloture_tech::date >= '2025-05-01'::date AND cloture_tech::date <= '2025-05-31'::date)) OR
          (cloture_hotline IS NOT NULL AND cloture_hotline != '' AND cloture_hotline != 'nan' AND 
           cloture_hotline ~ '^[0-9]' AND 
           (cloture_hotline::date >= '2025-05-01'::date AND cloture_hotline::date <= '2025-05-31'::date)) OR
          (cloture_tech IS NULL AND cloture_hotline IS NULL AND 
           date_rdv IS NOT NULL AND date_rdv != '' AND date_rdv != 'nan' AND 
           date_rdv ~ '^[0-9]' AND 
           (date_rdv::date >= '2025-05-01'::date AND date_rdv::date <= '2025-05-31'::date))
        )
      GROUP BY nom_technicien, prenom_technicien
      ORDER BY total_recette DESC
      LIMIT 20
    `);
    
    console.log(`   📊 Résultats: ${allRecentResult.rows.length} enregistrements`);
    allRecentResult.rows.forEach((row, index) => {
      console.log(`      ${index + 1}. ${row.nom_technicien} ${row.prenom_technicien}`);
      console.log(`         Interventions: ${row.nombre_interventions}`);
      console.log(`         Total Recette: ${row.total_recette}€`);
    });
    
    // 4. Rechercher spécifiquement "BEN ABDALLAH" ou "BENADBALLAH"
    console.log('\n📊 4. Recherche spécifique BEN ABDALLAH/BENADBALLAH:');
    const specificResult = await pool.query(`
      SELECT 
        nom_technicien,
        prenom_technicien,
        COUNT(*) as nombre_interventions,
        SUM(
          CASE 
            WHEN statut = 'CLOTURE TERMINEE' THEN
              COALESCE(
                (SELECT SUM(
                  CASE 
                    WHEN cp.prix_tech IS NOT NULL THEN cp.prix_tech
                    ELSE 0
                  END
                )
                FROM unnest(string_to_array(articles, ',')) as article_item
                LEFT JOIN company_pricing cp ON 
                  TRIM(SPLIT_PART(article_item, 'x', 1)) = cp.service_code
                  AND cp.company_name = 'ERT OUEST'
                  AND cp.category = type_intervention
                ), 0
              )
            ELSE 0
          END
        ) as total_recette
      FROM interventions
      WHERE (
        LOWER(nom_technicien) = 'ben abdallah'
        OR LOWER(nom_technicien) = 'benadballah'
        OR LOWER(nom_technicien) = 'benabdallah'
        OR LOWER(nom_technicien) = 'ben abdallah'
        OR LOWER(nom_technicien) = 'benadballah'
        OR LOWER(nom_technicien) = 'benabdallah'
      )
      AND statut = 'CLOTURE TERMINEE'
      AND articles IS NOT NULL 
      AND articles != ''
      GROUP BY nom_technicien, prenom_technicien
      ORDER BY total_recette DESC
    `);
    
    console.log(`   📊 Résultats: ${specificResult.rows.length} enregistrements`);
    specificResult.rows.forEach((row, index) => {
      console.log(`      ${index + 1}. ${row.nom_technicien} ${row.prenom_technicien}`);
      console.log(`         Interventions: ${row.nombre_interventions}`);
      console.log(`         Total Recette: ${row.total_recette}€`);
    });
    
    // 5. Vérifier l'employé assigné
    console.log('\n📊 5. Vérification de l\'employé assigné:');
    const employeResult = await pool.query(`
      SELECT 
        id,
        nom,
        prenom,
        matricule,
        statut
      FROM employes
      WHERE id = 14
    `);
    
    if (employeResult.rows.length > 0) {
      const employe = employeResult.rows[0];
      console.log(`   📊 Employé ID 14: ${employe.nom} ${employe.prenom}`);
      console.log(`      Matricule: ${employe.matricule}`);
      console.log(`      Statut: ${employe.statut}`);
    } else {
      console.log(`   ❌ Employé ID 14 non trouvé`);
    }
    
    console.log('\n🎯 Recherche terminée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

findBenabdallahInterventions().catch(console.error);
