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

async function createRapFunction() {
  console.log('🔧 Création de la fonction de calcul du RAP...');
  
  try {
    // 1. Créer la fonction de calcul du RAP
    console.log('\n📊 1. Création de la fonction calculer_rap_avec_paiements...');
    
    await pool.query(`
      CREATE OR REPLACE FUNCTION calculer_rap_avec_paiements(
        p_total_genere NUMERIC,
        p_salaire_net NUMERIC,
        p_charge NUMERIC,
        p_taxe NUMERIC,
        p_penalite NUMERIC
      )
      RETURNS NUMERIC AS $$
      BEGIN
        -- RAP = Total généré - (Salaire net + Charge + Taxe + Pénalité)
        RETURN COALESCE(p_total_genere, 0) - (
          COALESCE(p_salaire_net, 0) + 
          COALESCE(p_charge, 0) + 
          COALESCE(p_taxe, 0) + 
          COALESCE(p_penalite, 0)
        );
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ Fonction calculer_rap_avec_paiements créée');
    
    // 2. Tester la fonction avec les données de BENADBALLAH
    console.log('\n📊 2. Test de la fonction avec BENADBALLAH TAOUFIK...');
    const testResult = await pool.query(`
      SELECT calculer_rap_avec_paiements(3070.00, 1406.34, 456.59, 50.00, 0.00) as rap_test
    `);
    
    const rapTest = parseFloat(testResult.rows[0].rap_test || 0);
    console.log(`   📊 RAP calculé par la fonction: ${rapTest.toFixed(2)}€`);
    
    // 3. Mettre à jour tous les RAP manquants ou incorrects
    console.log('\n📊 3. Mise à jour de tous les RAP...');
    const updateResult = await pool.query(`
      UPDATE cout_par_salaire
      SET rap = calculer_rap_avec_paiements(total_genere, salaire_net, charge, taxe, penalite),
          updated_at = CURRENT_TIMESTAMP
      WHERE mois = 5 AND annee = 2025
    `);
    
    console.log(`   ✅ ${updateResult.rowCount} enregistrements mis à jour`);
    
    // 4. Vérifier les RAP mis à jour
    console.log('\n📊 4. Vérification des RAP mis à jour...');
    const verifyResult = await pool.query(`
      SELECT nom, prenom, total_genere, salaire_net, charge, taxe, penalite, rap
      FROM cout_par_salaire
      WHERE mois = 5 AND annee = 2025
      ORDER BY nom, prenom
    `);
    
    console.log(`   📊 ${verifyResult.rows.length} enregistrements vérifiés:`);
    verifyResult.rows.forEach((row, index) => {
      const totalDepenses = parseFloat(row.salaire_net || 0) + parseFloat(row.charge || 0) + parseFloat(row.taxe || 0) + parseFloat(row.penalite || 0);
      const rapAttendu = parseFloat(row.total_genere || 0) - totalDepenses;
      const difference = Math.abs(parseFloat(row.rap || 0) - rapAttendu);
      
      console.log(`   ${index + 1}. ${row.nom} ${row.prenom}: RAP = ${row.rap}€ (diff: ${difference.toFixed(2)}€)`);
    });
    
    // 5. Vérifier spécifiquement BENADBALLAH
    console.log('\n📊 5. Vérification spécifique de BENADBALLAH TAOUFIK...');
    const benabdallahResult = await pool.query(`
      SELECT total_genere, salaire_net, charge, taxe, penalite, rap
      FROM cout_par_salaire
      WHERE LOWER(nom) = 'benadballah' AND LOWER(prenom) = 'taoufik'
        AND mois = 5 AND annee = 2025
    `);
    
    if (benabdallahResult.rows.length > 0) {
      const record = benabdallahResult.rows[0];
      console.log(`   ✅ BENADBALLAH TAOUFIK:`);
      console.log(`      Total généré: ${record.total_genere}€`);
      console.log(`      RAP: ${record.rap}€`);
      
      const totalDepenses = parseFloat(record.salaire_net || 0) + parseFloat(record.charge || 0) + parseFloat(record.taxe || 0) + parseFloat(record.penalite || 0);
      const rapAttendu = parseFloat(record.total_genere || 0) - totalDepenses;
      const difference = Math.abs(parseFloat(record.rap || 0) - rapAttendu);
      
      if (difference < 0.01) {
        console.log(`      ✅ RAP cohérent !`);
      } else {
        console.log(`      ⚠️ RAP incohérent (différence: ${difference.toFixed(2)}€)`);
      }
    }
    
    console.log('\n🎯 Fonction RAP créée et tous les RAP mis à jour !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

createRapFunction().catch(console.error);

