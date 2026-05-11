const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024'
});

async function checkPricingArticlesERT() {
  try {
    console.log('🔍 Vérification des articles ERT manquants dans company_pricing...\n');

    // Période vue dans la capture d'écran
    const startDate = '2026-04-30';
    const endDate = '2026-05-30';

    // 1. Articles trouvés dans les interventions ERT
    const interventionsArticlesQuery = `
      WITH filtered_articles AS (
        SELECT 
          article_item,
          CASE WHEN i.articles ILIKE '%SAV%' THEN true ELSE false END as has_sav
        FROM interventions i,
             unnest(string_to_array(i.articles, ',')) as article_item
        WHERE i.statut = 'CLOTURE TERMINEE'
          AND (i.grille NOT LIKE '%AXECOM%' OR i.grille IS NULL)
          AND i.articles IS NOT NULL 
          AND i.articles != ''
          AND i.articles != 'nan'
          AND article_item != 'nan'
          AND TRIM(article_item) != ''
          AND i.date_rdv IS NOT NULL 
          AND i.date_rdv != ''
          AND i.date_rdv::date >= $1::date 
          AND i.date_rdv::date <= $2::date
      )
      SELECT DISTINCT
        TRIM(SPLIT_PART(article_item, ' x', 1)) as code_article
      FROM filtered_articles
      WHERE NOT (TRIM(SPLIT_PART(article_item, ' x', 1)) ILIKE '%DEP%OFF%' AND has_sav = true)
      ORDER BY code_article
    `;
    
    const interventionsResult = await pool.query(interventionsArticlesQuery, [startDate, endDate]);
    const articlesInInterventions = interventionsResult.rows.map(row => row.code_article);
    
    console.log(`📦 Articles trouvés dans les interventions ERT: ${articlesInInterventions.length}\n`);
    console.log('Liste des articles dans les interventions:');
    articlesInInterventions.forEach((article, index) => {
      console.log(`${index + 1}. ${article}`);
    });

    // 2. Articles présents dans company_pricing pour ERT OUEST
    const pricingQuery = `
      SELECT DISTINCT service_code
      FROM company_pricing
      WHERE company_name = 'ERT OUEST'
      ORDER BY service_code
    `;
    
    const pricingResult = await pool.query(pricingQuery);
    const articlesInPricing = pricingResult.rows.map(row => row.service_code);
    
    console.log(`\n💰 Articles dans company_pricing pour ERT OUEST: ${articlesInPricing.length}\n`);
    console.log('Liste des articles dans company_pricing:');
    articlesInPricing.forEach((article, index) => {
      console.log(`${index + 1}. ${article}`);
    });

    // 3. Articles manquants dans company_pricing
    const missingArticles = articlesInInterventions.filter(
      article => !articlesInPricing.includes(article)
    );
    
    console.log(`\n⚠️ Articles MANQUANTS dans company_pricing: ${missingArticles.length}\n`);
    if (missingArticles.length > 0) {
      console.log('Ces articles sont dans les interventions mais PAS dans company_pricing:');
      missingArticles.forEach((article, index) => {
        console.log(`${index + 1}. ${article}`);
      });
      
      // Vérifier le nombre d'interventions pour chaque article manquant
      console.log('\n📊 Détails des articles manquants:');
      for (const article of missingArticles) {
        const detailQuery = `
          SELECT COUNT(DISTINCT i.num_inter) as nb_interventions
          FROM interventions i,
               unnest(string_to_array(i.articles, ',')) as article_item
          WHERE i.statut = 'CLOTURE TERMINEE'
            AND (i.grille NOT LIKE '%AXECOM%' OR i.grille IS NULL)
            AND TRIM(SPLIT_PART(article_item, ' x', 1)) = $1
            AND i.date_rdv::date >= $2::date 
            AND i.date_rdv::date <= $3::date
        `;
        const detailResult = await pool.query(detailQuery, [article, startDate, endDate]);
        console.log(`   - ${article}: ${detailResult.rows[0].nb_interventions} interventions`);
      }
    } else {
      console.log('✅ Tous les articles des interventions sont présents dans company_pricing!');
    }

    // 4. Articles dans company_pricing mais pas utilisés
    const unusedArticles = articlesInPricing.filter(
      article => !articlesInInterventions.includes(article)
    );
    
    console.log(`\n📋 Articles dans company_pricing mais NON utilisés: ${unusedArticles.length}\n`);
    if (unusedArticles.length > 0) {
      console.log('Ces articles sont dans company_pricing mais pas dans les interventions de la période:');
      unusedArticles.forEach((article, index) => {
        console.log(`${index + 1}. ${article}`);
      });
    }

    console.log('\n✅ Analyse terminée');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

checkPricingArticlesERT();
