const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://finalfibre_user:finalfibre_password_2024@localhost:5432/finalfibre_db'
});

async function main() {
  const OLD_MATRICULE = 'TECH_ROUHM';
  const NEW_MATRICULE = 'TECH_ROUMO';
  
  console.log(`\n🔄 Mise à jour du matricule: ${OLD_MATRICULE} → ${NEW_MATRICULE}\n`);
  
  try {
    // 1. Table employes (table principale)
    const result1 = await pool.query(`
      UPDATE employes 
      SET matricule = $1 
      WHERE matricule = $2 
      RETURNING id, nom, prenom, matricule
    `, [NEW_MATRICULE, OLD_MATRICULE]);
    console.log('✅ Table employes:', result1.rowCount, 'lignes mises à jour');
    if (result1.rows.length > 0) console.log('   →', result1.rows);

    // 2. Table cout_par_salaire
    const result2 = await pool.query(`
      UPDATE cout_par_salaire 
      SET matricule = $1 
      WHERE matricule = $2 
      RETURNING id, nom, prenom, mois, annee
    `, [NEW_MATRICULE, OLD_MATRICULE]);
    console.log('✅ Table cout_par_salaire:', result2.rowCount, 'lignes mises à jour');

    // 3. Table primes_employes (si elle utilise matricule)
    try {
      const result3 = await pool.query(`
        UPDATE primes_employes 
        SET matricule = $1 
        WHERE matricule = $2 
        RETURNING id
      `, [NEW_MATRICULE, OLD_MATRICULE]);
      console.log('✅ Table primes_employes:', result3.rowCount, 'lignes mises à jour');
    } catch (e) {
      console.log('⚠️ Table primes_employes: non applicable ou erreur');
    }

    // 4. Table consommations_carburant (si elle existe)
    try {
      const result4 = await pool.query(`
        UPDATE consommations_carburant 
        SET matricule_employe = $1 
        WHERE matricule_employe = $2 
        RETURNING id
      `, [NEW_MATRICULE, OLD_MATRICULE]);
      console.log('✅ Table consommations_carburant:', result4.rowCount, 'lignes mises à jour');
    } catch (e) {
      console.log('⚠️ Table consommations_carburant: non applicable ou erreur');
    }

    // 5. Table penalites (si elle utilise matricule)
    try {
      const result5 = await pool.query(`
        UPDATE penalites 
        SET matricule = $1 
        WHERE matricule = $2 
        RETURNING id
      `, [NEW_MATRICULE, OLD_MATRICULE]);
      console.log('✅ Table penalites:', result5.rowCount, 'lignes mises à jour');
    } catch (e) {
      console.log('⚠️ Table penalites: non applicable ou erreur');
    }

    // 6. Table amendes_vehicules (via employe_id, pas besoin de modifier)
    console.log('ℹ️ Table amendes_vehicules: liée via employe_id (pas de modification nécessaire)');

    // 7. Table assignations_vehicules (via employe_id, pas besoin de modifier)
    console.log('ℹ️ Table assignations_vehicules: liée via employe_id (pas de modification nécessaire)');

    // Vérification finale
    console.log('\n📋 Vérification finale:');
    const verification = await pool.query(`
      SELECT matricule, nom, prenom, pourcentage_taxe, statut 
      FROM employes 
      WHERE matricule = $1
    `, [NEW_MATRICULE]);
    console.log('Employé avec nouveau matricule:', verification.rows);

    const coutVerif = await pool.query(`
      SELECT COUNT(*) as count 
      FROM cout_par_salaire 
      WHERE matricule = $1
    `, [NEW_MATRICULE]);
    console.log('Entrées cout_par_salaire avec nouveau matricule:', coutVerif.rows[0].count);

    console.log('\n✅ Mise à jour terminée avec succès!');
    console.log(`   Le matricule ${NEW_MATRICULE} sera maintenant utilisé pour récupérer:`);
    console.log('   - Recettes générées (interventions)');
    console.log('   - Taxes');
    console.log('   - Pénalités');
    console.log('   - Consommation carburant');
    console.log('   - Amendes');
    console.log('   - Primes');

  } catch (err) {
    console.error('❌ Erreur:', err.message);
  } finally {
    await pool.end();
  }
}

main();
