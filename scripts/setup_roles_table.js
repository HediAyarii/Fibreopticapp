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

async function setupRolesTable() {
  console.log('🔧 Configuration de la table roles...')
  
  try {
    // Vérifier si la table roles existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'roles'
      );
    `)
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Table roles n\'existe pas, création en cours...')
      
      // Créer la table roles
      await pool.query(`
        CREATE TABLE roles (
          id SERIAL PRIMARY KEY,
          name VARCHAR(50) UNIQUE NOT NULL,
          description TEXT,
          permissions JSONB DEFAULT '{"sections": []}'::jsonb,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `)
      
      console.log('✅ Table roles créée')
      
      // Insérer les rôles par défaut
      await pool.query(`
        INSERT INTO roles (name, description, permissions) VALUES
        ('admin', 'Administrateur avec accès total', '{"sections": ["dashboard", "employees", "interventions", "materials", "fuel", "fuel-consumption", "penalties", "statistics", "costs", "cout-par-salaire", "claims", "documents", "recap-calcul", "tarifs", "recette-generer", "technicien-accounts", "compte-admin"]}'::jsonb),
        ('employee', 'Employé avec permissions limitées', '{"sections": []}'::jsonb)
        ON CONFLICT (name) DO NOTHING;
      `)
      
      console.log('✅ Rôles par défaut créés')
    } else {
      console.log('✅ Table roles existe déjà')
    }
    
    // Vérifier les rôles existants
    const roles = await pool.query('SELECT * FROM roles ORDER BY id')
    console.log(`📋 ${roles.rows.length} rôles disponibles:`)
    roles.rows.forEach(role => {
      console.log(`   - ID ${role.id}: ${role.name} - ${role.description}`)
    })
    
    // Tester la requête users avec JOIN
    console.log('\n🔍 Test de la requête users avec JOIN...')
    const users = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.role_id,
        r.name as role_name,
        u.first_name,
        u.last_name,
        u.is_active,
        u.last_login,
        u.created_at,
        u.updated_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
    `)
    
    console.log(`✅ ${users.rows.length} utilisateurs trouvés:`)
    users.rows.forEach(user => {
      console.log(`   - ${user.username} (${user.email}) - ${user.role_name || 'Pas de rôle'} - ${user.is_active ? 'actif' : 'inactif'}`)
    })
    
    console.log('\n🎉 Configuration terminée !')
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Exécuter le script
setupRolesTable()
