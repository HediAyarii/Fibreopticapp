import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024',
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function testSqlDirect() {
  console.log('🔍 Test SQL direct pour comprendre le problème...');
  
  try {
    // Test avec la requête exacte de l'API
    console.log('\n📊 1. Test avec la requête exacte de l\'API:');
    const result = await pool.query(`
      SELECT 
        i.nom_technicien as employe_nom,
        i.prenom_technicien as employe_prenom,
        CONCAT('TECH_', UPPER(SUBSTRING(i.nom_technicien, 1, 3)), UPPER(SUBSTRING(i.prenom_technicien, 1, 2))) as matricule,
        COUNT(*) as nombre_interventions,
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
        ) as total_recette_technicien
      FROM interventions i
      WHERE i.statut = 'CLOTURE TERMINEE'
        AND i.articles IS NOT NULL 
        AND i.articles != ''
        AND (
          -- Filtrage par cloture_tech (avec vérification des valeurs valides)
          (i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND 
           i.cloture_tech ~ '^[0-9]' AND 
           (i.cloture_tech::date >= $1::date AND i.cloture_tech::date <= $2::date)) OR
          -- Filtrage par cloture_hotline (avec vérification des valeurs valides)
          (i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND 
           i.cloture_hotline ~ '^[0-9]' AND 
           (i.cloture_hotline::date >= $1::date AND i.cloture_hotline::date <= $2::date)) OR
          -- Filtrage par date_rdv si les autres sont NULL (avec vérification des valeurs valides)
          (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND 
           i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND 
           i.date_rdv ~ '^[0-9]' AND 
           (i.date_rdv::date >= $1::date AND i.date_rdv::date <= $2::date))
        )
      GROUP BY i.nom_technicien, i.prenom_technicien
      ORDER BY total_recette_technicien DESC
    `, ['2025-05-02', '2025-05-02']);
    
    console.log(`   📊 Résultats: ${result.rows.length} techniciens`);
    result.rows.forEach((row, index) => {
      console.log(`      ${index + 1}. ${row.employe_nom} ${row.employe_prenom}: ${row.nombre_interventions} interventions, ${row.total_recette_technicien}€`);
    });
    
    // Test avec une requête simplifiée
    console.log('\n📊 2. Test avec une requête simplifiée:');
    const simpleResult = await pool.query(`
      SELECT 
        i.nom_technicien,
        i.prenom_technicien,
        i.cloture_tech,
        i.cloture_hotline,
        i.date_rdv,
        i.statut,
        i.articles
      FROM interventions i
      WHERE i.statut = 'CLOTURE TERMINEE'
        AND i.articles IS NOT NULL 
        AND i.articles != ''
        AND (
          (i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND 
           i.cloture_tech ~ '^[0-9]' AND 
           (i.cloture_tech::date >= '2025-05-02' AND i.cloture_tech::date <= '2025-05-02')) OR
          (i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND 
           i.cloture_hotline ~ '^[0-9]' AND 
           (i.cloture_hotline::date >= '2025-05-02' AND i.cloture_hotline::date <= '2025-05-02')) OR
          (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND 
           i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND 
           i.date_rdv ~ '^[0-9]' AND 
           (i.date_rdv::date >= '2025-05-02' AND i.date_rdv::date <= '2025-05-02'))
        )
      LIMIT 5
    `);
    
    console.log(`   📊 Résultats simplifiés: ${simpleResult.rows.length} interventions`);
    simpleResult.rows.forEach((row, index) => {
      console.log(`      ${index + 1}. ${row.nom_technicien} ${row.prenom_technicien}:`);
      console.log(`         cloture_tech: ${row.cloture_tech}`);
      console.log(`         cloture_hotline: ${row.cloture_hotline}`);
      console.log(`         date_rdv: ${row.date_rdv}`);
      console.log(`         articles: ${row.articles}`);
    });
    
    // Test avec une requête encore plus simple
    console.log('\n📊 3. Test avec une requête encore plus simple:');
    const verySimpleResult = await pool.query(`
      SELECT 
        i.nom_technicien,
        i.prenom_technicien,
        i.cloture_tech,
        i.cloture_hotline,
        i.date_rdv
      FROM interventions i
      WHERE i.statut = 'CLOTURE TERMINEE'
        AND i.articles IS NOT NULL 
        AND i.articles != ''
      LIMIT 10
    `);
    
    console.log(`   📊 Toutes les interventions: ${verySimpleResult.rows.length} interventions`);
    verySimpleResult.rows.forEach((row, index) => {
      console.log(`      ${index + 1}. ${row.nom_technicien} ${row.prenom_technicien}:`);
      console.log(`         cloture_tech: ${row.cloture_tech}`);
      console.log(`         cloture_hotline: ${row.cloture_hotline}`);
      console.log(`         date_rdv: ${row.date_rdv}`);
    });
    
    console.log('\n🎯 Test SQL terminé !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

testSqlDirect().catch(console.error);
