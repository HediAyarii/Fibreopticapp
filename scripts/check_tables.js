const { getPool } = require('../lib/database');

async function checkAndCreateTables() {
  const pool = getPool();
  
  try {
    console.log('🔍 Vérification et création des tables pour le matériel et les affectations...');
    
    // Vérifier et créer les colonnes manquantes dans la table materiel
    const materielColumns = [
      { name: 'quantite', type: 'INTEGER DEFAULT 1' },
      { name: 'prix_unitaire', type: 'DECIMAL(10,2) DEFAULT 0' },
      { name: 'type_materiel', type: 'TEXT' },
      { name: 'marque', type: 'TEXT' },
      { name: 'modele', type: 'TEXT' },
      { name: 'localisation', type: 'TEXT' },
      { name: 'statut', type: 'TEXT DEFAULT \'disponible\'' },
      { name: 'created_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
      { name: 'updated_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
    ];
    
    for (const column of materielColumns) {
      try {
        await pool.query(`
          DO $$ 
          BEGIN
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                             WHERE table_name = 'materiel' AND column_name = '${column.name}') THEN
                  ALTER TABLE materiel ADD COLUMN ${column.name} ${column.type};
                  RAISE NOTICE 'Colonne ${column.name} ajoutée à la table materiel';
              END IF;
          END $$;
        `);
        console.log(`✅ Colonne ${column.name} vérifiée/créée`);
      } catch (error) {
        console.log(`⚠️ Erreur pour la colonne ${column.name}:`, error.message);
      }
    }
    
    // Créer la table affectations_materiel
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS affectations_materiel (
            id SERIAL PRIMARY KEY,
            materiel_id INTEGER REFERENCES materiel(id) ON DELETE CASCADE,
            employe_id INTEGER REFERENCES employes(id) ON DELETE CASCADE,
            quantite_assignee INTEGER NOT NULL DEFAULT 1,
            date_affectation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            date_retour TIMESTAMP,
            statut TEXT DEFAULT 'active',
            commentaires TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ Table affectations_materiel créée/vérifiée');
    } catch (error) {
      console.log('⚠️ Erreur lors de la création de affectations_materiel:', error.message);
    }
    
    // Créer les index
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_affectations_materiel_id ON affectations_materiel(materiel_id);',
      'CREATE INDEX IF NOT EXISTS idx_affectations_employe_id ON affectations_materiel(employe_id);',
      'CREATE INDEX IF NOT EXISTS idx_affectations_statut ON affectations_materiel(statut);',
      'CREATE INDEX IF NOT EXISTS idx_affectations_date ON affectations_materiel(date_affectation);',
      'CREATE INDEX IF NOT EXISTS idx_materiel_quantite ON materiel(quantite);',
      'CREATE INDEX IF NOT EXISTS idx_materiel_statut ON materiel(statut);'
    ];
    
    for (const indexQuery of indexes) {
      try {
        await pool.query(indexQuery);
        console.log('✅ Index créé/vérifié');
      } catch (error) {
        console.log('⚠️ Erreur lors de la création de l\'index:', error.message);
      }
    }
    
    // Vérifier les tables existantes
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n📋 Tables disponibles:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    console.log('\n🎯 Tables vérifiées et créées avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

checkAndCreateTables();
