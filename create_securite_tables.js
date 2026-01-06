const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://finalfibre_user:finalfibre_password_2024@localhost:5432/finalfibre_db'
})

async function migrate() {
  const client = await pool.connect()
  try {
    console.log('🚀 Création des tables pour les documents de sécurité...')

    // Table des catégories
    await client.query(`
      CREATE TABLE IF NOT EXISTS securite_categories (
        id SERIAL PRIMARY KEY,
        nom VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        ordre INT DEFAULT 0,
        actif BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Table securite_categories créée')

    // Table des documents
    await client.query(`
      CREATE TABLE IF NOT EXISTS securite_documents (
        id SERIAL PRIMARY KEY,
        categorie_id INT NOT NULL REFERENCES securite_categories(id) ON DELETE CASCADE,
        technicien_account_id INT REFERENCES technicien_accounts(id) ON DELETE CASCADE,
        nom VARCHAR(255) NOT NULL,
        description TEXT,
        fichier_url TEXT NOT NULL,
        fichier_nom VARCHAR(255) NOT NULL,
        fichier_type VARCHAR(50),
        fichier_taille INT,
        date_expiration DATE,
        est_global BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Table securite_documents créée')

    // Index
    await client.query(`CREATE INDEX IF NOT EXISTS idx_securite_documents_categorie ON securite_documents(categorie_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_securite_documents_technicien ON securite_documents(technicien_account_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_securite_documents_global ON securite_documents(est_global)`)
    console.log('✅ Index créés')

    // Catégories par défaut
    await client.query(`
      INSERT INTO securite_categories (nom, description, ordre) VALUES 
        ('Plan de Prévention', 'Documents relatifs aux plans de prévention', 1),
        ('Habilitation Électrique', 'Habilitations électriques des techniciens', 2),
        ('AIPR', 'Autorisation d''Intervention à Proximité des Réseaux', 3),
        ('CACES', 'Certificat d''Aptitude à la Conduite En Sécurité', 4)
      ON CONFLICT (nom) DO NOTHING
    `)
    console.log('✅ Catégories par défaut ajoutées')

    console.log('\n🎉 Migration terminée avec succès!')
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()
