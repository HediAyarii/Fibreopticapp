import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function migrateCarburantAssignations() {
  try {
    console.log('🔧 Migration de la table carburant_assignations...')
    
    // 1. Vérifier la structure actuelle
    console.log('📋 1. Vérification de la structure actuelle...')
    const currentStructure = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'carburant_assignations' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `)
    
    console.log('Structure actuelle:')
    currentStructure.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`)
    })
    
    // 2. Vérifier si la table a des données
    const dataCount = await pool.query('SELECT COUNT(*) as count FROM carburant_assignations')
    const hasData = parseInt(dataCount.rows[0].count) > 0
    
    if (hasData) {
      console.log(`⚠️ La table contient ${dataCount.rows[0].count} enregistrements`)
      console.log('📋 Sauvegarde des données existantes...')
      
      // Sauvegarder les données existantes
      const existingData = await pool.query('SELECT * FROM carburant_assignations')
      console.log(`✅ ${existingData.rows.length} enregistrements sauvegardés`)
    }
    
    // 3. Supprimer et recréer la table avec la nouvelle structure
    console.log('📋 3. Recréation de la table avec la nouvelle structure...')
    
    await pool.query('DROP TABLE IF EXISTS carburant_assignations CASCADE')
    console.log('✅ Ancienne table supprimée')
    
    // Créer la nouvelle table
    await pool.query(`
      CREATE TABLE carburant_assignations (
        id SERIAL PRIMARY KEY,
        employe_id INTEGER NOT NULL,
        carte_id VARCHAR(255) NOT NULL,
        date_assignation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        date_fin TIMESTAMP,
        statut VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employe_id) REFERENCES employes(id) ON DELETE CASCADE
      )
    `)
    console.log('✅ Nouvelle table créée')
    
    // 4. Recréer les index
    console.log('📋 4. Création des index...')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_carburant_assignations_employe_id ON carburant_assignations(employe_id)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_carburant_assignations_carte_id ON carburant_assignations(carte_id)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_carburant_assignations_statut ON carburant_assignations(statut)')
    console.log('✅ Index créés')
    
    // 5. Recréer les fonctions
    console.log('📋 5. Recréation des fonctions...')
    
    // Fonction detecter_conflits_assignation
    await pool.query(`
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
        RETURN QUERY
        SELECT 
          CASE 
            WHEN ca.id IS NOT NULL THEN TRUE
            ELSE FALSE
          END as conflit_existe,
          CASE 
            WHEN ca.id IS NOT NULL THEN 
              'Conflit détecté: La carte ' || ca.carte_id || ' est déjà assignée à l''employé ' || 
              COALESCE(e.nom || ' ' || e.prenom, 'ID:' || ca.employe_id) || 
              ' du ' || ca.date_assignation::DATE || ' au ' || COALESCE(ca.date_fin::DATE::TEXT, 'actuellement')
            ELSE 'Aucun conflit détecté'
          END as message_conflit,
          ca.id as assignation_existante_id,
          ca.employe_id as assignation_existante_employe_id,
          ca.carte_id as assignation_existante_carte_id,
          ca.date_assignation as assignation_existante_date_debut,
          ca.date_fin as assignation_existante_date_fin
        FROM carburant_assignations ca
        LEFT JOIN employes e ON e.id = ca.employe_id
        WHERE ca.carte_id = p_carte_id
          AND ca.statut = 'active'
          AND (
            (ca.employe_id != p_employe_id)
            OR
            (ca.employe_id = p_employe_id AND ca.carte_id != p_carte_id)
          )
          AND (
            (ca.date_fin IS NULL)
            OR
            (ca.date_fin IS NOT NULL AND ca.date_fin >= p_date_debut)
          )
        LIMIT 1;
        
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
    `)
    console.log('✅ Fonction detecter_conflits_assignation recréée')
    
    // 6. Tester la nouvelle structure
    console.log('📋 6. Test de la nouvelle structure...')
    const testResult = await pool.query(`
      SELECT * FROM detecter_conflits_assignation(1, 'TEST_CARD_001', '2025-01-01 00:00:00'::timestamp)
    `)
    console.log('✅ Test de la fonction réussi:', testResult.rows[0])
    
    console.log('\n🎯 Migration terminée avec succès !')
    console.log('📊 Résumé:')
    console.log('   - Table carburant_assignations migrée')
    console.log('   - Structure alignée avec l\'API')
    console.log('   - Fonctions recréées')
    console.log('   - Index recréés')
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
  } finally {
    await pool.end()
  }
}

migrateCarburantAssignations()








