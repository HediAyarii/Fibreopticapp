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

async function testUsersApi() {
  console.log('🔍 Test de l\'API users...')
  
  try {
    // Test 1: Vérifier la connexion
    console.log('1. Test de connexion...')
    await pool.query('SELECT 1')
    console.log('✅ Connexion OK')
    
    // Test 2: Vérifier si la table users existe
    console.log('2. Vérification de la table users...')
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `)
    console.log(`✅ Table users existe: ${tableCheck.rows[0].exists}`)
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Table users n\'existe pas, arrêt du test')
      return
    }
    
    // Test 3: Vérifier la structure de la table
    console.log('3. Vérification de la structure de la table...')
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `)
    console.log(`✅ ${columns.rows.length} colonnes trouvées:`)
    columns.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`)
    })
    
    // Test 4: Récupérer les utilisateurs
    console.log('4. Récupération des utilisateurs...')
    const users = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.role,
        u.permissions,
        u.is_active,
        u.created_at
      FROM users u
      ORDER BY u.created_at DESC
    `)
    console.log(`✅ ${users.rows.length} utilisateurs trouvés:`)
    users.rows.forEach(user => {
      console.log(`   - ${user.username} (${user.email}) - ${user.role} - ${user.is_active ? 'actif' : 'inactif'}`)
    })
    
    // Test 5: Test de la fonction get_available_sections
    console.log('5. Test de la fonction get_available_sections...')
    const sections = await pool.query('SELECT * FROM get_available_sections()')
    console.log(`✅ ${sections.rows.length} sections disponibles:`)
    sections.rows.forEach(section => {
      console.log(`   - ${section.section_key}: ${section.section_name}`)
    })
    
    console.log('')
    console.log('🎉 Tous les tests sont passés !')
    console.log('')
    console.log('📝 Prochaines étapes :')
    console.log('1. Redémarrez votre serveur Next.js')
    console.log('2. Testez l\'interface Compte Admin')
    console.log('3. Les checkboxes des permissions devraient maintenant s\'afficher')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Exécuter le test
testUsersApi()
