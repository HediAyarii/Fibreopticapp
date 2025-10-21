#!/usr/bin/env node

const { Pool } = require('pg')
const bcrypt = require('bcryptjs')

// Configuration de la base de données
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'finalfibre_db',
  user: process.env.DB_USER || 'finalfibre_user',
  password: process.env.DB_PASSWORD || 'finalfibre_password_2024',
})

async function createAdminUser() {
  console.log('🔧 Création d\'un utilisateur admin...')
  
  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@fibertech.com']
    )
    
    if (existingUser.rows.length > 0) {
      console.log('✅ Utilisateur admin@fibertech.com existe déjà')
      return
    }
    
    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash('admin123', 10)
    
    // Créer l'utilisateur admin
    const result = await pool.query(`
      INSERT INTO users (username, email, password_hash, role_id, first_name, last_name, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, username, email, role_id, first_name, last_name, is_active
    `, [
      'admin_fibertech',
      'admin@fibertech.com',
      passwordHash,
      1, // Admin role
      'Admin',
      'System',
      true
    ])
    
    console.log('✅ Utilisateur admin créé avec succès !')
    console.log('📋 Détails du compte :')
    console.log(`   - Email: admin@fibertech.com`)
    console.log(`   - Mot de passe: admin123`)
    console.log(`   - Rôle: admin (accès total)`)
    console.log(`   - ID: ${result.rows[0].id}`)
    
    // Lister tous les utilisateurs
    const allUsers = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.role_id,
        r.name as role_name,
        u.is_active
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
    `)
    
    console.log('\n📋 Tous les utilisateurs :')
    allUsers.rows.forEach(user => {
      console.log(`   - ${user.email} (${user.username}) - ${user.role_name} - ${user.is_active ? 'actif' : 'inactif'}`)
    })
    
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error.message)
  } finally {
    await pool.end()
  }
}

// Exécuter le script
createAdminUser()
