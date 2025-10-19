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

async function testAugustAPI() {
  console.log('🔍 Test de l\'API pour août 2025...');
  
  try {
    // Test direct de la requête SQL
    const result = await pool.query(`
      SELECT 
        i.nom_technicien as employe_nom,
        i.prenom_technicien as employe_prenom,
        CONCAT('TECH_', UPPER(SUBSTRING(i.nom_technicien, 1, 3)), UPPER(SUBSTRING(i.prenom_technicien, 1, 2))) as matricule,
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
          -- Filtrage par cloture_tech
          (i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND 
           (i.cloture_tech::date >= $1::date AND i.cloture_tech::date <= $2::date)) OR
          -- Filtrage par cloture_hotline
          (i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND 
           (i.cloture_hotline::date >= $1::date AND i.cloture_hotline::date <= $2::date)) OR
          -- Filtrage par date_rdv si les autres sont NULL
          (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND 
           i.date_rdv IS NOT NULL AND i.date_rdv != '' AND 
           (i.date_rdv::date >= $1::date AND i.date_rdv::date <= $2::date))
        )
      GROUP BY i.nom_technicien, i.prenom_technicien
      ORDER BY total_recette_technicien DESC
    `, ['2025-08-01', '2025-08-31']);
    
    console.log('✅ Requête SQL exécutée avec succès');
    console.log(`📊 Résultats: ${result.rows.length} techniciens trouvés`);
    
    if (result.rows.length > 0) {
      console.log('📋 Techniciens avec interventions en août 2025:');
      result.rows.forEach(row => {
        console.log(`   - ${row.employe_nom} ${row.employe_prenom}: ${row.nombre_interventions} interventions, ${row.total_recette_technicien}€`);
      });
    } else {
      console.log('❌ Aucun technicien trouvé avec des interventions en août 2025');
    }
    
  } catch (error) {
    console.error('❌ Erreur SQL:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

testAugustAPI().catch(console.error);
