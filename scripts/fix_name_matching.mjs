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

async function fixNameMatching() {
  console.log('🔧 Correction du matching des noms...');
  
  try {
    // Mapping des correspondances correctes
    const nameMappings = [
      // Format: [nom_cout_par_salaire, prenom_cout_par_salaire, nom_interventions, prenom_interventions]
      ['BENCHEDLI', 'HAMDI', 'HAMDI', 'BEN CHEDLI'],
      ['BENKHALIFA', 'AYMEN', 'BEN KHALIFA', 'Aymen'],
      ['BENTRAD', 'FARES', 'BEN TRAD', 'Fares'],
      ['BENSALAH', 'HAMZA', 'BEN SALAH', 'Hamza'],
      ['BENJABALLAH', 'RADHOUAN', 'BEN JABALLAH', 'Radhouan'],
      ['OUERFELLI', 'MOHAMEDMAROUEN', 'OUERFELLI', 'Mohamed Marouen'],
      ['MOULAHI', 'ZOBAIR', 'MOULAHI', 'Mohamed-Bechir'],
      ['BECHIRMOULAHI', 'MOHAMED', 'MOULAHI', 'Mohamed-Bechir'], // Possible doublon
    ];
    
    console.log('\n📊 1. Correction des correspondances de noms...');
    
    for (const mapping of nameMappings) {
      const [coutNom, coutPrenom, intNom, intPrenom] = mapping;
      
      console.log(`\n🔍 Traitement: ${coutNom} ${coutPrenom} → ${intNom} ${intPrenom}`);
      
      // Vérifier si le technicien existe dans cout_par_salaire
      const coutResult = await pool.query(`
        SELECT id, nom, prenom, total_genere
        FROM cout_par_salaire
        WHERE LOWER(nom) = LOWER($1) AND LOWER(prenom) = LOWER($2)
          AND mois = 5 AND annee = 2025
      `, [coutNom, coutPrenom]);
      
      if (coutResult.rows.length === 0) {
        console.log(`   ⚠️ Technicien non trouvé dans cout_par_salaire`);
        continue;
      }
      
      const coutRecord = coutResult.rows[0];
      console.log(`   - ID: ${coutRecord.id}, Total Généré actuel: ${parseFloat(coutRecord.total_genere || 0).toFixed(2)}€`);
      
      // Calculer le bénéfice brut avec le bon nom
      const beneficeResult = await pool.query(`
        SELECT COALESCE(SUM(
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
             (i.cloture_tech::date >= '2025-05-01' AND i.cloture_tech::date <= '2025-05-31')) OR
            (i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND 
             i.cloture_hotline ~ '^[0-9]' AND 
             (i.cloture_hotline::date >= '2025-05-01' AND i.cloture_hotline::date <= '2025-05-31')) OR
            (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND 
             i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND 
             i.date_rdv ~ '^[0-9]' AND 
             (i.date_rdv::date >= '2025-05-01' AND i.date_rdv::date <= '2025-05-31'))
          )
      `, [intNom, intPrenom]);
      
      const beneficeTotal = parseFloat(beneficeResult.rows[0]?.benefice_total || 0);
      const currentTotal = parseFloat(coutRecord.total_genere || 0);
      
      console.log(`   - Bénéfice Brut calculé: ${beneficeTotal.toFixed(2)}€`);
      console.log(`   - Différence: ${(beneficeTotal - currentTotal).toFixed(2)}€`);
      
      if (Math.abs(beneficeTotal - currentTotal) > 0.01) {
        // Mettre à jour le total_genere
        await pool.query(`
          UPDATE cout_par_salaire 
          SET total_genere = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [beneficeTotal, coutRecord.id]);
        
        console.log(`   ✅ Total Généré mis à jour: ${currentTotal.toFixed(2)}€ → ${beneficeTotal.toFixed(2)}€`);
        
        // Recalculer le RAP
        const rapResult = await pool.query(`
          SELECT calculer_rap_avec_paiements($1) as rap_actuel
        `, [coutRecord.id]);
        
        const newRap = parseFloat(rapResult.rows[0]?.rap_actuel || 0);
        
        await pool.query(`
          UPDATE cout_par_salaire 
          SET rap = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [newRap, coutRecord.id]);
        
        console.log(`   ✅ RAP recalculé: ${newRap.toFixed(2)}€`);
      } else {
        console.log(`   ✅ Déjà cohérent`);
      }
    }
    
    console.log('\n🎯 Correction terminée !');
    
    // Vérification finale
    console.log('\n📊 2. Vérification finale des Total Généré:');
    const finalResult = await pool.query(`
      SELECT nom, prenom, total_genere, rap
      FROM cout_par_salaire
      WHERE mois = 5 AND annee = 2025
      ORDER BY total_genere DESC
      LIMIT 10
    `);
    
    console.log(`📋 Top 10 des Total Généré après correction:`);
    finalResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.nom} ${row.prenom}: ${parseFloat(row.total_genere || 0).toFixed(2)}€ (RAP: ${parseFloat(row.rap || 0).toFixed(2)}€)`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

fixNameMatching().catch(console.error);