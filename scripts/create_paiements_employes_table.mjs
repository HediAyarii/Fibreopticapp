import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function createPaiementsEmployesTable() {
  console.log('🔧 Création de la table paiements_employes...')
  
  try {
    // 1. Créer la table paiements_employes
    console.log('📋 Création de la table paiements_employes...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS paiements_employes (
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
        
        CONSTRAINT chk_date_paiement_future 
          CHECK (date_paiement <= CURRENT_DATE)
      )
    `)
    console.log('✅ Table paiements_employes créée')
    
    // 2. Créer les index pour optimiser les requêtes
    console.log('📋 Création des index...')
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_paiements_employe_id 
        ON paiements_employes(employe_id)
    `)
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_paiements_cout_par_salaire_id 
        ON paiements_employes(cout_par_salaire_id)
    `)
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_paiements_date 
        ON paiements_employes(date_paiement)
    `)
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_paiements_employe_date 
        ON paiements_employes(employe_id, date_paiement)
    `)
    
    console.log('✅ Index créés')
    
    // 3. Créer une fonction pour calculer le total des paiements
    console.log('📋 Création de la fonction de calcul des paiements...')
    await pool.query(`
      CREATE OR REPLACE FUNCTION calculer_total_paiements(
        p_cout_par_salaire_id INTEGER
      ) RETURNS DECIMAL(10,2) AS $$
      BEGIN
        RETURN COALESCE(
          (SELECT SUM(montant_verse) 
           FROM paiements_employes 
           WHERE cout_par_salaire_id = p_cout_par_salaire_id 
             AND statut = 'confirme'
          ), 0
        );
      END;
      $$ LANGUAGE plpgsql;
    `)
    console.log('✅ Fonction calculer_total_paiements créée')
    
    // 4. Créer une fonction pour calculer le RAP mis à jour
    console.log('📋 Création de la fonction de calcul du RAP...')
    await pool.query(`
      CREATE OR REPLACE FUNCTION calculer_rap_avec_paiements(
        p_cout_par_salaire_id INTEGER
      ) RETURNS DECIMAL(10,2) AS $$
      DECLARE
        v_total_genere DECIMAL(10,2);
        v_salaire_net DECIMAL(10,2);
        v_charge DECIMAL(10,2);
        v_cout_total DECIMAL(10,2);
        v_taxe DECIMAL(5,2);
        v_total_paiements DECIMAL(10,2);
        v_rap DECIMAL(10,2);
      BEGIN
        -- Récupérer les données du cout_par_salaire
        SELECT 
          COALESCE(total_genere, 0),
          COALESCE(salaire_net, 0),
          COALESCE(charge, 0),
          COALESCE(cout_total, 0),
          COALESCE(taxe, 0)
        INTO v_total_genere, v_salaire_net, v_charge, v_cout_total, v_taxe
        FROM cout_par_salaire 
        WHERE id = p_cout_par_salaire_id;
        
        -- Calculer le total des paiements
        v_total_paiements := calculer_total_paiements(p_cout_par_salaire_id);
        
        -- Calculer le RAP selon la logique des taxes
        IF ABS(v_taxe - 100) < 0.01 THEN
          -- Si taxe = 100% : RAP = Total Généré - Salaire Net - Paiements
          v_rap := v_total_genere - v_salaire_net - v_total_paiements;
        ELSIF ABS(v_taxe - 50) < 0.01 THEN
          -- Si taxe = 50% : RAP = Total Généré - Salaire Net + Charge - Paiements
          v_rap := v_total_genere - v_salaire_net + v_charge - v_total_paiements;
        ELSIF ABS(v_taxe) < 0.01 THEN
          -- Si taxe = 0% : RAP = Total Généré - Coût Total - Paiements
          v_rap := v_total_genere - v_cout_total - v_total_paiements;
        ELSE
          -- Pourcentage de taxe personnalisé : utiliser la logique 0%
          v_rap := v_total_genere - v_cout_total - v_total_paiements;
        END IF;
        
        RETURN v_rap;
      END;
      $$ LANGUAGE plpgsql;
    `)
    console.log('✅ Fonction calculer_rap_avec_paiements créée')
    
    // 5. Créer un trigger pour mettre à jour automatiquement le RAP
    console.log('📋 Création du trigger de mise à jour automatique...')
    await pool.query(`
      CREATE OR REPLACE FUNCTION trigger_update_rap_after_payment()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Mettre à jour le RAP dans cout_par_salaire après un paiement
        UPDATE cout_par_salaire 
        SET 
          rap = calculer_rap_avec_paiements(COALESCE(NEW.cout_par_salaire_id, OLD.cout_par_salaire_id)),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = COALESCE(NEW.cout_par_salaire_id, OLD.cout_par_salaire_id);
        
        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
    `)
    
    await pool.query(`
      CREATE TRIGGER trigger_paiements_update_rap
        AFTER INSERT OR UPDATE OR DELETE ON paiements_employes
        FOR EACH ROW
        EXECUTE FUNCTION trigger_update_rap_after_payment();
    `)
    console.log('✅ Trigger de mise à jour automatique créé')
    
    // 6. Insérer des données de test (optionnel)
    console.log('📋 Insertion de données de test...')
    try {
      // Vérifier s'il y a des données dans cout_par_salaire
      const coutResult = await pool.query(`
        SELECT id, nom, prenom, employe_id 
        FROM cout_par_salaire 
        LIMIT 3
      `)
      
      if (coutResult.rows.length > 0) {
        console.log(`✅ ${coutResult.rows.length} enregistrements cout_par_salaire trouvés`)
        console.log('📊 Données de test disponibles pour les paiements')
      } else {
        console.log('⚠️ Aucune donnée cout_par_salaire trouvée pour les tests')
      }
    } catch (testError) {
      console.log('⚠️ Erreur lors de la vérification des données de test:', testError.message)
    }
    
    console.log('\n🎯 Table paiements_employes créée avec succès !')
    console.log('📋 Fonctionnalités disponibles :')
    console.log('   - Gestion des paiements par employé')
    console.log('   - Calcul automatique du RAP')
    console.log('   - Historique des paiements')
    console.log('   - Relations avec cout_par_salaire et employes')
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de la table:', error.message)
  } finally {
    await pool.end()
  }
}

createPaiementsEmployesTable()





