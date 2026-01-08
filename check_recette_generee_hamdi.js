const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://finalfibre_user:finalfibre_password_2024@localhost:5432/finalfibre_db' });

async function checkRecetteGeneree() {
  try {
    // Requête pour calculer les recettes générées depuis les interventions
    // C'est la même logique que l'interface "Coût par Salaire"
    const result = await pool.query(`
      SELECT 
        i.nom_technicien,
        i.prenom_technicien,
        COUNT(*) as nombre_interventions,
        SUM(
          CASE 
            WHEN i.statut = 'CLOTURE TERMINEE' THEN
              COALESCE(
                (SELECT SUM(
                  CASE 
                    WHEN TRIM(SPLIT_PART(article_item, 'x', 1)) = 'DEP_OFFE' 
                         AND i.articles LIKE '%SAV%' THEN 0
                    WHEN cp.prix_tech IS NOT NULL THEN 
                      cp.prix_tech * COALESCE(NULLIF(TRIM(SPLIT_PART(article_item, 'x', 2)), '')::INTEGER, 1)
                    ELSE 0
                  END
                )
                FROM unnest(string_to_array(i.articles, ',')) as article_item
                LEFT JOIN company_pricing cp ON 
                  TRIM(SPLIT_PART(article_item, 'x', 1)) = cp.service_code
                  AND cp.company_name = CASE 
                    WHEN i.grille LIKE '%AXECOM%' THEN 'AXECOM'
                    ELSE 'ERT OUEST'
                  END
                  AND cp.category = CASE 
                    WHEN i.type_intervention IN ('RACC', 'RECO', 'RECC') THEN 'RACC'
                    ELSE 'SAV'
                  END
                WHERE article_item != 'nan' 
                  AND TRIM(article_item) != ''
                ), 0
              )
            ELSE 0
          END
        ) as total_recette_technicien
      FROM interventions i
      WHERE (LOWER(i.nom_technicien) = 'hamdi' AND LOWER(i.prenom_technicien) LIKE '%chedli%')
        AND i.statut = 'CLOTURE TERMINEE'
        AND i.articles IS NOT NULL 
        AND i.articles != ''
        AND i.date_rdv IS NOT NULL 
        AND i.date_rdv != '' 
        AND i.date_rdv != 'nan'
      GROUP BY i.nom_technicien, i.prenom_technicien
    `);

    console.log('📊 RECETTES GÉNÉRÉES (Total - toutes périodes):');
    console.table(result.rows);

    // Par mois (Décembre 2025)
    const decembre = await pool.query(`
      SELECT 
        i.nom_technicien,
        i.prenom_technicien,
        COUNT(*) as nb_inter_cloturees,
        SUM(
          CASE 
            WHEN i.statut = 'CLOTURE TERMINEE' THEN
              COALESCE(
                (SELECT SUM(
                  CASE 
                    WHEN TRIM(SPLIT_PART(article_item, 'x', 1)) = 'DEP_OFFE' 
                         AND i.articles LIKE '%SAV%' THEN 0
                    WHEN cp.prix_tech IS NOT NULL THEN 
                      cp.prix_tech * COALESCE(NULLIF(TRIM(SPLIT_PART(article_item, 'x', 2)), '')::INTEGER, 1)
                    ELSE 0
                  END
                )
                FROM unnest(string_to_array(i.articles, ',')) as article_item
                LEFT JOIN company_pricing cp ON 
                  TRIM(SPLIT_PART(article_item, 'x', 1)) = cp.service_code
                  AND cp.company_name = CASE 
                    WHEN i.grille LIKE '%AXECOM%' THEN 'AXECOM'
                    ELSE 'ERT OUEST'
                  END
                  AND cp.category = CASE 
                    WHEN i.type_intervention IN ('RACC', 'RECO', 'RECC') THEN 'RACC'
                    ELSE 'SAV'
                  END
                WHERE article_item != 'nan' 
                  AND TRIM(article_item) != ''
                ), 0
              )
            ELSE 0
          END
        ) as recette_technicien
      FROM interventions i
      WHERE (LOWER(i.nom_technicien) = 'hamdi' AND LOWER(i.prenom_technicien) LIKE '%chedli%')
        AND i.statut = 'CLOTURE TERMINEE'
        AND i.articles IS NOT NULL 
        AND i.articles != ''
        AND i.date_rdv LIKE '2025-12%'
      GROUP BY i.nom_technicien, i.prenom_technicien
    `);

    console.log('\n📅 RECETTES DÉCEMBRE 2025:');
    console.table(decembre.rows);

    // Par mois détaillé
    const parMois = await pool.query(`
      SELECT 
        SUBSTRING(i.date_rdv, 1, 7) as mois,
        COUNT(*) as nb_inter_cloturees,
        SUM(
          CASE 
            WHEN i.statut = 'CLOTURE TERMINEE' THEN
              COALESCE(
                (SELECT SUM(
                  CASE 
                    WHEN TRIM(SPLIT_PART(article_item, 'x', 1)) = 'DEP_OFFE' 
                         AND i.articles LIKE '%SAV%' THEN 0
                    WHEN cp.prix_tech IS NOT NULL THEN 
                      cp.prix_tech * COALESCE(NULLIF(TRIM(SPLIT_PART(article_item, 'x', 2)), '')::INTEGER, 1)
                    ELSE 0
                  END
                )
                FROM unnest(string_to_array(i.articles, ',')) as article_item
                LEFT JOIN company_pricing cp ON 
                  TRIM(SPLIT_PART(article_item, 'x', 1)) = cp.service_code
                  AND cp.company_name = CASE 
                    WHEN i.grille LIKE '%AXECOM%' THEN 'AXECOM'
                    ELSE 'ERT OUEST'
                  END
                  AND cp.category = CASE 
                    WHEN i.type_intervention IN ('RACC', 'RECO', 'RECC') THEN 'RACC'
                    ELSE 'SAV'
                  END
                WHERE article_item != 'nan' 
                  AND TRIM(article_item) != ''
                ), 0
              )
            ELSE 0
          END
        ) as recette_technicien
      FROM interventions i
      WHERE (LOWER(i.nom_technicien) = 'hamdi' AND LOWER(i.prenom_technicien) LIKE '%chedli%')
        AND i.statut = 'CLOTURE TERMINEE'
        AND i.articles IS NOT NULL 
        AND i.articles != ''
        AND i.date_rdv LIKE '2025%'
      GROUP BY SUBSTRING(i.date_rdv, 1, 7)
      ORDER BY mois DESC
    `);

    console.log('\n📅 RECETTES PAR MOIS (2025):');
    console.table(parMois.rows);

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await pool.end();
  }
}

checkRecetteGeneree();
