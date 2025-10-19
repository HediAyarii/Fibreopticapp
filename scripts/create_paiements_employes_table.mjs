import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024',
  ssl: false,
  max: 50,
  min: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
  acquireTimeoutMillis: 10000,
  allowExitOnIdle: true,
});

async function createPaiementsEmployesTable() {
  console.log('🔧 Création de la table paiements_employes...');
  
  try {
    // Vérifier si la table existe déjà
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'paiements_employes'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('✅ Table paiements_employes existe déjà');
      return;
    }
    
    // Créer la table
    await pool.query(`
      CREATE TABLE paiements_employes (
        id SERIAL PRIMARY KEY,
        cout_par_salaire_id INTEGER NOT NULL,
        employe_id INTEGER NOT NULL,
        montant_verse DECIMAL(10,2) NOT NULL,
        date_paiement DATE NOT NULL,
        methode_paiement VARCHAR(50) DEFAULT 'virement',
        reference_paiement VARCHAR(255),
        commentaires TEXT,
        statut VARCHAR(20) DEFAULT 'confirme',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Contraintes
        CONSTRAINT fk_paiements_cout_par_salaire 
          FOREIGN KEY (cout_par_salaire_id) 
          REFERENCES cout_par_salaire(id) 
          ON DELETE CASCADE,
          
        CONSTRAINT fk_paiements_employe 
          FOREIGN KEY (employe_id) 
          REFERENCES employes(id) 
          ON DELETE CASCADE,
          
        CONSTRAINT chk_montant_verse_positive 
          CHECK (montant_verse > 0),
          
        CONSTRAINT chk_statut_valide 
          CHECK (statut IN ('confirme', 'annule', 'en_attente'))
      );
    `);
    
    console.log('✅ Table paiements_employes créée avec succès');
    
    // Créer les index pour optimiser les performances
    await pool.query(`
      CREATE INDEX idx_paiements_employe_id ON paiements_employes(employe_id);
    `);
    
    await pool.query(`
      CREATE INDEX idx_paiements_cout_id ON paiements_employes(cout_par_salaire_id);
    `);
    
    await pool.query(`
      CREATE INDEX idx_paiements_date ON paiements_employes(date_paiement);
    `);
    
    await pool.query(`
      CREATE INDEX idx_paiements_statut ON paiements_employes(statut);
    `);
    
    console.log('✅ Index créés avec succès');
    
    // Créer un trigger pour mettre à jour updated_at
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_paiements_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    await pool.query(`
      CREATE TRIGGER trigger_update_paiements_updated_at
        BEFORE UPDATE ON paiements_employes
        FOR EACH ROW
        EXECUTE FUNCTION update_paiements_updated_at();
    `);
    
    console.log('✅ Trigger de mise à jour créé');
    
    console.log('\n🎯 Table paiements_employes créée avec succès !');
    console.log('✅ Contraintes de clés étrangères ajoutées');
    console.log('✅ Index de performance créés');
    console.log('✅ Trigger de mise à jour automatique ajouté');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de la table:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

createPaiementsEmployesTable().catch(console.error);