const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://finalfibre_user:finalfibre_password_2024@localhost:5432/finalfibre_db'
});

async function checkBenChedli() {
  try {
    // Vérifier les colonnes de la table
    const columnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'cout_par_salaire'
    `);
    console.log('Colonnes de cout_par_salaire:');
    columnsResult.rows.forEach(row => console.log(' -', row.column_name));

    // Rechercher l'employé Ben Chedli Hamdi
    const employeeResult = await pool.query(`
      SELECT id, nom, prenom 
      FROM employes 
      WHERE LOWER(nom || ' ' || prenom) LIKE '%ben%chedli%' 
         OR LOWER(nom || ' ' || prenom) LIKE '%chedli%hamdi%'
         OR LOWER(prenom || ' ' || nom) LIKE '%hamdi%chedli%'
         OR (LOWER(nom) LIKE '%chedli%' AND LOWER(prenom) LIKE '%hamdi%')
         OR (LOWER(nom) LIKE '%ben chedli%')
         OR LOWER(nom) = 'hamdi'
    `);

    console.log('\nEmployés trouvés:');
    console.table(employeeResult.rows);

    if (employeeResult.rows.length > 0) {
      const employeId = employeeResult.rows[0].id;
      
      // Récupérer toutes les données de coût par salaire
      const cpsResult = await pool.query(`
        SELECT *
        FROM cout_par_salaire
        WHERE employe_id = $1
        ORDER BY annee DESC, mois DESC
      `, [employeId]);

      console.log('\n📊 Détail des coûts par salaire:');
      console.table(cpsResult.rows);

      // Calculer le total généré
      const totalsResult = await pool.query(`
        SELECT 
          COUNT(*) as nombre_mois,
          SUM(total_genere) as total_genere,
          SUM(salaire_net) as total_salaire_net,
          SUM(impot) as total_impot
        FROM cout_par_salaire
        WHERE employe_id = $1
      `, [employeId]);

      console.log('\n💰 TOTAUX pour HAMDI BEN CHEDLI:');
      console.table(totalsResult.rows);
    }

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await pool.end();
  }
}

checkBenChedli();
