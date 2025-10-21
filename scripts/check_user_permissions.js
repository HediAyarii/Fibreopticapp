#!/usr/bin/env node

const { Pool } = require('pg')

// Configuration de la base de données
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'finalfibre_db',
  user: process.env.DB_USER || 'finalfibre_user',
  password: process.env.DB_PASSWORD || 'finalfibre_password_2024',
})

async function checkUserPermissions() {
  console.log('🔍 Vérification des permissions de l\'utilisateur admin@dgflow.com...')
  
  try {
    // Récupérer les permissions de l'utilisateur
    const result = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.role_id,
        r.name as role_name,
        r.permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = $1
    `, ['admin@dgflow.com'])
    
    if (result.rows.length === 0) {
      console.log('❌ Utilisateur non trouvé')
      return
    }
    
    const user = result.rows[0]
    console.log('✅ Utilisateur trouvé:')
    console.log(`   - Username: ${user.username}`)
    console.log(`   - Email: ${user.email}`)
    console.log(`   - Rôle: ${user.role_name} (ID: ${user.role_id})`)
    console.log(`   - Permissions: ${JSON.stringify(user.permissions)}`)
    
    if (user.permissions && user.permissions.sections) {
      console.log('\n📋 Sections autorisées:')
      user.permissions.sections.forEach(section => {
        console.log(`   - ${section}`)
      })
    } else {
      console.log('\n❌ Aucune permission spécifique trouvée')
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await pool.end()
  }
}

// Exécuter le script
checkUserPermissions()
