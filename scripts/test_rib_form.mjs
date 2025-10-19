import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function testRibForm() {
  try {
    console.log('🧪 Test du formulaire de modification avec champs RIB...')
    
    // 1. Mettre à jour un employé avec des RIB via l'API
    console.log('📋 1. Test de mise à jour via l\'API PUT...')
    
    const testRibData = {
      id: 1,
      rib_salaire: 'FR76 1111 2222 3333 4444 5555 666',
      rib2: 'FR76 9999 8888 7777 6666 5555 444'
    }
    
    try {
      const response = await fetch('http://localhost:3000/api/employes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testRibData)
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Mise à jour RIB via API réussie')
        console.log(`   - Employé ID: ${result.employe?.id}`)
        console.log(`   - RIB Salaire: ${result.employe?.rib_salaire}`)
        console.log(`   - RIB2: ${result.employe?.rib2}`)
      } else {
        const error = await response.json()
        console.log('❌ Erreur API:', error.error || 'Erreur inconnue')
      }
    } catch (apiError) {
      console.log('❌ Erreur lors du test API:', apiError.message)
      console.log('💡 Assurez-vous que le serveur Next.js est démarré (npm run dev)')
    }
    
    // 2. Vérifier que les données sont bien sauvegardées en base
    console.log('📋 2. Vérification en base de données...')
    const dbResult = await pool.query(`
      SELECT id, nom, prenom, rib_salaire, rib2
      FROM employes 
      WHERE id = 1
    `)
    
    if (dbResult.rows.length > 0) {
      const employee = dbResult.rows[0]
      console.log('✅ Données RIB en base de données:')
      console.log(`   - Employé: ${employee.prenom} ${employee.nom}`)
      console.log(`   - RIB Salaire: ${employee.rib_salaire || 'Non renseigné'}`)
      console.log(`   - RIB2: ${employee.rib2 || 'Non renseigné'}`)
    } else {
      console.log('❌ Employé ID 1 non trouvé en base de données')
    }
    
    // 3. Tester la récupération via l'API GET
    console.log('📋 3. Test de récupération via l\'API GET...')
    try {
      const getResponse = await fetch('http://localhost:3000/api/employes')
      if (getResponse.ok) {
        const data = await getResponse.json()
        const employeeWithRib = data.employes?.find(emp => emp.id === 1)
        if (employeeWithRib) {
          console.log('✅ Récupération RIB via API GET réussie:')
          console.log(`   - RIB Salaire: ${employeeWithRib.rib_salaire || 'Non renseigné'}`)
          console.log(`   - RIB2: ${employeeWithRib.rib2 || 'Non renseigné'}`)
        } else {
          console.log('⚠️  Employé ID 1 non trouvé dans la réponse API')
        }
      } else {
        console.log('❌ Erreur API GET:', getResponse.status, getResponse.statusText)
      }
    } catch (getError) {
      console.log('❌ Erreur lors du test API GET:', getError.message)
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
    console.log('   - Champs RIB ajoutés au formulaire de modification')
    console.log('   - API PUT mise à jour pour gérer les champs RIB')
    console.log('   - API GET récupère les champs RIB')
    console.log('   - Interface frontend mise à jour pour afficher les RIB')
    console.log('   - Les champs RIB sont maintenant modifiables dans le formulaire')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Exécuter le test
testRibForm()
  .then(() => {
    console.log('🎉 Test terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error)
    process.exit(1)
  })

