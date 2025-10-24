// Script pour créer la table cout_par_salaire
import { Pool } from 'pg'

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024'
})

async function createCoutParSalaireTable() {
  try {
    console.log('🚀 Création de la table cout_par_salaire...')
    
    // Créer la table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cout_par_salaire (
        id SERIAL PRIMARY KEY,
        nom TEXT NOT NULL,
        prenom TEXT NOT NULL,
        salaire_net DECIMAL(10,2) NOT NULL DEFAULT 0,
        salaire_brut DECIMAL(10,2) NOT NULL DEFAULT 0,
        cout_total DECIMAL(10,2) NOT NULL DEFAULT 0,
        charge DECIMAL(10,2) NOT NULL DEFAULT 0,
        mois INTEGER NOT NULL,
        annee INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Créer les index
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_cout_par_salaire_mois_annee ON cout_par_salaire(mois, annee)
    `)
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_cout_par_salaire_nom_prenom ON cout_par_salaire(nom, prenom)
    `)
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_cout_par_salaire_date ON cout_par_salaire(annee, mois)
    `)
    
    // Créer le trigger pour updated_at
    await pool.query(`
      CREATE TRIGGER update_cout_par_salaire_updated_at
        BEFORE UPDATE ON cout_par_salaire
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `)
    
    console.log('✅ Table cout_par_salaire créée avec succès!')
    console.log('   - Structure de table créée')
    console.log('   - Index de performance ajoutés')
    console.log('   - Trigger de mise à jour configuré')
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await pool.end()
  }
}

createCoutParSalaireTable()









