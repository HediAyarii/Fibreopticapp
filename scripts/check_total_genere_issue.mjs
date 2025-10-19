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

async function checkTotalGenereIssue() {
  console.log('🔍 Vérification du problème Total Généré = 0€...');
  
  try {
    // 1. Vérifier les données actuelles dans cout_par_salaire
    console.log('\n📊 1. Données actuelles dans cout_par_salaire:');
    const coutResult = await pool.query(`
      SELECT nom, prenom, mois, annee, total_genere, rap
      FROM cout_par_salaire
      WHERE mois = 5 AND annee = 2025
      ORDER BY nom, prenom
      LIMIT 10
    `);
    
    console.log(`📋 ${coutResult.rows.length} enregistrements trouvés pour mai 2025:`);
    coutResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.nom} ${row.prenom}: Total Généré = ${parseFloat(row.total_genere || 0).toFixed(2)}€, RAP = ${parseFloat(row.rap || 0).toFixed(2)}€`);
    });
    
    // 2. Vérifier les données du bénéfice brut pour les mêmes techniciens
    console.log('\n📊 2. Calcul du bénéfice brut pour les mêmes techniciens:');
    
    for (const record of coutResult.rows.slice(0, 3)) { // Vérifier seulement les 3 premiers
      console.log(`\n🔍 Calcul pour ${record.nom} ${record.prenom}:`);
      
      const beneficeResult = await pool.query(`
        SELECT 
          COUNT(*) as nombre_interventions,
          COALESCE(SUM(
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
          ), 0) as benefice_total
        FROM interventions i
        WHERE i.statut = 'CLOTURE TERMINEE'
          AND i.articles IS NOT NULL 
          AND i.articles != ''
          AND LOWER(i.nom_technicien) = LOWER($1)
          AND LOWER(i.prenom_technicien) = LOWER($2)
          AND (
            (i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND 
             i.cloture_tech ~ '^[0-9]' AND 
             (i.cloture_tech::date >= DATE($3 || '-' || LPAD($4::text, 2, '0') || '-01') AND 
              i.cloture_tech::date <= (DATE($3 || '-' || LPAD($4::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))) OR
            (i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND 
             i.cloture_hotline ~ '^[0-9]' AND 
             (i.cloture_hotline::date >= DATE($3 || '-' || LPAD($4::text, 2, '0') || '-01') AND 
              i.cloture_hotline::date <= (DATE($3 || '-' || LPAD($4::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))) OR
            (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND 
             i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND 
             i.date_rdv ~ '^[0-9]' AND 
             (i.date_rdv::date >= DATE($3 || '-' || LPAD($4::text, 2, '0') || '-01') AND 
              i.date_rdv::date <= (DATE($3 || '-' || LPAD($4::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day')))
          )
      `, [record.nom, record.prenom, record.annee, record.mois]);
      
      const beneficeData = beneficeResult.rows[0];
      const beneficeTotal = parseFloat(beneficeData.benefice_total || 0);
      const currentTotal = parseFloat(record.total_genere || 0);
      
      console.log(`   - Interventions trouvées: ${beneficeData.nombre_interventions}`);
      console.log(`   - Bénéfice Brut calculé: ${beneficeTotal.toFixed(2)}€`);
      console.log(`   - Total Généré actuel: ${currentTotal.toFixed(2)}€`);
      console.log(`   - Différence: ${(beneficeTotal - currentTotal).toFixed(2)}€`);
      
      if (Math.abs(beneficeTotal - currentTotal) > 0.01) {
        console.log(`   ❌ INCOHÉRENT - Besoin de synchronisation`);
      } else {
        console.log(`   ✅ COHÉRENT`);
      }
    }
    
    // 3. Vérifier s'il y a des interventions pour mai 2025
    console.log('\n📊 3. Vérification des interventions pour mai 2025:');
    const interventionsResult = await pool.query(`
      SELECT COUNT(*) as total_interventions
      FROM interventions
      WHERE statut = 'CLOTURE TERMINEE'
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
    `);
    
    console.log(`📋 Total interventions terminées en mai 2025: ${interventionsResult.rows[0].total_interventions}`);
    
    // 4. Forcer une synchronisation
    console.log('\n🔧 4. Synchronisation forcée...');
    const syncResult = await pool.query(`
      SELECT * FROM force_sync_all_charges()
    `);
    
    if (syncResult.rows.length > 0) {
      console.log(`🔄 ${syncResult.rows.length} synchronisations effectuées:`);
      syncResult.rows.forEach(row => {
        console.log(`   - ${row.employe_nom} ${row.employe_prenom}: ${row.ancien_total.toFixed(2)}€ → ${row.nouveau_total.toFixed(2)}€`);
      });
    } else {
      console.log('✅ Aucune synchronisation nécessaire');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

checkTotalGenereIssue().catch(console.error);

