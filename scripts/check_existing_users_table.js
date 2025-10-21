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

async function checkExistingUsersTable() {
  console.log('🔍 Vérification de la table users existante...')
  
  try {
    // Vérifier la structure complète
    const columns = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `)
    
    console.log('📋 Structure de la table users:')
    columns.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default || 'none'})`)
    })
    
    // Vérifier les contraintes
    const constraints = await pool.query(`
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'users'
    `)
    
    console.log('\n🔒 Contraintes:')
    constraints.rows.forEach(constraint => {
      console.log(`   - ${constraint.constraint_name}: ${constraint.constraint_type} sur ${constraint.column_name}`)
    })
    
    // Vérifier les données existantes
    const data = await pool.query('SELECT * FROM users LIMIT 5')
    console.log(`\n📊 Données existantes (${data.rows.length} lignes):`)
    data.rows.forEach((row, index) => {
      console.log(`   Ligne ${index + 1}:`, row)
    })
    
    // Vérifier s'il y a une table role_id
    const roleTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'roles'
      );
    `)
    
    if (roleTable.rows[0].exists) {
      console.log('\n🔍 Table roles trouvée:')
      const roles = await pool.query('SELECT * FROM roles')
      roles.rows.forEach(role => {
        console.log(`   - ID ${role.id}: ${role.name || role.role_name || 'N/A'}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await pool.end()
  }
}

// Exécuter le script
checkExistingUsersTable()
