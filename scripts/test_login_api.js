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

async function testLoginApi() {
  console.log('🔍 Test de l\'API de connexion...')
  
  try {
    const email = 'admin@dgflow.com'
    const password = 'admin@dgflow.com'
    
    // Rechercher l'utilisateur
    const result = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.password_hash,
        u.role_id,
        u.first_name,
        u.last_name,
        u.is_active,
        r.name as role_name,
        r.permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = $1 AND u.is_active = true
    `, [email])
    
    if (result.rows.length === 0) {
      console.log('❌ Utilisateur non trouvé ou inactif')
      return
    }
    
    const user = result.rows[0]
    console.log('✅ Utilisateur trouvé:', user.username)
    console.log('🔍 Hash du mot de passe:', user.password_hash.substring(0, 20) + '...')
    
    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    console.log('🔍 Mot de passe valide:', isValidPassword)
    
    if (isValidPassword) {
      console.log('✅ Connexion réussie !')
      console.log('📋 Données utilisateur:')
      console.log(`   - ID: ${user.id}`)
      console.log(`   - Username: ${user.username}`)
      console.log(`   - Email: ${user.email}`)
      console.log(`   - Rôle: ${user.role_name} (ID: ${user.role_id})`)
      console.log(`   - Permissions: ${JSON.stringify(user.permissions)}`)
    } else {
      console.log('❌ Mot de passe incorrect')
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await pool.end()
  }
}

// Exécuter le test
testLoginApi()
