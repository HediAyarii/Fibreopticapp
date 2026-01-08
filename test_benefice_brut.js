const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024'
});

async function check() {
  // Test pour Bénéfice Brut - doit donner 2100€ avec cloture_tech/cloture_hotline
  const benefBrut = await pool.query(`
    SELECT 
      COUNT(*) as nb_interventions,
      SUM(
        CASE WHEN statut = 'CLOTURE TERMINEE' THEN
          COALESCE(
            (SELECT SUM(
              CASE 
                WHEN TRIM(SPLIT_PART(article_item, 'x', 1)) = 'DEP_OFFE' AND articles LIKE '%SAV%' THEN 0
                WHEN cp.prix_tech IS NOT NULL THEN 
                  cp.prix_tech * COALESCE(NULLIF(TRIM(SPLIT_PART(article_item, 'x', 2)), '')::INTEGER, 1)
                ELSE 0
              END
            )
            FROM unnest(string_to_array(articles, ',')) as article_item
            LEFT JOIN company_pricing cp ON 
              TRIM(SPLIT_PART(article_item, 'x', 1)) = cp.service_code
              AND cp.company_name = CASE WHEN grille LIKE '%AXECOM%' THEN 'AXECOM' ELSE 'ERT OUEST' END
              AND cp.category = CASE WHEN type_intervention IN ('RACC', 'RECO', 'RECC') THEN 'RACC' ELSE 'SAV' END
            WHERE article_item != 'nan' AND TRIM(article_item) != ''
            ), 0
          )
        ELSE 0
        END
      ) as total_recette_tech
    FROM interventions
    WHERE statut = 'CLOTURE TERMINEE'
      AND UPPER(nom_technicien) = 'HAMDI'
      AND UPPER(prenom_technicien) = 'BEN CHEDLI'
      AND (
        (cloture_tech IS NOT NULL AND cloture_tech != '' AND cloture_tech != 'nan' AND cloture_tech ~ '^[0-9]' 
         AND cloture_tech::date BETWEEN '2025-12-01' AND '2025-12-31') 
        OR 
        (cloture_hotline IS NOT NULL AND cloture_hotline != '' AND cloture_hotline != 'nan' AND cloture_hotline ~ '^[0-9]' 
         AND cloture_hotline::date BETWEEN '2025-12-01' AND '2025-12-31')
      )
  `);
  
  console.log('=== Bénéfice Brut (avec cloture_tech/cloture_hotline) ===');
  console.log('Interventions:', benefBrut.rows[0].nb_interventions);
  console.log('Total Recette Tech:', benefBrut.rows[0].total_recette_tech, '€');
  
  await pool.end();
}
check().catch(e => { console.error(e); process.exit(1); });
