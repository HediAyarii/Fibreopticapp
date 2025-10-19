import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function fixConflictDetectionFunction() {
  try {
    console.log('🔧 Correction de la fonction detecter_conflits_assignation...')
    
    // D'abord, libérer les assignations expirées
    console.log('📋 1. Libération des assignations expirées...')
    const expireQuery = `
      UPDATE carburant_assignations 
      SET statut = 'expired',
          updated_at = NOW()
      WHERE statut = 'active' 
        AND date_fin IS NOT NULL 
        AND date_fin < CURRENT_DATE
      RETURNING id, carte_id, employe_id, date_fin
    `
    
    const expiredResult = await pool.query(expireQuery)
    console.log(`✅ ${expiredResult.rows.length} assignation(s) expirée(s) libérée(s)`)
    
    // Maintenant, corriger la fonction
    console.log('📋 2. Correction de la fonction detecter_conflits_assignation...')
    const functionSQL = `
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
              -- CORRECTION : Vérifier que l'assignation n'est pas expirée
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
    console.log('✅ Fonction detecter_conflits_assignation corrigée')
    
    // Tester la fonction avec quelques exemples
    console.log('📋 3. Test de la fonction corrigée...')
    
    // Vérifier les assignations actuellement actives
    const activeAssignments = await pool.query(`
      SELECT ca.*, e.nom, e.prenom 
      FROM carburant_assignations ca
      LEFT JOIN employes e ON ca.employe_id = e.id
      WHERE ca.statut = 'active'
      ORDER BY ca.date_assignation DESC
    `)
    
    console.log(`📊 Assignations actives trouvées: ${activeAssignments.rows.length}`)
    activeAssignments.rows.forEach((assignment, index) => {
      console.log(`   ${index + 1}. Carte ${assignment.carte_id} - ${assignment.prenom} ${assignment.nom} (${assignment.date_assignation} → ${assignment.date_fin || 'permanent'})`)
    })
    
    // Vérifier les assignations expirées
    const expiredAssignments = await pool.query(`
      SELECT ca.*, e.nom, e.prenom 
      FROM carburant_assignations ca
      LEFT JOIN employes e ON ca.employe_id = e.id
      WHERE ca.statut = 'expired'
      ORDER BY ca.date_fin DESC
    `)
    
    console.log(`📊 Assignations expirées trouvées: ${expiredAssignments.rows.length}`)
    expiredAssignments.rows.forEach((assignment, index) => {
      console.log(`   ${index + 1}. Carte ${assignment.carte_id} - ${assignment.prenom} ${assignment.nom} (expirée le ${assignment.date_fin})`)
    })
    
    console.log('✅ Correction terminée avec succès!')
    console.log('')
    console.log('🎯 Résumé des corrections:')
    console.log('   - Assignations expirées libérées automatiquement')
    console.log('   - Fonction de détection de conflits corrigée')
    console.log('   - Les assignations expirées ne sont plus considérées comme des conflits')
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Exécuter la correction
fixConflictDetectionFunction()
  .then(() => {
    console.log('🎉 Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error)
    process.exit(1)
  })
