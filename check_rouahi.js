const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://finalfibre_user:finalfibre_password_2024@localhost:5432/finalfibre_db'
});

async function main() {
  try {
    // Voir quelques exemples de dates dans les interventions
    const samples = await pool.query(`
      SELECT cloture_tech, cloture_hotline, date_rdv, statut
      FROM interventions 
      WHERE nom_technicien ILIKE '%ROUAHI%'
        AND statut = 'CLOTURE TERMINEE'
      LIMIT 5
    `);
    console.log('Exemples de dates dans interventions:');
    console.log(samples.rows);

    // Essayer avec date_rdv
    const withDateRdv = await pool.query(`
      SELECT COUNT(*) as count
      FROM interventions 
      WHERE nom_technicien ILIKE '%ROUAHI%'
        AND statut = 'CLOTURE TERMINEE'
        AND date_rdv IS NOT NULL
        AND date_rdv != ''
        AND date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}'
        AND TO_DATE(date_rdv, 'DD/MM/YYYY') >= '2025-12-01' 
        AND TO_DATE(date_rdv, 'DD/MM/YYYY') <= '2025-12-31'
    `);
    console.log('\nInterventions CLOTUREES avec date_rdv en décembre:');
    console.log(withDateRdv.rows);

    // Tester le calcul du matricule
    const matriculeTest = await pool.query(`
      SELECT DISTINCT
        nom_technicien,
        prenom_technicien,
        CONCAT('TECH_', UPPER(SUBSTRING(SPLIT_PART(nom_technicien, ' ', 1), 1, 3)), 
               UPPER(SUBSTRING(SPLIT_PART(prenom_technicien, ' ', 1), 1, 2))) as matricule_genere
      FROM interventions 
      WHERE nom_technicien ILIKE '%ROUAHI%'
    `);
    console.log('\nMatricule généré:');
    console.log(matriculeTest.rows);

  } catch (err) {
    console.error('Erreur:', err.message);
  } finally {
    await pool.end();
  }
}

main();
