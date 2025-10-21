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

async function testAndCreateUsersTable() {
  console.log('🔍 Vérification de la table users...')
  
  try {
    // Vérifier si la table users existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `)
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Table users n\'existe pas, création en cours...')
      
      // Créer la table users
      await pool.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(20) DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
          permissions JSONB DEFAULT '{"sections": []}'::jsonb,
          employee_id INTEGER REFERENCES employes(id) ON DELETE SET NULL,
          created_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT true,
          last_login TIMESTAMP,
          login_attempts INTEGER DEFAULT 0,
          is_locked BOOLEAN DEFAULT false
        );
      `)
      
      console.log('✅ Table users créée')
      
      // Créer la table user_sessions
      await pool.query(`
        CREATE TABLE user_sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          session_token VARCHAR(255) NOT NULL UNIQUE,
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP NOT NULL,
          is_active BOOLEAN DEFAULT true
        );
      `)
      
      console.log('✅ Table user_sessions créée')
      
      // Créer les index
      await pool.query('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);')
      await pool.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);')
      await pool.query('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);')
      await pool.query('CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);')
      await pool.query('CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);')
      await pool.query('CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);')
      
      console.log('✅ Index créés')
      
      // Créer la fonction pour vérifier les permissions
      await pool.query(`
        CREATE OR REPLACE FUNCTION check_user_permission(
          p_user_id INTEGER,
          p_section VARCHAR(50)
        ) RETURNS BOOLEAN AS $$
        DECLARE
          user_role VARCHAR(20);
          user_permissions JSONB;
        BEGIN
          SELECT role, permissions INTO user_role, user_permissions
          FROM users 
          WHERE id = p_user_id AND is_active = true;
          
          IF NOT FOUND THEN
            RETURN false;
          END IF;
          
          IF user_role = 'admin' THEN
            RETURN true;
          END IF;
          
          IF user_role = 'employee' THEN
            RETURN (user_permissions->'sections') ? p_section;
          END IF;
          
          RETURN false;
        END;
        $$ LANGUAGE plpgsql;
      `)
      
      console.log('✅ Fonction check_user_permission créée')
      
      // Créer la fonction pour obtenir les sections disponibles
      await pool.query(`
        CREATE OR REPLACE FUNCTION get_available_sections() 
        RETURNS TABLE(section_key VARCHAR(50), section_name VARCHAR(100)) AS $$
        BEGIN
          RETURN QUERY
          SELECT 'dashboard'::VARCHAR(50) as section_key, 'Tableau de Bord'::VARCHAR(100) as section_name
          UNION ALL
          SELECT 'employees'::VARCHAR(50), 'Employés'::VARCHAR(100)
          UNION ALL
          SELECT 'interventions'::VARCHAR(50), 'Interventions'::VARCHAR(100)
          UNION ALL
          SELECT 'materials'::VARCHAR(50), 'Matériel'::VARCHAR(100)
          UNION ALL
          SELECT 'fuel'::VARCHAR(50), 'Carburant'::VARCHAR(100)
          UNION ALL
          SELECT 'fuel-consumption'::VARCHAR(50), 'Consommation Carburant'::VARCHAR(100)
          UNION ALL
          SELECT 'penalties'::VARCHAR(50), 'Pénalités'::VARCHAR(100)
          UNION ALL
          SELECT 'statistics'::VARCHAR(50), 'Statistiques'::VARCHAR(100)
          UNION ALL
          SELECT 'costs'::VARCHAR(50), 'Charges'::VARCHAR(100)
          UNION ALL
          SELECT 'cout-par-salaire'::VARCHAR(50), 'Charges par Salarié'::VARCHAR(100)
          UNION ALL
          SELECT 'claims'::VARCHAR(50), 'Réclamations'::VARCHAR(100)
          UNION ALL
          SELECT 'documents'::VARCHAR(50), 'Documents'::VARCHAR(100)
          UNION ALL
          SELECT 'recap-calcul'::VARCHAR(50), 'Récap Calcul'::VARCHAR(100)
          UNION ALL
          SELECT 'tarifs'::VARCHAR(50), 'Tarifs'::VARCHAR(100)
          UNION ALL
          SELECT 'recette-generer'::VARCHAR(50), 'BENEFICE BRUTE'::VARCHAR(100)
          UNION ALL
          SELECT 'technicien-accounts'::VARCHAR(50), 'Comptes Techniciens'::VARCHAR(100)
          UNION ALL
          SELECT 'compte-admin'::VARCHAR(50), 'Compte Admin'::VARCHAR(100);
        END;
        $$ LANGUAGE plpgsql;
      `)
      
      console.log('✅ Fonction get_available_sections créée')
      
      // Insérer un utilisateur admin par défaut
      const bcrypt = require('bcryptjs')
      const adminPasswordHash = await bcrypt.hash('admin123', 10)
      
      await pool.query(`
        INSERT INTO users (username, email, password_hash, role, permissions, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (username) DO NOTHING
      `, [
        'admin',
        'admin@fibertech.com',
        adminPasswordHash,
        'admin',
        JSON.stringify({
          sections: [
            'dashboard', 'employees', 'interventions', 'materials', 'fuel', 
            'fuel-consumption', 'penalties', 'statistics', 'costs', 
            'cout-par-salaire', 'claims', 'documents', 'recap-calcul', 
            'tarifs', 'recette-generer', 'technicien-accounts', 'compte-admin'
          ]
        }),
        true
      ])
      
      console.log('✅ Utilisateur admin par défaut créé')
      
    } else {
      console.log('✅ Table users existe déjà')
    }
    
    // Tester la récupération des sections
    console.log('🔍 Test de la fonction get_available_sections...')
    const sectionsResult = await pool.query('SELECT * FROM get_available_sections()')
    console.log(`✅ ${sectionsResult.rows.length} sections disponibles`)
    
    // Tester la récupération des utilisateurs
    console.log('🔍 Test de la récupération des utilisateurs...')
    const usersResult = await pool.query('SELECT id, username, email, role FROM users')
    console.log(`✅ ${usersResult.rows.length} utilisateurs trouvés`)
    
    console.log('')
    console.log('🎉 Système de gestion des utilisateurs prêt !')
    console.log('')
    console.log('📝 Compte admin par défaut :')
    console.log('   - Username: admin')
    console.log('   - Email: admin@fibertech.com')
    console.log('   - Password: admin123')
    console.log('   - Rôle: admin (accès total)')
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Exécuter le script
testAndCreateUsersTable()
