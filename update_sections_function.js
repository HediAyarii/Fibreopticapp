const { Client } = require('pg')

async function updateSectionsFunction() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'finalfibre_db',
    user: process.env.DB_USER || 'finalfibre_user',
    password: process.env.DB_PASSWORD || 'finalfibre_password_2024',
  })

  try {
    await client.connect()
    console.log('✅ Connexion à la base de données réussie')

    // Mettre à jour la fonction get_available_sections pour inclure vehicules et reclamations-techniques
    await client.query(`
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
        SELECT 'vehicules'::VARCHAR(50), 'Véhicules'::VARCHAR(100)
        UNION ALL
        SELECT 'reclamations-techniques'::VARCHAR(50), 'Réclamations Techniques'::VARCHAR(100)
        UNION ALL
        SELECT 'technicien-accounts'::VARCHAR(50), 'Comptes Techniciens'::VARCHAR(100)
        UNION ALL
        SELECT 'compte-admin'::VARCHAR(50), 'Compte Admin'::VARCHAR(100);
      END;
      $$ LANGUAGE plpgsql;
    `)
    console.log('✅ Fonction get_available_sections mise à jour')

    // Vérifier les sections disponibles
    const result = await client.query('SELECT * FROM get_available_sections() ORDER BY section_name')
    console.log('\n📋 Sections disponibles dans la base de données:')
    result.rows.forEach(row => {
      console.log(`   - ${row.section_key}: ${row.section_name}`)
    })
    console.log(`\n📊 Total: ${result.rows.length} sections`)

    console.log('\n🎉 Mise à jour terminée avec succès!')
    console.log('ℹ️  La section "Véhicules" est maintenant disponible pour attribution aux utilisateurs')

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error)
  } finally {
    await client.end()
  }
}

updateSectionsFunction()
