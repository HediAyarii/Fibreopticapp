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

async function searchBenabdallahVariations() {
  console.log('🔍 Recherche des variations du nom BENADBALLAH...');
  
  try {
    // 1. Rechercher toutes les variations possibles
    console.log('\n📊 1. Recherche de toutes les variations:');
    const variationsResult = await pool.query(`
      SELECT DISTINCT nom_technicien, prenom_technicien, COUNT(*) as nb_interventions
      FROM interventions
      WHERE (
        LOWER(nom_technicien) LIKE '%ben%' OR 
        LOWER(nom_technicien) LIKE '%abd%' OR
        LOWER(nom_technicien) LIKE '%allah%' OR
        LOWER(prenom_technicien) LIKE '%taoufik%' OR
        LOWER(prenom_technicien) LIKE '%walid%'
      )
      AND statut = 'CLOTURE TERMINEE'
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
      GROUP BY nom_technicien, prenom_technicien
      ORDER BY nom_technicien, prenom_technicien
    `);
    
    console.log(`   ${variationsResult.rows.length} techniciens trouvés:`);
    variationsResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.nom_technicien} ${row.prenom_technicien} - ${row.nb_interventions} interventions`);
    });
    
    // 2. Rechercher spécifiquement WALID
    console.log('\n📊 2. Recherche spécifique de WALID:');
    const walidResult = await pool.query(`
      SELECT DISTINCT nom_technicien, prenom_technicien, COUNT(*) as nb_interventions
      FROM interventions
      WHERE LOWER(prenom_technicien) = 'walid'
        AND statut = 'CLOTURE TERMINEE'
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
      GROUP BY nom_technicien, prenom_technicien
      ORDER BY nom_technicien, prenom_technicien
    `);
    
    console.log(`   ${walidResult.rows.length} techniciens WALID trouvés:`);
    walidResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.nom_technicien} ${row.prenom_technicien} - ${row.nb_interventions} interventions`);
    });
    
    // 3. Rechercher spécifiquement TAOUFIK
    console.log('\n📊 3. Recherche spécifique de TAOUFIK:');
    const taoufikResult = await pool.query(`
      SELECT DISTINCT nom_technicien, prenom_technicien, COUNT(*) as nb_interventions
      FROM interventions
      WHERE LOWER(prenom_technicien) = 'taoufik'
        AND statut = 'CLOTURE TERMINEE'
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
      GROUP BY nom_technicien, prenom_technicien
      ORDER BY nom_technicien, prenom_technicien
    `);
    
    console.log(`   ${taoufikResult.rows.length} techniciens TAOUFIK trouvés:`);
    taoufikResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.nom_technicien} ${row.prenom_technicien} - ${row.nb_interventions} interventions`);
    });
    
    // 4. Vérifier s'il y a des interventions sans technicien assigné
    console.log('\n📊 4. Interventions sans technicien assigné:');
    const unassignedResult = await pool.query(`
      SELECT COUNT(*) as nb_interventions
      FROM interventions
      WHERE (nom_technicien IS NULL OR nom_technicien = '' OR prenom_technicien IS NULL OR prenom_technicien = '')
        AND statut = 'CLOTURE TERMINEE'
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
           date_rdv::date >= '2025-05-01' AND date_rdv::date <= '2025-05-31'))
        )
    `);
    
    console.log(`   ${unassignedResult.rows[0].nb_interventions} interventions sans technicien assigné`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

searchBenabdallahVariations().catch(console.error);

