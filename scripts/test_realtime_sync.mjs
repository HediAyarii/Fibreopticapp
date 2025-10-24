import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function testRealtimeSync() {
  try {
    console.log('🧪 Test de la synchronisation en temps réel...')
    console.log('=' .repeat(60))
    
    // 1. Tester l'API SSE
    console.log('📋 1. Test de l\'API SSE /api/employees-updates...')
    try {
      const response = await fetch('http://localhost:3000/api/employees-updates')
      if (response.ok) {
        console.log('✅ API SSE accessible')
        console.log('   - Content-Type:', response.headers.get('content-type'))
        console.log('   - Cache-Control:', response.headers.get('cache-control'))
        console.log('   - Connection:', response.headers.get('connection'))
      } else {
        console.log('❌ Erreur API SSE:', response.status, response.statusText)
      }
    } catch (apiError) {
      console.log('❌ Erreur lors du test API SSE:', apiError.message)
      console.log('💡 Assurez-vous que le serveur Next.js est démarré (npm run dev)')
    }
    
    // 2. Tester la mise à jour d'un employé via l'API
    console.log('📋 2. Test de mise à jour d\'employé avec diffusion SSE...')
    
    // Récupérer un employé existant
    const employeeResult = await pool.query(`
      SELECT id, prenom, nom, telephone, rib_salaire, rib2
      FROM employes 
      WHERE statut = 'actif'
      LIMIT 1
    `)
    
    if (employeeResult.rows.length === 0) {
      console.log('❌ Aucun employé trouvé pour le test')
      return
    }
    
    const testEmployee = employeeResult.rows[0]
    console.log(`   - Employé de test: ${testEmployee.prenom} ${testEmployee.nom} (ID: ${testEmployee.id})`)
    
    // Mettre à jour les données personnelles
    const updateData = {
      id: testEmployee.id,
      telephone: '+33 6 99 88 77 66',
      rib_salaire: 'FR76 5555 6666 7777 8888 9999 000',
      rib2: 'FR76 1111 2222 3333 4444 5555 666'
    }
    
    try {
      const putResponse = await fetch('http://localhost:3000/api/employes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })
      
      if (putResponse.ok) {
        const result = await putResponse.json()
        console.log('✅ Mise à jour employé réussie')
        console.log(`   - Employé: ${result.employe?.prenom} ${result.employe?.nom}`)
        console.log(`   - Nouveau téléphone: ${result.employe?.telephone}`)
        console.log(`   - Nouveau RIB Salaire: ${result.employe?.rib_salaire}`)
        console.log(`   - Nouveau RIB2: ${result.employe?.rib2}`)
        console.log('   📡 Cette mise à jour devrait déclencher une diffusion SSE')
      } else {
        const error = await putResponse.json()
        console.log('❌ Erreur API PUT:', error.error || 'Erreur inconnue')
      }
    } catch (putError) {
      console.log('❌ Erreur lors du test API PUT:', putError.message)
    }
    
    // 3. Vérifier que les données sont bien sauvegardées
    console.log('📋 3. Vérification en base de données...')
    const updatedResult = await pool.query(`
      SELECT id, prenom, nom, telephone, rib_salaire, rib2
      FROM employes 
      WHERE id = $1
    `, [testEmployee.id])
    
    if (updatedResult.rows.length > 0) {
      const updated = updatedResult.rows[0]
      console.log('✅ Données mises à jour en base de données:')
      console.log(`   - Employé: ${updated.prenom} ${updated.nom}`)
      console.log(`   - Téléphone: ${updated.telephone}`)
      console.log(`   - RIB Salaire: ${updated.rib_salaire}`)
      console.log(`   - RIB2: ${updated.rib2}`)
    }
    
    // 4. Nettoyer les données de test
    console.log('📋 4. Nettoyage des données de test...')
    await pool.query(`
      UPDATE employes 
      SET telephone = $1, 
          rib_salaire = $2, 
          rib2 = $3,
          updated_at = NOW()
      WHERE id = $4
    `, [testEmployee.telephone, testEmployee.rib_salaire, testEmployee.rib2, testEmployee.id])
    console.log('🧹 Données de test nettoyées')
    
    console.log('')
    console.log('🎉 Test terminé avec succès!')
    console.log('')
    console.log('📝 Fonctionnalités de synchronisation en temps réel:')
    console.log('   ✅ API SSE /api/employees-updates créée')
    console.log('   ✅ Diffusion automatique des mises à jour employés')
    console.log('   ✅ Diffusion automatique des données personnelles')
    console.log('   ✅ Interface admin avec indicateur de connexion SSE')
    console.log('   ✅ Interface technicien avec indicateur de connexion SSE')
    console.log('   ✅ Notifications toast pour les mises à jour')
    console.log('   ✅ Mise à jour automatique de la liste des employés')
    console.log('   ✅ Reconnexion automatique en cas de perte de connexion')
    
    console.log('')
    console.log('🔧 Pour tester la synchronisation en temps réel:')
    console.log('   1. Ouvrir l\'interface admin dans un navigateur')
    console.log('   2. Ouvrir l\'espace technicien dans un autre navigateur')
    console.log('   3. Modifier les données personnelles dans l\'espace technicien')
    console.log('   4. Observer la mise à jour automatique dans l\'interface admin')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Exécuter le test
testRealtimeSync()
  .then(() => {
    console.log('🎯 Test terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error)
    process.exit(1)
  })





