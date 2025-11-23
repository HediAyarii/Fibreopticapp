const { Client } = require('pg')

async function createKmUpdatesTable() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'finalfibre_db',
    user: process.env.DB_USER || 'finalfibre_user',
    password: process.env.DB_PASSWORD || 'finalfibre_password_2024',
  })

  try {
    await client.connect()
    console.log('✅ Connexion à la base de données réussie')

    // Table vehicules_km_updates
    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicules_km_updates (
        id SERIAL PRIMARY KEY,
        vehicule_id INTEGER NOT NULL REFERENCES vehicules(id) ON DELETE CASCADE,
        assignation_id INTEGER NOT NULL REFERENCES assignations_vehicules(id) ON DELETE CASCADE,
        technicien_id INTEGER NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
        km_declare INTEGER NOT NULL,
        photo_compteur VARCHAR(500) NOT NULL,
        date_soumission TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        date_validation TIMESTAMP,
        validee_par_admin_id INTEGER REFERENCES users(id),
        statut VARCHAR(20) DEFAULT 'en_attente',
        commentaire_rejet TEXT,
        type_update VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Table vehicules_km_updates créée')

    // Ajouter colonnes à vehicules
    await client.query(`
      ALTER TABLE vehicules 
      ADD COLUMN IF NOT EXISTS km_actuel INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS derniere_maj_km DATE,
      ADD COLUMN IF NOT EXISTS prochaine_echeance_km DATE
    `).catch(err => {
      if (!err.message.includes('already exists')) throw err
      console.log('ℹ️  Colonnes vehicules déjà existantes')
    })
    console.log('✅ Colonnes ajoutées à vehicules')

    // Ajouter colonnes à assignations_vehicules
    await client.query(`
      ALTER TABLE assignations_vehicules 
      ADD COLUMN IF NOT EXISTS km_debut INTEGER,
      ADD COLUMN IF NOT EXISTS km_actuel INTEGER,
      ADD COLUMN IF NOT EXISTS km_fin INTEGER,
      ADD COLUMN IF NOT EXISTS statut_km VARCHAR(20) DEFAULT 'initial_attente',
      ADD COLUMN IF NOT EXISTS date_derniere_maj DATE
    `).catch(err => {
      if (!err.message.includes('already exists')) throw err
      console.log('ℹ️  Colonnes assignations_vehicules déjà existantes')
    })
    console.log('✅ Colonnes ajoutées à assignations_vehicules')

    // Index pour optimiser les performances
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_km_updates_vehicule ON vehicules_km_updates(vehicule_id);
      CREATE INDEX IF NOT EXISTS idx_km_updates_technicien ON vehicules_km_updates(technicien_id);
      CREATE INDEX IF NOT EXISTS idx_km_updates_statut ON vehicules_km_updates(statut);
      CREATE INDEX IF NOT EXISTS idx_km_updates_assignation ON vehicules_km_updates(assignation_id);
      CREATE INDEX IF NOT EXISTS idx_assignations_statut_km ON assignations_vehicules(statut_km);
    `)
    console.log('✅ Index créés')

    console.log('🎉 Configuration de la base de données terminée avec succès!')

  } catch (error) {
    console.error('❌ Erreur:', error)
    throw error
  } finally {
    await client.end()
  }
}

createKmUpdatesTable()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
