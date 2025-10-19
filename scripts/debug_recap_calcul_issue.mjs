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

async function debugRecapCalculIssue() {
  console.log('🔍 Diagnostic du problème Récap Calcul...');
  
  try {
    // 1. Tester l'API directement
    console.log('\n📊 1. Test de l\'API récap-calcul...');
    
    // Test avec les paramètres de l'image (date début: 02/05/2025, pas de date fin)
    const testUrl1 = 'http://localhost:3000/api/recap-calcul?startDate=2025-05-02';
    console.log(`   🔗 Test URL: ${testUrl1}`);
    
    try {
      const response1 = await fetch(testUrl1);
      const data1 = await response1.json();
      console.log(`   📊 Réponse (sans endDate): ${JSON.stringify(data1, null, 2)}`);
    } catch (error) {
      console.log(`   ❌ Erreur API: ${error.message}`);
    }
    
    // Test avec date fin
    const testUrl2 = 'http://localhost:3000/api/recap-calcul?startDate=2025-05-02&endDate=2025-05-31';
    console.log(`   🔗 Test URL: ${testUrl2}`);
    
    try {
      const response2 = await fetch(testUrl2);
      const data2 = await response2.json();
      console.log(`   📊 Réponse (avec endDate): ${JSON.stringify(data2, null, 2)}`);
    } catch (error) {
      console.log(`   ❌ Erreur API: ${error.message}`);
    }
    
    // 2. Vérifier les données dans la base
    console.log('\n📊 2. Vérification des données dans la base...');
    
    // Vérifier les interventions de mai 2025
    const interventionsResult = await pool.query(`
      SELECT COUNT(*) as total_interventions,
             COUNT(CASE WHEN statut = 'CLOTURE TERMINEE' THEN 1 END) as interventions_terminees
      FROM interventions
      WHERE (
        (cloture_tech IS NOT NULL AND cloture_tech != '' AND cloture_tech != 'nan' AND 
         cloture_tech ~ '^[0-9]' AND 
         (cloture_tech::date >= '2025-05-01' AND cloture_tech::date <= '2025-05-31')) OR
        (cloture_hotline IS NOT NULL AND cloture_hotline != '' AND cloture_hotline != 'nan' AND 
         cloture_hotline ~ '^[0-9]' AND 
         (cloture_hotline::date >= '2025-05-01' AND cloture_hotline::date <= '2025-05-31')) OR
        (cloture_tech IS NULL AND cloture_hotline IS NULL AND 
         date_rdv IS NOT NULL AND date_rdv != '' AND date_rdv != 'nan' AND 
         date_rdv ~ '^[0-9]' AND 
         (date_rdv::date >= '2025-05-01' AND date_rdv::date <= '2025-05-31'))
      )
    `);
    
    console.log(`   📊 Interventions en mai 2025: ${interventionsResult.rows[0].total_interventions}`);
    console.log(`   📊 Interventions terminées: ${interventionsResult.rows[0].interventions_terminees}`);
    
    // 3. Vérifier les interventions avec articles
    console.log('\n📊 3. Vérification des interventions avec articles...');
    
    const interventionsWithArticlesResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM interventions
      WHERE statut = 'CLOTURE TERMINEE'
        AND articles IS NOT NULL 
        AND articles != ''
        AND (
          (cloture_tech IS NOT NULL AND cloture_tech != '' AND cloture_tech != 'nan' AND 
           cloture_tech ~ '^[0-9]' AND 
           (cloture_tech::date >= '2025-05-01' AND cloture_tech::date <= '2025-05-31')) OR
          (cloture_hotline IS NOT NULL AND cloture_hotline != '' AND cloture_hotline != 'nan' AND 
           cloture_hotline ~ '^[0-9]' AND 
           (cloture_hotline::date >= '2025-05-01' AND cloture_hotline::date <= '2025-05-31')) OR
          (cloture_tech IS NULL AND cloture_hotline IS NULL AND 
           date_rdv IS NOT NULL AND date_rdv != '' AND date_rdv != 'nan' AND 
           date_rdv ~ '^[0-9]' AND 
           (date_rdv::date >= '2025-05-01' AND date_rdv::date <= '2025-05-31'))
        )
    `);
    
    console.log(`   📊 Interventions avec articles: ${interventionsWithArticlesResult.rows[0].count}`);
    
    // 4. Vérifier la table company_pricing
    console.log('\n📊 4. Vérification de la table company_pricing...');
    
    const pricingResult = await pool.query(`
      SELECT COUNT(*) as count, company_name
      FROM company_pricing
      GROUP BY company_name
    `);
    
    console.log(`   📊 Tarifs disponibles:`);
    pricingResult.rows.forEach(row => {
      console.log(`      ${row.company_name}: ${row.count} tarifs`);
    });
    
    // 5. Test de la requête complète
    console.log('\n📊 5. Test de la requête complète...');
    
    const fullQueryResult = await pool.query(`
      SELECT 
        i.nom_technicien as employe_nom,
        i.prenom_technicien as employe_prenom,
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
          (i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND 
           i.cloture_tech ~ '^[0-9]' AND 
           (i.cloture_tech::date >= '2025-05-01' AND i.cloture_tech::date <= '2025-05-31')) OR
          (i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND 
           i.cloture_hotline ~ '^[0-9]' AND 
           (i.cloture_hotline::date >= '2025-05-01' AND i.cloture_hotline::date <= '2025-05-31')) OR
          (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND 
           i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND 
           i.date_rdv ~ '^[0-9]' AND 
           (i.date_rdv::date >= '2025-05-01' AND i.date_rdv::date <= '2025-05-31'))
        )
      GROUP BY i.nom_technicien, i.prenom_technicien
      ORDER BY total_recette_technicien DESC
      LIMIT 5
    `);
    
    console.log(`   📊 Résultats de la requête complète: ${fullQueryResult.rows.length} techniciens`);
    fullQueryResult.rows.forEach((row, index) => {
      console.log(`      ${index + 1}. ${row.employe_nom} ${row.employe_prenom}: ${row.nombre_interventions} interventions, ${row.total_recette_technicien}€`);
    });
    
    // 6. Recommandations
    console.log('\n📊 6. Recommandations:');
    
    if (interventionsResult.rows[0].total_interventions === '0') {
      console.log('   ❌ Aucune intervention trouvée en mai 2025');
      console.log('   💡 Vérifier les dates dans la base de données');
    } else if (interventionsWithArticlesResult.rows[0].count === '0') {
      console.log('   ❌ Aucune intervention avec articles trouvée');
      console.log('   💡 Vérifier que les interventions ont des articles');
    } else if (pricingResult.rows.length === 0) {
      console.log('   ❌ Aucun tarif trouvé dans company_pricing');
      console.log('   💡 Vérifier la table company_pricing');
    } else if (fullQueryResult.rows.length === 0) {
      console.log('   ❌ La requête complète ne retourne aucun résultat');
      console.log('   💡 Vérifier la correspondance entre articles et tarifs');
    } else {
      console.log('   ✅ Données trouvées, problème probablement dans l\'API ou le frontend');
    }
    
    console.log('\n🎯 Diagnostic terminé !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

debugRecapCalculIssue().catch(console.error);
