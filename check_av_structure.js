const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://finalfibre_user:finalfibre_password_2024@localhost:5432/finalfibre_db'
});

async function main() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'assignations_vehicules'
      ORDER BY ordinal_position
    `);
    console.log('Structure de assignations_vehicules:');
    console.log(result.rows);
    
    // Vérifier aussi un échantillon de données
    const sample = await pool.query(`SELECT * FROM assignations_vehicules LIMIT 3`);
    console.log('\nÉchantillon de données:');
    console.log(sample.rows);
  } catch (err) {
    console.error('Erreur:', err.message);
  } finally {
    await pool.end();
  }
}

main();
