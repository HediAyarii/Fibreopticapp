const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024'
});

async function createTable() {
  try {
    console.log('🔄 Création de la table primes_employes...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS primes_employes (
        id SERIAL PRIMARY KEY,
        cout_par_salaire_id INTEGER NOT NULL REFERENCES cout_par_salaire(id) ON DELETE CASCADE,
        montant DECIMAL(10,2) NOT NULL,
        note TEXT,
        deduit_rap BOOLEAN DEFAULT true,
        date_prime DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table primes_employes créée avec succès!');
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_primes_cout_par_salaire_id 
      ON primes_employes(cout_par_salaire_id)
    `);
    console.log('✅ Index créé avec succès!');
    
    await pool.end();
    console.log('✅ Terminé!');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await pool.end();
    process.exit(1);
  }
}

createTable();
