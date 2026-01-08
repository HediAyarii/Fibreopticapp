const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024'
});

async function check() {
  // Test avec la nouvelle logique CASE (SANS date_rdv)
  const result = await pool.query(`
    SELECT COUNT(*) as total_case_logic
    FROM interventions i
    WHERE i.statut = 'CLOTURE TERMINEE'
      AND i.articles IS NOT NULL AND i.articles != ''
      AND UPPER(i.nom_technicien) = 'HAMDI'
      AND UPPER(i.prenom_technicien) = 'BEN CHEDLI'
      AND (
        CASE
          WHEN i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND i.cloture_tech ~ '^[0-9]' THEN
            CASE
              WHEN i.cloture_tech ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN i.cloture_tech::date
              WHEN i.cloture_tech ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN TO_DATE(SUBSTRING(i.cloture_tech FROM 1 FOR 10), 'DD/MM/YYYY')
              ELSE NULL
            END
          WHEN i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND i.cloture_hotline ~ '^[0-9]' THEN
            CASE
              WHEN i.cloture_hotline ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN i.cloture_hotline::date
              WHEN i.cloture_hotline ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN TO_DATE(SUBSTRING(i.cloture_hotline FROM 1 FOR 10), 'DD/MM/YYYY')
              ELSE NULL
            END
          ELSE NULL
        END BETWEEN '2025-12-01' AND '2025-12-31'
      )
  `);
  console.log('Nouvelle logique CASE (sans date_rdv):', result.rows[0].total_case_logic, 'interventions');
  
  // Comparaison avec la requête cout-par-salaire
  const coutParSalaire = await pool.query(`
    SELECT COUNT(*) as total
    FROM interventions i
    WHERE i.statut = 'CLOTURE TERMINEE'
      AND i.articles IS NOT NULL 
      AND i.articles != ''
      AND UPPER(i.nom_technicien) = 'HAMDI'
      AND UPPER(i.prenom_technicien) = 'BEN CHEDLI'
      AND (
        -- Priorité 1: cloture_tech
        (i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND 
         i.cloture_tech ~ '^[0-9]' AND (
           (i.cloture_tech ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' AND i.cloture_tech::date >= '2025-12-01' AND i.cloture_tech::date <= '2025-12-31')
           OR
           (i.cloture_tech ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' AND TO_DATE(SUBSTRING(i.cloture_tech FROM 1 FOR 10), 'DD/MM/YYYY') >= '2025-12-01' AND TO_DATE(SUBSTRING(i.cloture_tech FROM 1 FOR 10), 'DD/MM/YYYY') <= '2025-12-31')
         )) OR
        -- Priorité 2: cloture_hotline
        (i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND 
         i.cloture_hotline ~ '^[0-9]' AND (
           (i.cloture_hotline ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' AND i.cloture_hotline::date >= '2025-12-01' AND i.cloture_hotline::date <= '2025-12-31')
         ))
      )
  `);
  console.log('Cout-par-salaire style (cloture_tech OR cloture_hotline):', coutParSalaire.rows[0].total, 'interventions');
  
  await pool.end();
}
check().catch(e => { console.error(e); process.exit(1); });
