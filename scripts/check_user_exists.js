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

async function checkUserExists() {
  console.log('🔍 Vérification de l\'utilisateur admin@dgflow.com...')
  
  try {
    // Rechercher l'utilisateur
    const result = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.role_id,
        u.first_name,
        u.last_name,
        u.is_active,
        r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = $1
    `, ['admin@dgflow.com'])
    
    if (result.rows.length === 0) {
      console.log('❌ Utilisateur admin@dgflow.com non trouvé')
      
      // Lister tous les utilisateurs
      const allUsers = await pool.query('SELECT email, username, is_active FROM users ORDER BY created_at DESC')
      console.log('\n📋 Tous les utilisateurs:')
      allUsers.rows.forEach(user => {
        console.log(`   - ${user.email} (${user.username}) - ${user.is_active ? 'actif' : 'inactif'}`)
      })
    } else {
      const user = result.rows[0]
      console.log('✅ Utilisateur trouvé:')
      console.log(`   - ID: ${user.id}`)
      console.log(`   - Username: ${user.username}`)
      console.log(`   - Email: ${user.email}`)
      console.log(`   - Rôle: ${user.role_name} (ID: ${user.role_id})`)
      console.log(`   - Nom: ${user.first_name} ${user.last_name}`)
      console.log(`   - Actif: ${user.is_active}`)
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await pool.end()
  }
}

// Exécuter le script
checkUserExists()
