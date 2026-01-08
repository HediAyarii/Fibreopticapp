const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://finalfibre_user:finalfibre_password_2024@localhost:5432/finalfibre_db' });

async function checkRecetteExacte() {
  try {
    const matricule = 'TECH_HAMBE';
    const mois = 12;
    const annee = 2025;

    console.log(`🔍 Calcul exact pour ${matricule} - Mois: ${mois}/${annee}\n`);

    // Requête EXACTE utilisée par l'API cout-par-salaire
    const result = await pool.query(`
      SELECT COALESCE(SUM(
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
      ), 0) as total_genere
      FROM interventions i
      WHERE i.statut = 'CLOTURE TERMINEE'
        AND i.articles IS NOT NULL 
        AND i.articles != ''
        AND CONCAT('TECH_', UPPER(SUBSTRING(SPLIT_PART(i.nom_technicien, ' ', 1), 1, 3)), UPPER(SUBSTRING(SPLIT_PART(i.prenom_technicien, ' ', 1), 1, 2))) = $1
        AND (
          (i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND 
           i.cloture_tech ~ '^[0-9]' AND (
             (i.cloture_tech ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' AND i.cloture_tech::date >= DATE($2 || '-' || LPAD($3::text, 2, '0') || '-01') AND i.cloture_tech::date <= (DATE($2 || '-' || LPAD($3::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))
             OR
             (i.cloture_tech ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' AND TO_DATE(SUBSTRING(i.cloture_tech FROM 1 FOR 10), 'DD/MM/YYYY') >= DATE($2 || '-' || LPAD($3::text, 2, '0') || '-01') AND TO_DATE(SUBSTRING(i.cloture_tech FROM 1 FOR 10), 'DD/MM/YYYY') <= (DATE($2 || '-' || LPAD($3::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))
           )) OR
          (i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND 
           i.cloture_hotline ~ '^[0-9]' AND (
             (i.cloture_hotline ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' AND i.cloture_hotline::date >= DATE($2 || '-' || LPAD($3::text, 2, '0') || '-01') AND i.cloture_hotline::date <= (DATE($2 || '-' || LPAD($3::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))
             OR
             (i.cloture_hotline ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' AND TO_DATE(SUBSTRING(i.cloture_hotline FROM 1 FOR 10), 'DD/MM/YYYY') >= DATE($2 || '-' || LPAD($3::text, 2, '0') || '-01') AND TO_DATE(SUBSTRING(i.cloture_hotline FROM 1 FOR 10), 'DD/MM/YYYY') <= (DATE($2 || '-' || LPAD($3::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))
           )) OR
          (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND 
           i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND 
           i.date_rdv ~ '^[0-9]' AND (
             (i.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' AND i.date_rdv::date >= DATE($2 || '-' || LPAD($3::text, 2, '0') || '-01') AND i.date_rdv::date <= (DATE($2 || '-' || LPAD($3::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))
             OR
             (i.date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') >= DATE($2 || '-' || LPAD($3::text, 2, '0') || '-01') AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') <= (DATE($2 || '-' || LPAD($3::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))
           ))
        )
    `, [matricule, annee, mois]);

    console.log('📊 RÉSULTAT EXACT (même requête que l\'interface):');
    console.log('   Total Généré:', result.rows[0].total_genere, '€');

    // Compter les interventions
    const countResult = await pool.query(`
      SELECT COUNT(*) as nb_inter
      FROM interventions i
      WHERE i.statut = 'CLOTURE TERMINEE'
        AND i.articles IS NOT NULL 
        AND i.articles != ''
        AND CONCAT('TECH_', UPPER(SUBSTRING(SPLIT_PART(i.nom_technicien, ' ', 1), 1, 3)), UPPER(SUBSTRING(SPLIT_PART(i.prenom_technicien, ' ', 1), 1, 2))) = $1
        AND (
          (i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND 
           i.cloture_tech ~ '^[0-9]' AND (
             (i.cloture_tech ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' AND i.cloture_tech::date >= DATE($2 || '-' || LPAD($3::text, 2, '0') || '-01') AND i.cloture_tech::date <= (DATE($2 || '-' || LPAD($3::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))
             OR
             (i.cloture_tech ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' AND TO_DATE(SUBSTRING(i.cloture_tech FROM 1 FOR 10), 'DD/MM/YYYY') >= DATE($2 || '-' || LPAD($3::text, 2, '0') || '-01') AND TO_DATE(SUBSTRING(i.cloture_tech FROM 1 FOR 10), 'DD/MM/YYYY') <= (DATE($2 || '-' || LPAD($3::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))
           )) OR
          (i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND 
           i.cloture_hotline ~ '^[0-9]' AND (
             (i.cloture_hotline ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' AND i.cloture_hotline::date >= DATE($2 || '-' || LPAD($3::text, 2, '0') || '-01') AND i.cloture_hotline::date <= (DATE($2 || '-' || LPAD($3::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))
             OR
             (i.cloture_hotline ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' AND TO_DATE(SUBSTRING(i.cloture_hotline FROM 1 FOR 10), 'DD/MM/YYYY') >= DATE($2 || '-' || LPAD($3::text, 2, '0') || '-01') AND TO_DATE(SUBSTRING(i.cloture_hotline FROM 1 FOR 10), 'DD/MM/YYYY') <= (DATE($2 || '-' || LPAD($3::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))
           )) OR
          (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND 
           i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND 
           i.date_rdv ~ '^[0-9]' AND (
             (i.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' AND i.date_rdv::date >= DATE($2 || '-' || LPAD($3::text, 2, '0') || '-01') AND i.date_rdv::date <= (DATE($2 || '-' || LPAD($3::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))
             OR
             (i.date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') >= DATE($2 || '-' || LPAD($3::text, 2, '0') || '-01') AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') <= (DATE($2 || '-' || LPAD($3::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))
           ))
        )
    `, [matricule, annee, mois]);

    console.log('   Nb interventions:', countResult.rows[0].nb_inter);

    // Comparer avec date_rdv uniquement
    const dateRdvResult = await pool.query(`
      SELECT 
        COUNT(*) as nb_inter,
        COALESCE(SUM(
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
        ), 0) as total_genere
      FROM interventions i
      WHERE i.statut = 'CLOTURE TERMINEE'
        AND i.articles IS NOT NULL 
        AND i.articles != ''
        AND LOWER(i.nom_technicien) = 'hamdi' 
        AND LOWER(i.prenom_technicien) LIKE '%chedli%'
        AND i.date_rdv LIKE '2025-12%'
    `);

    console.log('\n📅 Comparaison avec date_rdv uniquement:');
    console.log('   Nb interventions (date_rdv):', dateRdvResult.rows[0].nb_inter);
    console.log('   Total Généré (date_rdv):', dateRdvResult.rows[0].total_genere, '€');

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await pool.end();
  }
}

checkRecetteExacte();
