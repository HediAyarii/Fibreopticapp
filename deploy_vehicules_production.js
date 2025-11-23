const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024'
})

async function deployVehiculesProduction() {
  const client = await pool.connect()
  
  try {
    console.log('🚀 Déploiement COMPLET de la section Véhicules en PRODUCTION\n')
    console.log('📦 Base de données:', process.env.POSTGRES_DB || 'finalfibre_db')
    console.log('🔗 Hôte:', process.env.POSTGRES_HOST || 'localhost\n')

    await client.query('BEGIN')

    // 1. Créer la table vehicules (table principale)
    console.log('1️⃣ Création de la table vehicules...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicules (
        id SERIAL PRIMARY KEY,
        matricule VARCHAR(50) UNIQUE NOT NULL,
        marque VARCHAR(100) NOT NULL,
        modele VARCHAR(100) NOT NULL,
        type_vehicule VARCHAR(50) DEFAULT 'utilitaire',
        annee INTEGER,
        couleur VARCHAR(50),
        numero_chassis VARCHAR(100),
        puissance_cv INTEGER,
        puissance_fiscale INTEGER,
        energie VARCHAR(50),
        carburant VARCHAR(50),
        kilometrage INTEGER DEFAULT 0,
        date_mise_circulation DATE,
        date_acquisition DATE,
        numero_carte_grise VARCHAR(100),
        assurance_expiration DATE,
        visite_technique_expiration DATE,
        statut VARCHAR(50) DEFAULT 'disponible',
        km_actuel INTEGER DEFAULT 0,
        derniere_maj_km TIMESTAMP,
        prochaine_echeance_km DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Table vehicules créée\n')

    // 2. Créer la table assignations_vehicules
    console.log('2️⃣ Création de la table assignations_vehicules...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS assignations_vehicules (
        id SERIAL PRIMARY KEY,
        vehicule_id INTEGER NOT NULL,
        employe_id INTEGER NOT NULL,
        date_assignation DATE NOT NULL,
        date_fin DATE,
        kilometrage_debut INTEGER,
        kilometrage_fin INTEGER,
        statut VARCHAR(50) DEFAULT 'active',
        commentaires TEXT,
        km_debut INTEGER,
        km_actuel INTEGER,
        km_fin INTEGER,
        statut_km VARCHAR(50) DEFAULT 'initial_attente',
        date_derniere_maj TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicule_id) REFERENCES vehicules(id) ON DELETE CASCADE,
        FOREIGN KEY (employe_id) REFERENCES employes(id) ON DELETE CASCADE
      )
    `)
    console.log('✅ Table assignations_vehicules créée\n')

    // 3. Créer la table entretiens_vehicules
    console.log('3️⃣ Création de la table entretiens_vehicules...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS entretiens_vehicules (
        id SERIAL PRIMARY KEY,
        vehicule_id INTEGER NOT NULL,
        type_entretien VARCHAR(100),
        categorie_entretien VARCHAR(100),
        date_entretien DATE NOT NULL,
        kilometrage_entretien INTEGER,
        cout DECIMAL(10,2),
        cout_entretien DECIMAL(10,2),
        prestataire VARCHAR(200),
        garage VARCHAR(200),
        facture_numero VARCHAR(100),
        description TEXT,
        prochaine_echeance_km INTEGER,
        prochaine_echeance_date DATE,
        prochain_entretien_km INTEGER,
        prochain_entretien_date DATE,
        statut VARCHAR(50) DEFAULT 'effectue',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicule_id) REFERENCES vehicules(id) ON DELETE CASCADE
      )
    `)
    console.log('✅ Table entretiens_vehicules créée\n')

    // 4. Créer la table vehicules_km_updates
    console.log('4️⃣ Création de la table vehicules_km_updates...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicules_km_updates (
        id SERIAL PRIMARY KEY,
        vehicule_id INTEGER NOT NULL,
        assignation_id INTEGER,
        technicien_id INTEGER NOT NULL,
        km_declare INTEGER NOT NULL,
        photo_path TEXT NOT NULL,
        type_update VARCHAR(50) DEFAULT 'mensuel',
        statut VARCHAR(50) DEFAULT 'en_attente',
        validee_par_admin_id INTEGER,
        commentaire_admin TEXT,
        date_soumission TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        date_validation TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicule_id) REFERENCES vehicules(id) ON DELETE CASCADE,
        FOREIGN KEY (assignation_id) REFERENCES assignations_vehicules(id) ON DELETE SET NULL,
        FOREIGN KEY (technicien_id) REFERENCES employes(id) ON DELETE CASCADE
      )
    `)
    console.log('✅ Table vehicules_km_updates créée\n')

    // 5. Créer des index pour optimiser les performances
    console.log('5️⃣ Création des index...')
    
    const indexes = [
      // Index vehicules
      'CREATE INDEX IF NOT EXISTS idx_vehicules_statut ON vehicules(statut)',
      'CREATE INDEX IF NOT EXISTS idx_vehicules_matricule ON vehicules(matricule)',
      'CREATE INDEX IF NOT EXISTS idx_vehicules_echeance ON vehicules(prochaine_echeance_km)',
      
      // Index assignations_vehicules
      'CREATE INDEX IF NOT EXISTS idx_assignations_vehicule ON assignations_vehicules(vehicule_id)',
      'CREATE INDEX IF NOT EXISTS idx_assignations_employe ON assignations_vehicules(employe_id)',
      'CREATE INDEX IF NOT EXISTS idx_assignations_statut ON assignations_vehicules(statut)',
      'CREATE INDEX IF NOT EXISTS idx_assignations_statut_km ON assignations_vehicules(statut_km)',
      'CREATE INDEX IF NOT EXISTS idx_assignations_date ON assignations_vehicules(date_assignation)',
      
      // Index entretiens_vehicules
      'CREATE INDEX IF NOT EXISTS idx_entretiens_vehicule ON entretiens_vehicules(vehicule_id)',
      'CREATE INDEX IF NOT EXISTS idx_entretiens_date ON entretiens_vehicules(date_entretien)',
      'CREATE INDEX IF NOT EXISTS idx_entretiens_type ON entretiens_vehicules(type_entretien)',
      
      // Index vehicules_km_updates
      'CREATE INDEX IF NOT EXISTS idx_km_updates_vehicule ON vehicules_km_updates(vehicule_id)',
      'CREATE INDEX IF NOT EXISTS idx_km_updates_technicien ON vehicules_km_updates(technicien_id)',
      'CREATE INDEX IF NOT EXISTS idx_km_updates_statut ON vehicules_km_updates(statut)',
      'CREATE INDEX IF NOT EXISTS idx_km_updates_date ON vehicules_km_updates(date_soumission)'
    ]

    for (const indexQuery of indexes) {
      await client.query(indexQuery)
    }
    console.log('✅ 15 index créés\n')

    await client.query('COMMIT')

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ DÉPLOIEMENT COMPLET TERMINÉ AVEC SUCCÈS !')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    console.log('📋 RÉSUMÉ:')
    console.log('  ✓ Table vehicules créée (table principale)')
    console.log('  ✓ Table assignations_vehicules créée')
    console.log('  ✓ Table entretiens_vehicules créée')
    console.log('  ✓ Table vehicules_km_updates créée')
    console.log('  ✓ 15 index de performance créés\n')

    console.log('🎯 PROCHAINES ÉTAPES:')
    console.log('  1. Créer le dossier pour les photos:')
    console.log('     mkdir -p /var/www/app.networkcom.paris/public/uploads/vehicules')
    console.log('     chmod 755 /var/www/app.networkcom.paris/public/uploads/vehicules')
    console.log('  2. Redémarrer l\'application Next.js:')
    console.log('     pm2 restart finalfibre-app')
    console.log('  3. Tester la création d\'un véhicule')
    console.log('  4. Tester la création d\'une assignation')
    console.log('  5. Tester la soumission d\'un KM avec photo (côté technicien)')
    console.log('  6. Tester la validation admin\n')

    // Statistiques
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM vehicules) as total_vehicules,
        (SELECT COUNT(*) FROM assignations_vehicules) as total_assignations,
        (SELECT COUNT(*) FROM assignations_vehicules WHERE statut = 'active') as assignations_actives,
        (SELECT COUNT(*) FROM entretiens_vehicules) as total_entretiens,
        (SELECT COUNT(*) FROM vehicules_km_updates) as total_km_updates
    `)
    
    console.log('📊 STATISTIQUES:')
    console.log(`  • Véhicules: ${stats.rows[0].total_vehicules}`)
    console.log(`  • Assignations totales: ${stats.rows[0].total_assignations}`)
    console.log(`  • Assignations actives: ${stats.rows[0].assignations_actives}`)
    console.log(`  • Entretiens: ${stats.rows[0].total_entretiens}`)
    console.log(`  • Mises à jour KM: ${stats.rows[0].total_km_updates}\n`)

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ ERREUR lors du déploiement:', error)
    console.error('\n💡 Détails de l\'erreur:')
    console.error('  Code:', error.code)
    console.error('  Message:', error.message)
    if (error.detail) console.error('  Détail:', error.detail)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

// Vérifier les variables d'environnement
console.log('🔍 Vérification de la configuration...\n')
const requiredEnvVars = ['POSTGRES_HOST', 'POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASSWORD']
const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

if (missingVars.length > 0) {
  console.warn('⚠️ Variables d\'environnement manquantes:', missingVars.join(', '))
  console.warn('   Utilisation des valeurs par défaut...\n')
}

deployVehiculesProduction()
