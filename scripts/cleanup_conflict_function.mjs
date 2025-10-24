import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function cleanupConflictFunction() {
  try {
    console.log('🧹 Nettoyage des fonctions detecter_conflits_assignation...')
    
    // 1. Supprimer toutes les versions existantes
    console.log('📋 1. Suppression de toutes les versions existantes...')
    await pool.query('DROP FUNCTION IF EXISTS detecter_conflits_assignation(INTEGER, VARCHAR(255), TIMESTAMP) CASCADE')
    await pool.query('DROP FUNCTION IF EXISTS detecter_conflits_assignation(INTEGER, VARCHAR(255), TIMESTAMP, TIMESTAMP) CASCADE')
    console.log('✅ Anciennes versions supprimées')
    
    // 2. Créer une seule version propre
    console.log('📋 2. Création de la version finale...')
    const functionSQL = `
      CREATE OR REPLACE FUNCTION detecter_conflits_assignation(
          p_employe_id INTEGER,
          p_carte_id VARCHAR(255),
          p_date_debut TIMESTAMP,
          p_date_fin TIMESTAMP DEFAULT NULL
      ) RETURNS TABLE(
          conflit_existe BOOLEAN,
          message_conflit TEXT,
          assignation_existante_id INTEGER,
          assignation_existante_employe_id INTEGER,
          assignation_existante_carte_id VARCHAR(255),
          assignation_existante_date_debut TIMESTAMP,
          assignation_existante_date_fin TIMESTAMP
      ) AS $$
      BEGIN
          -- Vérifier s'il y a des conflits d'assignation
          RETURN QUERY
          SELECT 
              CASE 
                  WHEN ca.id IS NOT NULL THEN TRUE
                  ELSE FALSE
              END as conflit_existe,
              CASE 
                  WHEN ca.id IS NOT NULL THEN 
                      CASE 
                          WHEN ca.carte_id = p_carte_id THEN
                              'Conflit détecté: La carte ' || ca.carte_id || ' est déjà assignée à l''employé ' || 
                              COALESCE(e.nom || ' ' || e.prenom, 'ID:' || ca.employe_id) || 
                              ' du ' || ca.date_assignation::DATE || ' au ' || COALESCE(ca.date_fin::DATE::TEXT, 'actuellement')
                          ELSE
                              'Conflit détecté: L''employé ' || COALESCE(e.nom || ' ' || e.prenom, 'ID:' || ca.employe_id) || 
                              ' a déjà la carte ' || ca.carte_id || ' assignée du ' || ca.date_assignation::DATE || ' au ' || COALESCE(ca.date_fin::DATE::TEXT, 'actuellement')
                      END
                  ELSE 'Aucun conflit détecté'
              END as message_conflit,
              ca.id as assignation_existante_id,
              ca.employe_id as assignation_existante_employe_id,
              ca.carte_id as assignation_existante_carte_id,
              ca.date_assignation as assignation_existante_date_debut,
              ca.date_fin as assignation_existante_date_fin
          FROM carburant_assignations ca
          LEFT JOIN employes e ON e.id = ca.employe_id
          WHERE ca.statut = 'active'
              AND (
                  -- Conflit 1: La carte est déjà assignée à un autre employé
                  (ca.carte_id = p_carte_id AND ca.employe_id != p_employe_id)
                  OR
                  -- Conflit 2: L'employé a déjà une carte assignée (différente)
                  (ca.employe_id = p_employe_id AND ca.carte_id != p_carte_id)
              )
              -- Logique de chevauchement des dates
              AND (
                  -- Cas 1: Assignation existante sans date de fin (permanente)
                  (ca.date_fin IS NULL)
                  OR
                  -- Cas 2: Assignation existante avec date de fin
                  (ca.date_fin IS NOT NULL AND (
                      -- Nouvelle assignation sans date de fin (permanente)
                      (p_date_fin IS NULL)
                      OR
                      -- Nouvelle assignation avec date de fin - vérifier le chevauchement
                      (p_date_fin IS NOT NULL AND ca.date_fin >= p_date_debut AND ca.date_assignation <= p_date_fin)
                  ))
              )
              -- Vérifier que l'assignation existante n'est pas expirée
              AND (
                  ca.date_fin IS NULL 
                  OR ca.date_fin >= CURRENT_DATE
              )
              -- Vérifier que la nouvelle assignation n'est pas déjà terminée
              AND (
                  p_date_fin IS NULL 
                  OR p_date_fin >= CURRENT_DATE
              )
          LIMIT 1;
          
          -- Si aucun conflit trouvé, retourner un résultat par défaut
          IF NOT FOUND THEN
              RETURN QUERY SELECT 
                  FALSE as conflit_existe,
                  'Aucun conflit détecté' as message_conflit,
                  NULL::INTEGER as assignation_existante_id,
                  NULL::INTEGER as assignation_existante_employe_id,
                  NULL::VARCHAR(255) as assignation_existante_carte_id,
                  NULL::TIMESTAMP as assignation_existante_date_debut,
                  NULL::TIMESTAMP as assignation_existante_date_fin;
          END IF;
      END;
      $$ LANGUAGE plpgsql;
    `
    
    await pool.query(functionSQL)
    console.log('✅ Fonction detecter_conflits_assignation créée avec succès')
    
    // 3. Tester la fonction
    console.log('📋 3. Test de la fonction...')
    
    // Test avec 3 paramètres (ancienne signature)
    const testResult1 = await pool.query(`
      SELECT * FROM detecter_conflits_assignation(
        1::INTEGER, 
        '34'::VARCHAR(255), 
        '2025-05-08'::TIMESTAMP
      )
    `)
    
    console.log('📊 Test avec 3 paramètres:')
    console.log(`   - Conflit détecté: ${testResult1.rows[0]?.conflit_existe || false}`)
    console.log(`   - Message: ${testResult1.rows[0]?.message_conflit || 'N/A'}`)
    
    // Test avec 4 paramètres (nouvelle signature)
    const testResult2 = await pool.query(`
      SELECT * FROM detecter_conflits_assignation(
        1::INTEGER, 
        '34'::VARCHAR(255), 
        '2025-05-08'::TIMESTAMP,
        '2025-05-18'::TIMESTAMP
      )
    `)
    
    console.log('📊 Test avec 4 paramètres:')
    console.log(`   - Conflit détecté: ${testResult2.rows[0]?.conflit_existe || false}`)
    console.log(`   - Message: ${testResult2.rows[0]?.message_conflit || 'N/A'}`)
    
    console.log('✅ Nettoyage terminé avec succès!')
    console.log('')
    console.log('🎯 Résumé:')
    console.log('   - Anciennes versions supprimées')
    console.log('   - Nouvelle version unique créée')
    console.log('   - Compatible avec les deux signatures (3 et 4 paramètres)')
    console.log('   - Gestion des assignations historiques')
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Exécuter le nettoyage
cleanupConflictFunction()
  .then(() => {
    console.log('🎉 Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error)
    process.exit(1)
  })





