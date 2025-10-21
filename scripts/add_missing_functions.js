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

async function addMissingFunctions() {
  console.log('🔧 Ajout des fonctions manquantes...')
  
  try {
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
    
    // Tester la récupération des sections
    console.log('🔍 Test de la fonction get_available_sections...')
    const sectionsResult = await pool.query('SELECT * FROM get_available_sections()')
    console.log(`✅ ${sectionsResult.rows.length} sections disponibles`)
    
    // Vérifier si l'utilisateur admin existe
    const adminCheck = await pool.query('SELECT id, username FROM users WHERE username = $1', ['admin'])
    if (adminCheck.rows.length === 0) {
      console.log('🔧 Création de l\'utilisateur admin par défaut...')
      const bcrypt = require('bcryptjs')
      const adminPasswordHash = await bcrypt.hash('admin123', 10)
      
      await pool.query(`
        INSERT INTO users (username, email, password_hash, role, permissions, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
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
      
      console.log('✅ Utilisateur admin créé')
    } else {
      console.log('✅ Utilisateur admin existe déjà')
    }
    
    console.log('')
    console.log('🎉 Fonctions ajoutées avec succès !')
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
addMissingFunctions()
