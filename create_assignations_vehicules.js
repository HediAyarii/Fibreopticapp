const { Client } = require('pg')

async function createAssignationsTable() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'finalfibre_db',
    user: process.env.DB_USER || 'finalfibre_user',
    password: process.env.DB_PASSWORD || 'finalfibre_password_2024',
  })

  try {
    await client.connect()
    console.log('✅ Connexion à la base de données réussie')

    // Table assignations_vehicules pour l'historique des assignations
    await client.query(`
      CREATE TABLE IF NOT EXISTS assignations_vehicules (
        id SERIAL PRIMARY KEY,
        vehicule_id INTEGER NOT NULL REFERENCES vehicules(id) ON DELETE CASCADE,
        employe_id INTEGER NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
        date_assignation DATE NOT NULL DEFAULT CURRENT_DATE,
        date_fin DATE,
        kilometrage_debut INTEGER,
        kilometrage_fin INTEGER,
        statut VARCHAR(20) DEFAULT 'active',
        commentaires TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Table assignations_vehicules créée')

    // Index pour optimiser les performances
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_assignations_vehicule ON assignations_vehicules(vehicule_id);
      CREATE INDEX IF NOT EXISTS idx_assignations_employe ON assignations_vehicules(employe_id);
      CREATE INDEX IF NOT EXISTS idx_assignations_statut ON assignations_vehicules(statut);
      CREATE INDEX IF NOT EXISTS idx_assignations_date ON assignations_vehicules(date_assignation);
    `)
    console.log('✅ Index créés')

    console.log('🎉 Table assignations_vehicules créée avec succès!')

  } catch (error) {
    console.error('❌ Erreur:', error)
    throw error
  } finally {
    await client.end()
  }
}

createAssignationsTable()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
