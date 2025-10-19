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

async function debugDateIssue() {
  console.log('🔍 Diagnostic du problème de date...');
  
  try {
    // 1. Vérifier les dates disponibles en mai 2025
    console.log('\n📊 1. Dates disponibles en mai 2025:');
    const datesResult = await pool.query(`
      SELECT 
        DATE(cloture_tech) as date_cloture,
        COUNT(*) as count
      FROM interventions
      WHERE statut = 'CLOTURE TERMINEE'
        AND articles IS NOT NULL 
        AND articles != ''
        AND cloture_tech IS NOT NULL 
        AND cloture_tech != '' 
        AND cloture_tech != 'nan' 
        AND cloture_tech ~ '^[0-9]'
        AND (cloture_tech::date >= '2025-05-01' AND cloture_tech::date <= '2025-05-31')
      GROUP BY DATE(cloture_tech)
      ORDER BY date_cloture
      LIMIT 10
    `);
    
    console.log(`   📊 ${datesResult.rows.length} dates trouvées:`);
    datesResult.rows.forEach(row => {
      console.log(`      ${row.date_cloture}: ${row.count} interventions`);
    });
    
    // 2. Vérifier spécifiquement le 02/05/2025
    console.log('\n📊 2. Vérification du 02/05/2025:');
    const specificDateResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM interventions
      WHERE statut = 'CLOTURE TERMINEE'
        AND articles IS NOT NULL 
        AND articles != ''
        AND (
          (cloture_tech IS NOT NULL AND cloture_tech != '' AND cloture_tech != 'nan' AND 
           cloture_tech ~ '^[0-9]' AND 
           (cloture_tech::date >= '2025-05-02' AND cloture_tech::date <= '2025-05-02')) OR
          (cloture_hotline IS NOT NULL AND cloture_hotline != '' AND cloture_hotline != 'nan' AND 
           cloture_hotline ~ '^[0-9]' AND 
           (cloture_hotline::date >= '2025-05-02' AND cloture_hotline::date <= '2025-05-02')) OR
          (cloture_tech IS NULL AND cloture_hotline IS NULL AND 
           date_rdv IS NOT NULL AND date_rdv != '' AND date_rdv != 'nan' AND 
           date_rdv ~ '^[0-9]' AND 
           (date_rdv::date >= '2025-05-02' AND date_rdv::date <= '2025-05-02'))
        )
    `);
    
    console.log(`   📊 Interventions le 02/05/2025: ${specificDateResult.rows[0].count}`);
    
    // 3. Tester avec une date qui a des données
    if (datesResult.rows.length > 0) {
      const testDate = datesResult.rows[0].date_cloture;
      console.log(`\n📊 3. Test avec une date qui a des données (${testDate}):`);
      
      const testDateResult = await pool.query(`
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
             (i.cloture_tech::date >= $1::date AND i.cloture_tech::date <= $1::date)) OR
            (i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND 
             i.cloture_hotline ~ '^[0-9]' AND 
             (i.cloture_hotline::date >= $1::date AND i.cloture_hotline::date <= $1::date)) OR
            (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND 
             i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND 
             i.date_rdv ~ '^[0-9]' AND 
             (i.date_rdv::date >= $1::date AND i.date_rdv::date <= $1::date))
          )
        GROUP BY i.nom_technicien, i.prenom_technicien
        ORDER BY total_recette_technicien DESC
        LIMIT 3
      `, [testDate]);
      
      console.log(`   📊 Résultats pour ${testDate}: ${testDateResult.rows.length} techniciens`);
      testDateResult.rows.forEach((row, index) => {
        console.log(`      ${index + 1}. ${row.employe_nom} ${row.employe_prenom}: ${row.nombre_interventions} interventions, ${row.total_recette_technicien}€`);
      });
    }
    
    // 4. Vérifier le format des dates dans la base
    console.log('\n📊 4. Format des dates dans la base:');
    const formatResult = await pool.query(`
      SELECT 
        cloture_tech,
        cloture_hotline,
        date_rdv,
        COUNT(*) as count
      FROM interventions
      WHERE statut = 'CLOTURE TERMINEE'
        AND articles IS NOT NULL 
        AND articles != ''
        AND (cloture_tech IS NOT NULL OR cloture_hotline IS NOT NULL OR date_rdv IS NOT NULL)
      GROUP BY cloture_tech, cloture_hotline, date_rdv
      ORDER BY count DESC
      LIMIT 5
    `);
    
    console.log(`   📊 Formats de dates trouvés:`);
    formatResult.rows.forEach(row => {
      console.log(`      cloture_tech: ${row.cloture_tech}, cloture_hotline: ${row.cloture_hotline}, date_rdv: ${row.date_rdv} (${row.count} fois)`);
    });
    
    console.log('\n🎯 Diagnostic terminé !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

debugDateIssue().catch(console.error);
