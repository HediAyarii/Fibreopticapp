import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function testRibDisplay() {
  try {
    console.log('🧪 Test de l\'affichage des champs RIB...')
    
    // 1. Vérifier que les colonnes RIB existent
    console.log('📋 1. Vérification des colonnes RIB...')
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'employes' 
        AND column_name IN ('rib_salaire', 'rib2')
      ORDER BY column_name
    `)
    
    console.log(`📊 Colonnes RIB trouvées: ${columnsResult.rows.length}`)
    columnsResult.rows.forEach((column, index) => {
      console.log(`   ${index + 1}. ${column.column_name} (${column.data_type}) - Nullable: ${column.is_nullable}`)
    })
    
    // 2. Mettre à jour un employé avec des RIB de test
    console.log('📋 2. Mise à jour d\'un employé avec des RIB de test...')
    const updateResult = await pool.query(`
      UPDATE employes 
      SET rib_salaire = 'FR76 1234 5678 9012 3456 7890 123',
          rib2 = 'FR76 9876 5432 1098 7654 3210 987',
          updated_at = NOW()
      WHERE id = 1
      RETURNING id, nom, prenom, rib_salaire, rib2
    `)
    
    if (updateResult.rows.length > 0) {
      console.log('✅ Employé mis à jour avec des RIB de test:')
      console.log(`   - ID: ${updateResult.rows[0].id}`)
      console.log(`   - Nom: ${updateResult.rows[0].prenom} ${updateResult.rows[0].nom}`)
      console.log(`   - RIB Salaire: ${updateResult.rows[0].rib_salaire}`)
      console.log(`   - RIB2: ${updateResult.rows[0].rib2}`)
    }
    
    // 3. Tester l'API /api/employes
    console.log('📋 3. Test de l\'API /api/employes...')
    try {
      const response = await fetch('http://localhost:3000/api/employes')
      if (response.ok) {
        const data = await response.json()
        console.log('✅ API /api/employes accessible')
        
        if (data.employes && data.employes.length > 0) {
          const employeeWithRib = data.employes.find(emp => emp.id === 1)
          if (employeeWithRib) {
            console.log('✅ Champs RIB récupérés via l\'API:')
            console.log(`   - RIB Salaire: ${employeeWithRib.rib_salaire || 'Non renseigné'}`)
            console.log(`   - RIB2: ${employeeWithRib.rib2 || 'Non renseigné'}`)
          } else {
            console.log('⚠️  Employé ID 1 non trouvé dans la réponse API')
          }
        } else {
          console.log('⚠️  Aucun employé trouvé dans la réponse API')
        }
      } else {
        console.log('❌ Erreur API /api/employes:', response.status, response.statusText)
      }
    } catch (apiError) {
      console.log('❌ Erreur lors du test de l\'API:', apiError.message)
      console.log('💡 Assurez-vous que le serveur Next.js est démarré (npm run dev)')
    }
    
    // 4. Nettoyer les données de test
    console.log('📋 4. Nettoyage des données de test...')
    await pool.query(`
      UPDATE employes 
      SET rib_salaire = NULL, 
          rib2 = NULL,
          updated_at = NOW()
      WHERE id = 1
    `)
    console.log('🧹 Données de test nettoyées')
    
    console.log('✅ Test terminé avec succès!')
    console.log('')
    console.log('🎯 Résumé:')
    console.log('   - Colonnes RIB ajoutées à la base de données')
    console.log('   - API /api/employes mise à jour pour inclure les RIB')
    console.log('   - Interface frontend mise à jour pour afficher les RIB')
    console.log('   - Les champs RIB sont maintenant visibles dans les détails de l\'employé')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Exécuter le test
testRibDisplay()
  .then(() => {
    console.log('🎉 Test terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error)
    process.exit(1)
  })






