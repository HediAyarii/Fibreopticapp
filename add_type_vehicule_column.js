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
    console.log('🚀 Ajout de la colonne type_vehicule à la table vehicules\n')
    console.log('📦 Base de données:', process.env.POSTGRES_DB || 'finalfibre_db')
    console.log('🔗 Hôte:', process.env.POSTGRES_HOST || 'localhost\n')

    await client.query('BEGIN')

    // Vérifier si la colonne existe déjà
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicules' 
      AND column_name = 'type_vehicule'
    `)

    if (checkColumn.rows.length > 0) {
      console.log('⚠️  La colonne type_vehicule existe déjà\n')
    } else {
      // Ajouter la colonne type_vehicule
      console.log('➕ Ajout de la colonne type_vehicule...')
      await client.query(`
        ALTER TABLE vehicules 
        ADD COLUMN type_vehicule VARCHAR(50) DEFAULT 'utilitaire'
      `)
      console.log('✅ Colonne type_vehicule ajoutée avec succès\n')

      // Mettre à jour les véhicules existants avec une valeur par défaut
      const updateResult = await client.query(`
        UPDATE vehicules 
        SET type_vehicule = 'utilitaire' 
        WHERE type_vehicule IS NULL
      `)
      console.log(`✅ ${updateResult.rowCount} véhicules mis à jour avec type_vehicule = 'utilitaire'\n`)
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
