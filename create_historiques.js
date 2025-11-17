const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Configuration de la connexion
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'fibertech',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || ''
})

async function createHistoriquesTable() {
  try {
    console.log('📝 Création de la table historiques...')
    
    const sql = fs.readFileSync(
      path.join(__dirname, 'create_historiques_table.sql'),
      'utf8'
    )
    
    await pool.query(sql)
    
    console.log('✅ Table historiques créée avec succès!')
    console.log('📊 Structure:')
    console.log('  - id: Identifiant unique')
    console.log('  - user_id: ID de l\'utilisateur')
    console.log('  - user_name: Nom de l\'utilisateur')
    console.log('  - action: CREATE, UPDATE, DELETE')
    console.log('  - table_name: Table affectée')
    console.log('  - record_id: ID de l\'enregistrement')
    console.log('  - section: Section de l\'application')
    console.log('  - description: Description de l\'action')
    console.log('  - old_values: Anciennes valeurs (JSONB)')
    console.log('  - new_values: Nouvelles valeurs (JSONB)')
    console.log('  - ip_address: Adresse IP')
    console.log('  - user_agent: Navigateur')
    console.log('  - created_at: Date de création')
    
    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Erreur lors de la création de la table:', error)
    await pool.end()
    process.exit(1)
  }
}

createHistoriquesTable()
