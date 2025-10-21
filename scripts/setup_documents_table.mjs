import { Pool } from 'pg'
import fs from 'fs'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function setupDocumentsTable() {
  try {
    console.log('📋 Création de la table documents_administratifs...')
    
    // Lire le fichier SQL
    const sql = fs.readFileSync('scripts/create_documents_table.sql', 'utf8')
    
    // Exécuter le script SQL
    await pool.query(sql)
    
    console.log('✅ Table documents_administratifs créée avec succès')
    console.log('✅ Index créés')
    console.log('✅ Trigger créé')
    console.log('✅ Vue créée')
    console.log('✅ Données de test insérées')
    
    // Vérifier que la table existe
    const result = await pool.query(`
      SELECT COUNT(*) as count 
      FROM documents_administratifs
    `)
    
    console.log(`📊 Nombre de documents dans la table: ${result.rows[0].count}`)
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de la table:', error.message)
    throw error
  } finally {
    await pool.end()
  }
}

setupDocumentsTable()
  .then(() => {
    console.log('🎯 Configuration terminée')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error)
    process.exit(1)
  })




