import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function createCarburantAssignationsTable() {
  try {
    console.log('🔧 Création de la table carburant_assignations...')
    
    // Créer la table carburant_assignations
    await pool.query(`
      CREATE TABLE IF NOT EXISTS carburant_assignations (
        id SERIAL PRIMARY KEY,
        employe_id INTEGER NOT NULL,
        carte_id VARCHAR(255) NOT NULL,
        date_assignation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        date_fin TIMESTAMP,
        statut VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employe_id) REFERENCES employes(id) ON DELETE CASCADE
      )
    `)
    console.log('✅ Table carburant_assignations créée')
    
    // Créer les index
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_carburant_assignations_employe_id ON carburant_assignations(employe_id)
    `)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_carburant_assignations_carte_id ON carburant_assignations(carte_id)
    `)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_carburant_assignations_statut ON carburant_assignations(statut)
    `)
    console.log('✅ Index créés')
    
    console.log('\n🎯 Table carburant_assignations créée avec succès !')
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de la table:', error)
  } finally {
    await pool.end()
  }
}

createCarburantAssignationsTable()





