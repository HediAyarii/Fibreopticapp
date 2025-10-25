import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function fixDateOverlapLogic() {
  try {
    console.log('🔧 Correction de la logique de chevauchement des dates...')
    
    // D'abord, vérifier les assignations actuelles pour la carte 34
    console.log('📋 1. Vérification des assignations actuelles pour la carte 34...')
    const currentAssignments = await pool.query(`
      SELECT ca.*, e.nom, e.prenom 
      FROM carburant_assignations ca
      LEFT JOIN employes e ON ca.employe_id = e.id
      WHERE ca.carte_id = '34'
        AND ca.statut = 'active'
      ORDER BY ca.date_assignation DESC
    `)
    
    console.log(`📊 Assignations trouvées pour la carte 34: ${currentAssignments.rows.length}`)
    currentAssignments.rows.forEach((assignment, index) => {
      console.log(`   ${index + 1}. Employé: ${assignment.prenom} ${assignment.nom} (${assignment.employe_id})`)
      console.log(`      Période: ${assignment.date_assignation} → ${assignment.date_fin || 'permanent'}`)
    })
    
    // Maintenant, corriger la fonction avec la logique de chevauchement correcte
    console.log('📋 2. Correction de la fonction detecter_conflits_assignation...')
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
              -- CORRECTION : Logique de chevauchement des dates correcte
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
    console.log('✅ Fonction detecter_conflits_assignation corrigée avec la logique de chevauchement correcte')
    
    // Tester la fonction avec la carte 34 et la période problématique
    console.log('📋 3. Test de la fonction avec la carte 34...')
    
    // Simuler une assignation du 08/05/2025 au 18/05/2025
    const testResult = await pool.query(`
      SELECT * FROM detecter_conflits_assignation(
        1, -- employe_id
        '34', -- carte_id
        '2025-05-08'::TIMESTAMP, -- date_debut
        '2025-05-18'::TIMESTAMP  -- date_fin
      )
    `)
    
    console.log('📊 Résultat du test:')
    console.log(`   - Conflit détecté: ${testResult.rows[0]?.conflit_existe || false}`)
    console.log(`   - Message: ${testResult.rows[0]?.message_conflit || 'N/A'}`)
    if (testResult.rows[0]?.assignation_existante_id) {
      console.log(`   - Assignation en conflit: ID ${testResult.rows[0].assignation_existante_id}`)
      console.log(`   - Période: ${testResult.rows[0].assignation_existante_date_debut} → ${testResult.rows[0].assignation_existante_date_fin || 'permanent'}`)
    }
    
    console.log('✅ Correction terminée avec succès!')
    console.log('')
    console.log('🎯 Résumé des corrections:')
    console.log('   - Logique de chevauchement des dates corrigée')
    console.log('   - Prise en compte de la date de fin de la nouvelle assignation')
    console.log('   - Vérification correcte des périodes qui se chevauchent')
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Exécuter la correction
fixDateOverlapLogic()
  .then(() => {
    console.log('🎉 Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error)
    process.exit(1)
  })






