const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024'
});

async function checkFourreauIntervention() {
  try {
    console.log('🔍 Vérification de l\'intervention 156016690...\n');

    // 1. Vérifier l'intervention spécifique
    const interventionQuery = `
      SELECT num_inter, date_rdv, statut, type_intervention, grille, articles
      FROM interventions
      WHERE num_inter = '156016690'
    `;

    const result = await pool.query(interventionQuery);

    if (result.rows.length === 0) {
      console.log('❌ Intervention 156016690 non trouvée dans la base de données');
      return;
    }

    const intervention = result.rows[0];
    console.log('📋 Détails de l\'intervention:');
    console.log(`   Numéro: ${intervention.num_inter}`);
    console.log(`   Date RDV: ${intervention.date_rdv}`);
    console.log(`   Statut: ${intervention.statut}`);
    console.log(`   Type: ${intervention.type_intervention}`);
    console.log(`   Grille: ${intervention.grille}`);
    console.log(`   Articles bruts: "${intervention.articles}"`);

    // 2. Parser les articles
    if (intervention.articles) {
      console.log('\n📦 Parsing des articles:');
      const articles = intervention.articles.split(',');
      articles.forEach((article, index) => {
        const trimmed = article.trim();
        const parts = trimmed.split(' x');
        console.log(`   ${index + 1}. "${trimmed}"`);
        console.log(`      - Code: "${parts[0]?.trim()}"`);
        console.log(`      - Quantité: "${parts[1]?.trim()}"`);
      });
    }

    // 3. Vérifier si FOURREAU_CASSE_PRIVE est dans company_pricing
    const pricingQuery = `
      SELECT * FROM company_pricing
      WHERE service_code = 'FOURREAU_CASSE_PRIVE'
        AND company_name = 'ERT OUEST'
    `;

    const pricingResult = await pool.query(pricingQuery);
    console.log('\n💰 Dans company_pricing:');
    if (pricingResult.rows.length > 0) {
      pricingResult.rows.forEach(row => {
        console.log(`   ✅ ${row.service_code} (${row.category}) - Base: ${row.prix_base}€, Tech: ${row.prix_tech}€`);
      });
    } else {
      console.log('   ❌ FOURREAU_CASSE_PRIVE non trouvé');
    }

    // 4. Tester la requête de recap-articles sur cette intervention
    console.log('\n🔍 Test de la requête recap-articles:');
    const recapQuery = `
      WITH filtered_articles AS (
        SELECT 
          i.num_inter,
          i.grille,
          i.articles,
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
          AND i.num_inter = '156016690'
      )
      SELECT 
        num_inter,
        article_item,
        TRIM(SPLIT_PART(article_item, ' x', 1)) as code_article,
        COALESCE(NULLIF(TRIM(SPLIT_PART(article_item, ' x', 2)), '')::INTEGER, 1) as quantite
      FROM filtered_articles
    `;

    const recapResult = await pool.query(recapQuery);
    console.log(`   Articles détectés: ${recapResult.rows.length}`);
    recapResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. Code: "${row.code_article}" | Quantité: ${row.quantite} | Brut: "${row.article_item}"`);
    });

    // 5. Vérifier toutes les interventions avec FOURREAU_CASSE_PRIVE
    console.log('\n📊 Toutes les interventions avec FOURREAU_CASSE_PRIVE:');
    const allFourreauQuery = `
      SELECT num_inter, date_rdv, statut, grille, articles
      FROM interventions
      WHERE articles ILIKE '%FOURREAU_CASSE_PRIVE%'
      ORDER BY date_rdv DESC
      LIMIT 10
    `;

    const allFourreauResult = await pool.query(allFourreauQuery);
    console.log(`   Total trouvé: ${allFourreauResult.rows.length}`);
    allFourreauResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.num_inter} | ${row.date_rdv} | ${row.statut} | ${row.grille}`);
      console.log(`      Articles: ${row.articles}`);
    });

    console.log('\n✅ Vérification terminée');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

checkFourreauIntervention();
