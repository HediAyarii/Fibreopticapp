const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://finalfibre_user:finalfibre_password_2024@localhost:5432/finalfibre_db' });

async function checkRecetteHamdi() {
  try {
    // Trouver l'ID de HAMDI BEN CHEDLI
    const emp = await pool.query(`SELECT id, nom, prenom, matricule FROM employes WHERE LOWER(nom) = 'hamdi'`);
    console.log('Employé:', emp.rows[0]);
    const empId = emp.rows[0].id;

    // Compter et sommer les interventions par mois (Oct et Nov 2025)
    const recetteParMois = await pool.query(`
      SELECT 
        SUBSTRING(date_rdv, 6, 2) as mois,
        SUBSTRING(date_rdv, 1, 4) as annee,
        COUNT(*) as nb_interventions
      FROM interventions 
      WHERE (LOWER(nom_technicien) = 'hamdi' OR LOWER(prenom_technicien) LIKE '%chedli%')
        AND date_rdv LIKE '2025-1%'
      GROUP BY SUBSTRING(date_rdv, 6, 2), SUBSTRING(date_rdv, 1, 4)
      ORDER BY annee DESC, mois DESC
    `);
    
    console.log('\n📅 Nombre d\'interventions par mois (2025):');
    console.table(recetteParMois.rows);

    // Total interventions
    const totalInter = await pool.query(`
      SELECT 
        COUNT(*) as nb_interventions_total
      FROM interventions 
      WHERE LOWER(nom_technicien) = 'hamdi' OR LOWER(prenom_technicien) LIKE '%chedli%'
    `);

    console.log('\n🎯 TOTAL interventions:');
    console.table(totalInter.rows);

    // Données dans cout_par_salaire
    const cps = await pool.query(`
      SELECT mois, annee, total_genere, salaire_net, rap
      FROM cout_par_salaire
      WHERE employe_id = $1
      ORDER BY annee DESC, mois DESC
    `, [empId]);

    console.log('\n💰 Données dans cout_par_salaire (Total Généré):');
    console.table(cps.rows);

    // Calculer le total généré
    const totalGenere = await pool.query(`
      SELECT SUM(total_genere::numeric) as total_genere_global
      FROM cout_par_salaire
      WHERE employe_id = $1
    `, [empId]);

    console.log('\n🎯 TOTAL GÉNÉRÉ (depuis cout_par_salaire):', totalGenere.rows[0].total_genere_global, '€');

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await pool.end();
  }
}

checkRecetteHamdi();
