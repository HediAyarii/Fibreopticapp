const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024'
})

async function addReclamationsTechniquesPermission() {
  console.log('🔧 Ajout de la permission "réclamations-techniques"...\n')
  
  try {
    // 1. Mettre à jour la fonction get_available_sections
    console.log('1. Mise à jour de la fonction get_available_sections...')
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
        SELECT 'reclamations-techniques'::VARCHAR(50), 'Réclamations Techniques'::VARCHAR(100)
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
    console.log('   ✅ Fonction get_available_sections mise à jour')

    // 2. Mettre à jour le rôle admin dans la table roles
    console.log('\n2. Mise à jour des permissions du rôle admin...')
    const updateRoles = await pool.query(`
      UPDATE roles 
      SET permissions = '{"sections": ["dashboard", "employees", "interventions", "materials", "fuel", "fuel-consumption", "penalties", "statistics", "costs", "cout-par-salaire", "claims", "reclamations-techniques", "documents", "recap-calcul", "tarifs", "recette-generer", "technicien-accounts", "compte-admin"]}'::jsonb
      WHERE name = 'admin'
      RETURNING id, name
    `)
    
    if (updateRoles.rowCount > 0) {
      console.log('   ✅ Rôle admin mis à jour')
    } else {
      console.log('   ⚠️  Rôle admin non trouvé dans la table roles')
    }

    // 3. Mettre à jour les utilisateurs admin existants
    console.log('\n3. Mise à jour des utilisateurs admin existants...')
    const updateUsers = await pool.query(`
      UPDATE users 
      SET permissions = jsonb_set(
        permissions, 
        '{sections}', 
        '["dashboard", "employees", "interventions", "materials", "fuel", "fuel-consumption", "penalties", "statistics", "costs", "cout-par-salaire", "claims", "reclamations-techniques", "documents", "recap-calcul", "tarifs", "recette-generer", "technicien-accounts", "compte-admin"]'::jsonb
      )
      WHERE role_id = 1
      RETURNING id, username
    `)
    
    if (updateUsers.rowCount > 0) {
      console.log(`   ✅ ${updateUsers.rowCount} utilisateur(s) admin mis à jour`)
      updateUsers.rows.forEach(user => {
        console.log(`      - ${user.username} (ID: ${user.id})`)
      })
    } else {
      console.log('   ℹ️  Aucun utilisateur admin à mettre à jour')
    }

    // 4. Vérifier les sections disponibles
    console.log('\n4. Vérification des sections disponibles...')
    const sections = await pool.query('SELECT * FROM get_available_sections()')
    console.log(`   ✅ ${sections.rows.length} sections disponibles:`)
    sections.rows.forEach(section => {
      const marker = section.section_key === 'reclamations-techniques' ? '👉' : '   '
      console.log(`   ${marker} ${section.section_key}: ${section.section_name}`)
    })

    console.log('\n✅ Permission "réclamations-techniques" ajoutée avec succès!')
    console.log('\n📝 Prochaines étapes:')
    console.log('   1. Redémarrez votre serveur Next.js')
    console.log('   2. Allez dans "Compte Admin" pour créer/modifier des utilisateurs')
    console.log('   3. La checkbox "Réclamations Techniques" sera disponible')

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Exécuter le script
addReclamationsTechniquesPermission()