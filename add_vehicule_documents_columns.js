require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://finalfibre_user:finalfibre_password_2024@localhost:5432/finalfibre_db'
})

async function migrate() {
  const client = await pool.connect()
  try {
    await client.query(`
      ALTER TABLE vehicules 
      ADD COLUMN IF NOT EXISTS assurance_pdf_url TEXT,
      ADD COLUMN IF NOT EXISTS assurance_pdf_filename VARCHAR(255),
      ADD COLUMN IF NOT EXISTS carte_grise_pdf_url TEXT,
      ADD COLUMN IF NOT EXISTS carte_grise_pdf_filename VARCHAR(255)
    `)
    console.log('✅ Colonnes documents PDF ajoutées avec succès')
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()
