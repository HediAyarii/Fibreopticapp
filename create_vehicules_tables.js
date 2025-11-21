const { Client } = require('pg')

async function createVehiculesTables() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'finalfibre_db',
    user: 'finalfibre_user',
    password: 'finalfibre_password_2024',
  })

  try {
    await client.connect()
    console.log('✅ Connexion à la base de données réussie')

    // Supprimer les tables existantes pour recréer avec la bonne structure
    console.log('⚠️ Suppression des anciennes tables...')
    await client.query('DROP TABLE IF EXISTS entretiens_vehicules CASCADE')
    await client.query('DROP TABLE IF EXISTS assignations_vehicules CASCADE')
    await client.query('DROP TABLE IF EXISTS vehicules CASCADE')
    console.log('✅ Anciennes tables supprimées')

    // Création de la table vehicules
    await client.query(`
      CREATE TABLE vehicules (
        id SERIAL PRIMARY KEY,
        matricule VARCHAR(20) UNIQUE NOT NULL,
        marque VARCHAR(100) NOT NULL,
        modele VARCHAR(100) NOT NULL,
        annee INTEGER,
        couleur VARCHAR(50),
        type_vehicule VARCHAR(50) DEFAULT 'utilitaire',
        numero_chassis VARCHAR(100),
        carburant VARCHAR(20) DEFAULT 'diesel',
        puissance_fiscale INTEGER,
        kilometrage INTEGER DEFAULT 0,
        statut VARCHAR(20) DEFAULT 'disponible',
        assurance_expiration DATE,
        visite_technique_expiration DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Table vehicules créée')

    // Création de la table assignations_vehicules
    await client.query(`
      CREATE TABLE assignations_vehicules (
        id SERIAL PRIMARY KEY,
        vehicule_id INTEGER REFERENCES vehicules(id) ON DELETE CASCADE,
        employe_id INTEGER REFERENCES employes(id) ON DELETE CASCADE,
        date_assignation DATE NOT NULL,
        date_fin DATE,
        kilometrage_debut INTEGER,
        kilometrage_fin INTEGER,
        statut VARCHAR(20) DEFAULT 'active',
        commentaires TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Table assignations_vehicules créée')

    // Création de la table entretiens_vehicules
    await client.query(`
      CREATE TABLE entretiens_vehicules (
        id SERIAL PRIMARY KEY,
        vehicule_id INTEGER REFERENCES vehicules(id) ON DELETE CASCADE,
        categorie_entretien VARCHAR(100) NOT NULL,
        date_entretien DATE NOT NULL,
        cout_entretien DECIMAL(10, 2) NOT NULL,
        kilometrage_entretien INTEGER,
        garage VARCHAR(200),
        facture_numero VARCHAR(100),
        description TEXT,
        prochain_entretien_km INTEGER,
        prochain_entretien_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Table entretiens_vehicules créée')

    // Création des index
    await client.query('CREATE INDEX idx_vehicules_statut ON vehicules(statut)')
    await client.query('CREATE INDEX idx_vehicules_matricule ON vehicules(matricule)')
    await client.query('CREATE INDEX idx_assignations_vehicules_vehicule_id ON assignations_vehicules(vehicule_id)')
    await client.query('CREATE INDEX idx_assignations_vehicules_employe_id ON assignations_vehicules(employe_id)')
    await client.query('CREATE INDEX idx_assignations_vehicules_statut ON assignations_vehicules(statut)')
    await client.query('CREATE INDEX idx_entretiens_vehicules_vehicule_id ON entretiens_vehicules(vehicule_id)')
    await client.query('CREATE INDEX idx_entretiens_vehicules_date ON entretiens_vehicules(date_entretien)')
    console.log('✅ Index créés')

    console.log('\n🎉 Toutes les tables pour la gestion des véhicules ont été créées avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des tables:', error)
  } finally {
    await client.end()
    console.log('✅ Déconnexion de la base de données')
  }
}

createVehiculesTables()
