// Script pour créer la table push_subscriptions
import { Pool } from 'pg'
import fs from 'fs'

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'finalfibre',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
})

async function createPushSubscriptionsTable() {
  try {
    console.log('🔧 Création de la table push_subscriptions...')
    
    const sql = fs.readFileSync('./scripts/create_push_subscriptions_table.sql', 'utf8')
    await pool.query(sql)
    
    console.log('✅ Table push_subscriptions créée avec succès!')
    
    // Vérifier que la table existe
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'push_subscriptions'
    `)
    
    if (result.rows.length > 0) {
      console.log('✅ Table push_subscriptions vérifiée dans la base de données')
    } else {
      console.log('❌ Table push_subscriptions non trouvée')
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de la table:', error)
  } finally {
    await pool.end()
  }
}

createPushSubscriptionsTable()
