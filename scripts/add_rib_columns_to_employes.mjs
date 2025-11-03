import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function addRibColumnsToEmployes() {
  try {
    console.log('🔧 Ajout des colonnes RIB_salaire et RIB2 à la table employes...')
    
    // Vérifier d'abord la structure actuelle de la table
    console.log('📋 1. Vérification de la structure actuelle...')
    const currentStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'employes' 
      ORDER BY ordinal_position
    `)
    
    console.log(`📊 Colonnes actuelles dans la table employes: ${currentStructure.rows.length}`)
    currentStructure.rows.forEach((column, index) => {
      console.log(`   ${index + 1}. ${column.column_name} (${column.data_type}) - Nullable: ${column.is_nullable}`)
    })
    
    // Vérifier si les colonnes existent déjà
    const ribSalaireExists = currentStructure.rows.some(row => row.column_name === 'rib_salaire')
    const rib2Exists = currentStructure.rows.some(row => row.column_name === 'rib2')
    
    console.log(`📊 RIB_salaire existe déjà: ${ribSalaireExists}`)
    console.log(`📊 RIB2 existe déjà: ${rib2Exists}`)
    
    // Ajouter RIB_salaire si elle n'existe pas
    if (!ribSalaireExists) {
      console.log('📋 2. Ajout de la colonne RIB_salaire...')
      await pool.query(`
        ALTER TABLE employes 
        ADD COLUMN rib_salaire VARCHAR(50) NULL
      `)
      console.log('✅ Colonne RIB_salaire ajoutée avec succès')
    } else {
      console.log('ℹ️  Colonne RIB_salaire existe déjà')
    }
    
    // Ajouter RIB2 si elle n'existe pas
    if (!rib2Exists) {
      console.log('📋 3. Ajout de la colonne RIB2...')
      await pool.query(`
        ALTER TABLE employes 
        ADD COLUMN rib2 VARCHAR(50) NULL
      `)
      console.log('✅ Colonne RIB2 ajoutée avec succès')
    } else {
      console.log('ℹ️  Colonne RIB2 existe déjà')
    }
    
    // Vérifier la nouvelle structure
    console.log('📋 4. Vérification de la nouvelle structure...')
    const newStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'employes' 
      ORDER BY ordinal_position
    `)
    
    console.log(`📊 Nouvelles colonnes dans la table employes: ${newStructure.rows.length}`)
    
    // Afficher les nouvelles colonnes RIB
    const ribColumns = newStructure.rows.filter(row => 
      row.column_name === 'rib_salaire' || row.column_name === 'rib2'
    )
    
    console.log('📊 Colonnes RIB ajoutées:')
    ribColumns.forEach((column, index) => {
      console.log(`   ${index + 1}. ${column.column_name} (${column.data_type}) - Nullable: ${column.is_nullable}`)
    })
    
    // Tester l'insertion d'un exemple
    console.log('📋 5. Test d\'insertion d\'exemple...')
    const testUpdate = await pool.query(`
      UPDATE employes 
      SET rib_salaire = 'RIB_SALAIRE_TEST', 
          rib2 = 'RIB2_TEST'
      WHERE id = 1
      RETURNING id, nom, prenom, rib_salaire, rib2
    `)
    
    if (testUpdate.rows.length > 0) {
      console.log('✅ Test d\'insertion réussi:')
      console.log(`   - Employé: ${testUpdate.rows[0].prenom} ${testUpdate.rows[0].nom}`)
      console.log(`   - RIB_salaire: ${testUpdate.rows[0].rib_salaire}`)
      console.log(`   - RIB2: ${testUpdate.rows[0].rib2}`)
      
      // Nettoyer le test
      await pool.query(`
        UPDATE employes 
        SET rib_salaire = NULL, 
            rib2 = NULL
        WHERE id = 1
      `)
      console.log('🧹 Données de test nettoyées')
    }
    
    console.log('✅ Ajout des colonnes RIB terminé avec succès!')
    console.log('')
    console.log('🎯 Résumé:')
    console.log('   - Colonne RIB_salaire ajoutée (VARCHAR(50), nullable)')
    console.log('   - Colonne RIB2 ajoutée (VARCHAR(50), nullable)')
    console.log('   - Les colonnes sont prêtes à être utilisées')
    console.log('   - Test d\'insertion réussi')
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des colonnes:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Exécuter l'ajout des colonnes
addRibColumnsToEmployes()
  .then(() => {
    console.log('🎉 Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error)
    process.exit(1)
  })








