#!/usr/bin/env node

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Configuration de la base de données
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'finalfibre_db',
  user: process.env.DB_USER || 'finalfibre_user',
  password: process.env.DB_PASSWORD || 'finalfibre_password_2024',
})

async function installUserManagementSystem() {
  console.log('🚀 Installation du système de gestion des utilisateurs...')
  
  try {
    // Lire le fichier SQL
    const sqlPath = path.join(__dirname, 'create_users_table.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📋 Exécution du script SQL...')
    await pool.query(sqlContent)
    
    console.log('✅ Système de gestion des utilisateurs installé avec succès !')
    console.log('')
    console.log('📝 Prochaines étapes :')
    console.log('1. Redémarrez votre application')
    console.log('2. Connectez-vous avec le compte admin par défaut :')
    console.log('   - Nom d\'utilisateur: admin')
    console.log('   - Mot de passe: admin123')
    console.log('3. Accédez à la section "Compte Admin" pour créer de nouveaux utilisateurs')
    console.log('')
    console.log('🔐 Compte admin par défaut créé :')
    console.log('   - Username: admin')
    console.log('   - Email: admin@fibertech.com')
    console.log('   - Password: admin123')
    console.log('   - Rôle: admin (accès total)')
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'installation:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Exécuter l'installation
installUserManagementSystem()
