const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024'
});

async function checkMissingArticles() {
  try {
    console.log('🔍 Vérification des articles manquants pour ERT...\n');

    // Période vue dans la capture d'écran
    const startDate = '2026-04-30';
    const endDate = '2026-05-30';

    // 1. Compter le total d'interventions ERT avec articles
    const totalQuery = `
      SELECT COUNT(*) as total
      FROM interventions
      WHERE statut = 'CLOTURE TERMINEE'
        AND (grille NOT LIKE '%AXECOM%' OR grille IS NULL)
        AND articles IS NOT NULL 
        AND articles != ''
        AND articles != 'nan'
        AND date_rdv::date >= $1::date 
        AND date_rdv::date <= $2::date
    `;
    const totalResult = await pool.query(totalQuery, [startDate, endDate]);
    console.log(`📊 Total interventions ERT avec articles: ${totalResult.rows[0].total}`);

    // 2. Lister TOUS les articles distincts pour ERT
    const articlesQuery = `
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
          AND i.date_rdv IS NOT NULL 
          AND i.date_rdv != ''
          AND i.date_rdv::date >= $1::date 
          AND i.date_rdv::date <= $2::date
      )
      SELECT 
        TRIM(SPLIT_PART(article_item, ' x', 1)) as code_article,
        COUNT(DISTINCT num_inter) as nb_interventions,
        SUM(COALESCE(NULLIF(TRIM(SPLIT_PART(article_item, ' x', 2)), '')::INTEGER, 1)) as quantite_totale
      FROM filtered_articles
      WHERE 
        NOT (TRIM(SPLIT_PART(article_item, ' x', 1)) ILIKE '%DEP%OFF%' AND has_sav = true)
      GROUP BY TRIM(SPLIT_PART(article_item, ' x', 1))
      ORDER BY quantite_totale DESC
    `;

    const result = await pool.query(articlesQuery, [startDate, endDate]);
    
    console.log(`\n📦 Articles distincts trouvés pour ERT: ${result.rows.length}\n`);
    console.log('Liste complète des articles:\n');
    
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.code_article.padEnd(30)} | ${row.nb_interventions} interventions | ${row.quantite_totale} unités`);
    });

    // 3. Vérifier s'il y a des articles qui pourraient être filtrés
    const rawArticlesQuery = `
      SELECT DISTINCT
        TRIM(UNNEST(string_to_array(articles, ','))) as article_brut
      FROM interventions
      WHERE statut = 'CLOTURE TERMINEE'
        AND (grille NOT LIKE '%AXECOM%' OR grille IS NULL)
        AND articles IS NOT NULL 
        AND articles != ''
        AND articles != 'nan'
        AND date_rdv::date >= $1::date 
        AND date_rdv::date <= $2::date
      ORDER BY article_brut
    `;

    const rawResult = await pool.query(rawArticlesQuery, [startDate, endDate]);
    
    console.log(`\n📋 Articles bruts (avant traitement): ${rawResult.rows.length}`);
    console.log('\nArticles bruts distincts:');
    rawResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. "${row.article_brut}"`);
    });

    // 4. Vérifier les interventions sans articles
    const noArticlesQuery = `
      SELECT num_inter, grille, type_intervention, statut, date_rdv
      FROM interventions
      WHERE statut = 'CLOTURE TERMINEE'
        AND (grille NOT LIKE '%AXECOM%' OR grille IS NULL)
        AND (articles IS NULL OR articles = '' OR articles = 'nan')
        AND date_rdv::date >= $1::date 
        AND date_rdv::date <= $2::date
      ORDER BY date_rdv
      LIMIT 10
    `;

    const noArticlesResult = await pool.query(noArticlesQuery, [startDate, endDate]);
    
    if (noArticlesResult.rows.length > 0) {
      console.log(`\n⚠️ ${noArticlesResult.rows.length} interventions ERT sans articles (affichant les 10 premières):`);
      noArticlesResult.rows.forEach(row => {
        console.log(`  - ${row.num_inter} | ${row.type_intervention || 'N/A'} | ${row.date_rdv}`);
      });
    }

    console.log('\n✅ Analyse terminée');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

checkMissingArticles();
