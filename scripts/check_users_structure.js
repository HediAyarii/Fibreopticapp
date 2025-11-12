const { Pool } = require('pg')

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024'
})

async function checkUsersTable() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `)
    
    console.log('📋 Colonnes de la table users:')
    result.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`)
    })
    
  } catch (error) {
    console.error('Erreur:', error.message)
  } finally {
    await pool.end()
  }
}

checkUsersTable()
