const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://finalfibre_user:finalfibre_password_2024@localhost:5432/finalfibre_db' });

(async () => {
  try {
    // Check cout_par_salaire for HAKIRI
    const coutResult = await pool.query(`
      SELECT id, nom, prenom, employe_id, mois, annee, penalite, matricule 
      FROM cout_par_salaire 
      WHERE UPPER(nom) LIKE '%HAKIRI%' OR UPPER(prenom) LIKE '%HAKIRI%' 
      ORDER BY annee DESC, mois DESC, id
    `);
    
    console.log('=== COUT_PAR_SALAIRE for HAKIRI ===');
    coutResult.rows.forEach(row => {
      console.log(`ID=${row.id}, ${row.prenom} ${row.nom}, mois=${row.mois}/${row.annee}, employe_id=${row.employe_id}, matricule=${row.matricule}, penalite=${row.penalite}`);
    });
    
    // Check employes for HAKIRI
    const empResult = await pool.query(`
      SELECT id, nom, prenom, matricule 
      FROM employes 
      WHERE UPPER(nom) LIKE '%HAKIRI%' OR UPPER(prenom) LIKE '%HAKIRI%'
    `);
    
    console.log('\n=== EMPLOYES for HAKIRI ===');
    empResult.rows.forEach(row => {
      console.log(`ID=${row.id}, ${row.prenom} ${row.nom}, matricule=${row.matricule}`);
    });
    
    // Check for all duplicates in cout_par_salaire (same nom+prenom+mois+annee)
    const duplicatesResult = await pool.query(`
      SELECT nom, prenom, mois, annee, COUNT(*) as count
      FROM cout_par_salaire
      GROUP BY nom, prenom, mois, annee
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `);
    
    console.log('\n=== ALL DUPLICATES (same nom+prenom+mois+annee) ===');
    if (duplicatesResult.rows.length === 0) {
      console.log('No duplicates found');
    } else {
      duplicatesResult.rows.forEach(row => {
        console.log(`${row.prenom} ${row.nom} - ${row.mois}/${row.annee}: ${row.count} entries`);
      });
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
})();
