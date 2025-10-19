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

async function debugNameMatching() {
  console.log('🔍 Debug du matching des noms entre interventions et cout_par_salaire...');
  
  try {
    // 1. Vérifier les noms dans cout_par_salaire pour mai 2025
    console.log('\n📊 1. Noms dans cout_par_salaire (mai 2025):');
    const coutResult = await pool.query(`
      SELECT DISTINCT nom, prenom
      FROM cout_par_salaire
      WHERE mois = 5 AND annee = 2025
      ORDER BY nom, prenom
    `);
    
    console.log(`📋 ${coutResult.rows.length} techniciens dans cout_par_salaire:`);
    coutResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. "${row.nom}" "${row.prenom}"`);
    });
    
    // 2. Vérifier les noms dans interventions pour mai 2025
    console.log('\n📊 2. Noms dans interventions (mai 2025):');
    const interventionsResult = await pool.query(`
      SELECT DISTINCT nom_technicien, prenom_technicien, COUNT(*) as count
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
      GROUP BY nom_technicien, prenom_technicien
      ORDER BY count DESC
    `);
    
    console.log(`📋 ${interventionsResult.rows.length} techniciens dans interventions:`);
    interventionsResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. "${row.nom_technicien}" "${row.prenom_technicien}" (${row.count} interventions)`);
    });
    
    // 3. Comparer les correspondances
    console.log('\n📊 3. Analyse des correspondances:');
    const coutNames = coutResult.rows.map(row => ({
      nom: row.nom.toLowerCase().trim(),
      prenom: row.prenom.toLowerCase().trim(),
      original_nom: row.nom,
      original_prenom: row.prenom
    }));
    
    const interventionNames = interventionsResult.rows.map(row => ({
      nom: row.nom_technicien.toLowerCase().trim(),
      prenom: row.prenom_technicien.toLowerCase().trim(),
      original_nom: row.nom_technicien,
      original_prenom: row.prenom_technicien,
      count: row.count
    }));
    
    console.log('\n🔍 Correspondances trouvées:');
    let matches = 0;
    let noMatches = 0;
    
    coutNames.forEach(coutName => {
      const match = interventionNames.find(intName => 
        intName.nom === coutName.nom && intName.prenom === coutName.prenom
      );
      
      if (match) {
        console.log(`   ✅ "${coutName.original_nom} ${coutName.original_prenom}" → "${match.original_nom} ${match.original_prenom}" (${match.count} interventions)`);
        matches++;
      } else {
        console.log(`   ❌ "${coutName.original_nom} ${coutName.original_prenom}" → Aucune correspondance`);
        noMatches++;
      }
    });
    
    console.log(`\n📊 Résumé:`);
    console.log(`   - Correspondances trouvées: ${matches}`);
    console.log(`   - Aucune correspondance: ${noMatches}`);
    console.log(`   - Total techniciens cout_par_salaire: ${coutNames.length}`);
    
    // 4. Vérifier les techniciens avec des interventions mais sans correspondance
    console.log('\n📊 4. Techniciens avec interventions mais sans correspondance:');
    const unmatchedInterventions = interventionNames.filter(intName => 
      !coutNames.find(coutName => 
        coutName.nom === intName.nom && coutName.prenom === intName.prenom
      )
    );
    
    if (unmatchedInterventions.length > 0) {
      console.log(`📋 ${unmatchedInterventions.length} techniciens avec interventions mais pas dans cout_par_salaire:`);
      unmatchedInterventions.forEach((row, index) => {
        console.log(`   ${index + 1}. "${row.original_nom}" "${row.original_prenom}" (${row.count} interventions)`);
      });
    } else {
      console.log('✅ Tous les techniciens avec interventions ont une correspondance');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

debugNameMatching().catch(console.error);

