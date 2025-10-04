import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function fixDetecterConflitsFunction() {
  console.log('🔧 Correction de la fonction detecter_conflits_assignation...')
  
  try {
    // Supprimer l'ancienne fonction
    console.log('📋 1. Suppression de l\'ancienne fonction...')
    await pool.query('DROP FUNCTION IF EXISTS detecter_conflits_assignation(INTEGER, VARCHAR, TIMESTAMP)')
    console.log('✅ Ancienne fonction supprimée')
    
    // Créer la nouvelle fonction avec une logique corrigée
    console.log('📋 2. Création de la nouvelle fonction...')
    const newFunctionSQL = `
      CREATE OR REPLACE FUNCTION detecter_conflits_assignation(
          p_employe_id INTEGER,
          p_carte_id VARCHAR(255),
          p_date_debut TIMESTAMP
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
              AND (
                  -- Vérifier les chevauchements de dates
                  (ca.date_fin IS NULL) -- Assignation active sans date de fin
                  OR
                  (ca.date_fin IS NOT NULL AND ca.date_fin >= p_date_debut) -- Chevauchement de dates
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
    
    await pool.query(newFunctionSQL)
    console.log('✅ Nouvelle fonction créée')
    
    // Tester la nouvelle fonction
    console.log('📋 3. Test de la nouvelle fonction...')
    
    const testResult = await pool.query(`
      SELECT * FROM detecter_conflits_assignation($1, $2, $3)
    `, [11, '13', '2024-01-01'])
    
    console.log(`📊 Résultat du test: ${testResult.rows.length} conflit(s)`)
    testResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. Conflit: ${row.conflit_existe}, Message: ${row.message_conflit}`)
      if (row.conflit_existe) {
        console.log(`      - ID: ${row.assignation_existante_id}`)
        console.log(`      - Employé: ${row.assignation_existante_employe_id}`)
        console.log(`      - Carte: ${row.assignation_existante_carte_id}`)
        console.log(`      - Période: ${row.assignation_existante_date_debut} → ${row.assignation_existante_date_fin}`)
      }
    })
    
    // Test avec une carte qui n'existe pas
    console.log('\n📋 4. Test avec une carte qui n\'existe pas...')
    const testResult2 = await pool.query(`
      SELECT * FROM detecter_conflits_assignation($1, $2, $3)
    `, [11, 'TEST_NEW_001', '2024-01-01'])
    
    console.log(`📊 Résultat du test 2: ${testResult2.rows.length} conflit(s)`)
    testResult2.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. Conflit: ${row.conflit_existe}, Message: ${row.message_conflit}`)
    })
    
    console.log('\n🎉 Fonction detecter_conflits_assignation corrigée !')
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error)
  } finally {
    await pool.end()
  }
}

fixDetecterConflitsFunction()
