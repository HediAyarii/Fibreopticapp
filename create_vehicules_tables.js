const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

async function createVehiculesTables() {
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

    // Lire le fichier SQL depuis le dossier scripts
    const sqlFilePath = path.join(__dirname, 'scripts', 'create_vehicules_tables.sql')
    
    // Vérifier si le fichier SQL existe
    if (fs.existsSync(sqlFilePath)) {
      const sql = fs.readFileSync(sqlFilePath, 'utf8')
      await client.query(sql)
      console.log('✅ Script SQL exécuté depuis scripts/create_vehicules_tables.sql')
    } else {
      // Créer les tables directement si le fichier SQL n'existe pas
      console.log('⚠️ Fichier SQL non trouvé, création directe des tables...')
      
      // Table vehicules
      await client.query(`
        CREATE TABLE IF NOT EXISTS vehicules (
          id SERIAL PRIMARY KEY,
          matricule VARCHAR(20) UNIQUE NOT NULL,
          marque VARCHAR(100) NOT NULL,
          modele VARCHAR(100) NOT NULL,
          annee INTEGER,
          couleur VARCHAR(50),
          type_vehicule VARCHAR(50) DEFAULT 'utilitaire',
          immatriculation VARCHAR(20) UNIQUE,
          numero_chassis VARCHAR(100) UNIQUE,
          carburant VARCHAR(20) DEFAULT 'diesel',
          puissance_cv INTEGER,
          kilometrage INTEGER DEFAULT 0,
          date_mise_service DATE,
          statut VARCHAR(20) DEFAULT 'actif',
          employe_id INTEGER REFERENCES employes(id),
          assurance_numero VARCHAR(100),
          assurance_expiration DATE,
          visite_technique_expiration DATE,
          cout_acquisition DECIMAL(10,2),
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      console.log('✅ Table vehicules créée')

      // Table entretiens_vehicules
      await client.query(`
        CREATE TABLE IF NOT EXISTS entretiens_vehicules (
          id SERIAL PRIMARY KEY,
          vehicule_id INTEGER NOT NULL REFERENCES vehicules(id) ON DELETE CASCADE,
          type_entretien VARCHAR(100) NOT NULL,
          date_entretien DATE NOT NULL,
          kilometrage INTEGER,
          cout DECIMAL(10,2),
          description TEXT,
          prestataire VARCHAR(200),
          numero_facture VARCHAR(100),
          prochaine_echeance DATE,
          prochaine_echeance_km INTEGER,
          statut VARCHAR(20) DEFAULT 'termine',
          employe_demandeur_id INTEGER REFERENCES employes(id),
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      console.log('✅ Table entretiens_vehicules créée')

      // Index pour optimiser les performances
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_vehicules_employe ON vehicules(employe_id);
        CREATE INDEX IF NOT EXISTS idx_vehicules_statut ON vehicules(statut);
        CREATE INDEX IF NOT EXISTS idx_entretiens_vehicule ON entretiens_vehicules(vehicule_id);
        CREATE INDEX IF NOT EXISTS idx_entretiens_date ON entretiens_vehicules(date_entretien);
      `)
      console.log('✅ Index créés')

      // Insertion de données d'exemple pour les véhicules
      await client.query(`
        INSERT INTO vehicules (
          matricule, marque, modele, annee, couleur, type_vehicule, 
          immatriculation, carburant, puissance_cv, kilometrage, 
          date_mise_service, statut, cout_acquisition
        ) VALUES
        ('VH001', 'Renault', 'Kangoo', 2020, 'Blanc', 'utilitaire', 'TN-123-456', 'diesel', 90, 45000, '2020-01-15', 'actif', 18500.00),
        ('VH002', 'Peugeot', 'Partner', 2021, 'Gris', 'utilitaire', 'TN-789-012', 'diesel', 100, 32000, '2021-03-10', 'actif', 21000.00),
        ('VH003', 'Citroën', 'Berlingo', 2019, 'Blanc', 'utilitaire', 'TN-345-678', 'diesel', 85, 67000, '2019-06-20', 'actif', 17800.00),
        ('VH004', 'Ford', 'Transit', 2022, 'Bleu', 'camionnette', 'TN-901-234', 'diesel', 130, 15000, '2022-02-01', 'actif', 28500.00)
        ON CONFLICT (matricule) DO NOTHING
      `)
      console.log('✅ Données d\'exemple véhicules insérées')

      // Vérifier que les véhicules ont bien été créés avant d'insérer les entretiens
      const vehiculesResult = await client.query('SELECT id FROM vehicules LIMIT 4')
      if (vehiculesResult.rows.length > 0) {
        // Insertion de données d'exemple pour les entretiens
        await client.query(`
          INSERT INTO entretiens_vehicules (
            vehicule_id, type_entretien, date_entretien, kilometrage, 
            cout, description, prestataire, statut
          ) VALUES
          (1, 'Vidange', '2024-11-01', 45000, 85.50, 'Vidange moteur + filtre à huile', 'Garage Central', 'termine'),
          (1, 'Révision', '2024-06-15', 42000, 250.00, 'Révision complète 40000km', 'Garage Central', 'termine'),
          (2, 'Vidange', '2024-10-20', 32000, 90.00, 'Vidange + contrôle général', 'Auto Service', 'termine'),
          (3, 'Pneus', '2024-09-10', 65000, 320.00, 'Changement 4 pneus', 'Pneumatique Express', 'termine'),
          (4, 'Vidange', '2024-11-15', 15000, 95.00, 'Première vidange', 'Ford Service', 'termine')
        `)
        console.log('✅ Données d\'exemple entretiens insérées')
      }
    }

    // Vérifier les tables créées
    const vehiculesCount = await client.query('SELECT COUNT(*) FROM vehicules')
    const entretiensCount = await client.query('SELECT COUNT(*) FROM entretiens_vehicules')
    
    console.log(`📊 Véhicules créés: ${vehiculesCount.rows[0].count}`)
    console.log(`📊 Entretiens créés: ${entretiensCount.rows[0].count}`)
    console.log('🎉 Création des tables véhicules terminée avec succès!')

  } catch (error) {
    console.error('❌ Erreur lors de la création des tables:', error)
  } finally {
    await client.end()
  }
}

createVehiculesTables()
      )
    `)
    console.log('✅ Table assignations_vehicules créée')

    // Création de la table entretiens_vehicules
    await client.query(`
      CREATE TABLE IF NOT EXISTS entretiens_vehicules (
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
    await client.query('CREATE INDEX IF NOT EXISTS idx_vehicules_statut ON vehicules(statut)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_vehicules_matricule ON vehicules(matricule)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_assignations_vehicules_vehicule_id ON assignations_vehicules(vehicule_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_assignations_vehicules_employe_id ON assignations_vehicules(employe_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_assignations_vehicules_statut ON assignations_vehicules(statut)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_entretiens_vehicules_vehicule_id ON entretiens_vehicules(vehicule_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_entretiens_vehicules_date ON entretiens_vehicules(date_entretien)')
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
