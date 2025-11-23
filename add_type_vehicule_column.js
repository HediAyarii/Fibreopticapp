const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024'
})

async function addTypeVehiculeColumn() {
  const client = await pool.connect()
  
  try {
    console.log('🚀 Ajout des colonnes manquantes à la table vehicules\n')
    console.log('📦 Base de données:', process.env.POSTGRES_DB || 'finalfibre_db')
    console.log('🔗 Hôte:', process.env.POSTGRES_HOST || 'localhost\n')

    await client.query('BEGIN')

    // Vérifier et ajouter la colonne type_vehicule
    const checkTypeVehicule = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicules' 
      AND column_name = 'type_vehicule'
    `)

    if (checkTypeVehicule.rows.length > 0) {
      console.log('⚠️  La colonne type_vehicule existe déjà\n')
    } else {
      console.log('➕ Ajout de la colonne type_vehicule...')
      await client.query(`
        ALTER TABLE vehicules 
        ADD COLUMN type_vehicule VARCHAR(50) DEFAULT 'utilitaire'
      `)
      console.log('✅ Colonne type_vehicule ajoutée avec succès\n')

      const updateResult = await client.query(`
        UPDATE vehicules 
        SET type_vehicule = 'utilitaire' 
        WHERE type_vehicule IS NULL
      `)
      console.log(`✅ ${updateResult.rowCount} véhicules mis à jour avec type_vehicule = 'utilitaire'\n`)
    }

    // Vérifier et ajouter la colonne notes
    const checkNotes = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicules' 
      AND column_name = 'notes'
    `)

    if (checkNotes.rows.length > 0) {
      console.log('⚠️  La colonne notes existe déjà\n')
    } else {
      console.log('➕ Ajout de la colonne notes...')
      await client.query(`
        ALTER TABLE vehicules 
        ADD COLUMN notes TEXT
      `)
      console.log('✅ Colonne notes ajoutée avec succès\n')
    }

    // Vérifier et ajouter la colonne carburant
    const checkCarburant = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicules' 
      AND column_name = 'carburant'
    `)

    if (checkCarburant.rows.length > 0) {
      console.log('⚠️  La colonne carburant existe déjà\n')
    } else {
      console.log('➕ Ajout de la colonne carburant...')
      await client.query(`
        ALTER TABLE vehicules 
        ADD COLUMN carburant VARCHAR(50)
      `)
      console.log('✅ Colonne carburant ajoutée avec succès\n')
    }

    // Vérifier et ajouter la colonne assurance_expiration
    const checkAssurance = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicules' 
      AND column_name = 'assurance_expiration'
    `)

    if (checkAssurance.rows.length > 0) {
      console.log('⚠️  La colonne assurance_expiration existe déjà\n')
    } else {
      console.log('➕ Ajout de la colonne assurance_expiration...')
      await client.query(`
        ALTER TABLE vehicules 
        ADD COLUMN assurance_expiration DATE
      `)
      console.log('✅ Colonne assurance_expiration ajoutée avec succès\n')
    }

    // Vérifier et ajouter la colonne visite_technique_expiration
    const checkVisiteTechnique = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicules' 
      AND column_name = 'visite_technique_expiration'
    `)

    if (checkVisiteTechnique.rows.length > 0) {
      console.log('⚠️  La colonne visite_technique_expiration existe déjà\n')
    } else {
      console.log('➕ Ajout de la colonne visite_technique_expiration...')
      await client.query(`
        ALTER TABLE vehicules 
        ADD COLUMN visite_technique_expiration DATE
      `)
      console.log('✅ Colonne visite_technique_expiration ajoutée avec succès\n')
    }

    // Vérifier et ajouter la colonne puissance_fiscale
    const checkPuissanceFiscale = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicules' 
      AND column_name = 'puissance_fiscale'
    `)

    if (checkPuissanceFiscale.rows.length > 0) {
      console.log('⚠️  La colonne puissance_fiscale existe déjà\n')
    } else {
      console.log('➕ Ajout de la colonne puissance_fiscale...')
      await client.query(`
        ALTER TABLE vehicules 
        ADD COLUMN puissance_fiscale INTEGER
      `)
      console.log('✅ Colonne puissance_fiscale ajoutée avec succès\n')
    }

    await client.query('COMMIT')
    console.log('✅ Migration terminée avec succès!')

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Erreur lors de la migration:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

// Exécuter la migration
addTypeVehiculeColumn()
  .then(() => {
    console.log('\n✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  })
