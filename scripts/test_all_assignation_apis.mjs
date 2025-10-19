import fetch from 'node-fetch'

const baseUrl = 'http://localhost:3000'

const apiTests = [
  {
    name: 'carburant-assignation-periode (général)',
    url: '/api/carburant-assignation-periode',
    method: 'GET'
  },
  {
    name: 'carburant-assignation-periode (employé)',
    url: '/api/carburant-assignation-periode?employe_id=11',
    method: 'GET'
  },
  {
    name: 'carburant-assignation-periode (carte)',
    url: '/api/carburant-assignation-periode?numero_carte=TEST001',
    method: 'GET'
  },
  {
    name: 'carburant-assignation-periode (période)',
    url: '/api/carburant-assignation-periode?date_debut=2024-01-01&date_fin=2024-12-31',
    method: 'GET'
  },
  {
    name: 'carburant-historique (employé)',
    url: '/api/carburant-historique?type=employe&employe_id=11',
    method: 'GET'
  },
  {
    name: 'carburant-historique (carte)',
    url: '/api/carburant-historique?type=carte&numero_carte=TEST001',
    method: 'GET'
  },
  {
    name: 'carburant-historique (général)',
    url: '/api/carburant-historique',
    method: 'GET'
  }
]

async function testAllAssignationAPIs() {
  console.log('🧪 Test de toutes les APIs d\'assignation...')
  
  let totalTests = 0
  let passedTests = 0
  let failedTests = 0
  
  for (const test of apiTests) {
    totalTests++
    console.log(`\n📋 Test: ${test.name}`)
    console.log(`   URL: ${test.url}`)
    
    try {
      const response = await fetch(`${baseUrl}${test.url}`)
      const data = await response.json()
      
      if (response.ok && data.success !== false) {
        console.log(`   ✅ SUCCÈS (${response.status})`)
        console.log(`   📊 Données: ${JSON.stringify(data).substring(0, 100)}...`)
        passedTests++
      } else {
        console.log(`   ❌ ÉCHEC (${response.status})`)
        console.log(`   📊 Erreur: ${JSON.stringify(data).substring(0, 200)}...`)
        failedTests++
      }
      
    } catch (error) {
      console.log(`   ❌ ERREUR: ${error.message}`)
      failedTests++
    }
  }
  
  console.log('\n🎯 Résumé des tests:')
  console.log(`   - Tests totaux: ${totalTests}`)
  console.log(`   - Tests réussis: ${passedTests}`)
  console.log(`   - Tests échoués: ${failedTests}`)
  console.log(`   - Taux de réussite: ${((passedTests / totalTests) * 100).toFixed(1)}%`)
  
  if (failedTests === 0) {
    console.log('\n🎉 Toutes les APIs d\'assignation fonctionnent parfaitement !')
    console.log('📋 APIs testées:')
    console.log('   ✅ carburant-assignation-periode (4 variantes)')
    console.log('   ✅ carburant-historique (3 variantes)')
    console.log('   ✅ Total: 7/7 APIs fonctionnelles')
  } else {
    console.log('\n⚠️ Certaines APIs d\'assignation ont encore des problèmes.')
    console.log('📋 Actions recommandées:')
    console.log('   1. Vérifier les corrections dans les fichiers API')
    console.log('   2. Redémarrer le serveur si nécessaire')
    console.log('   3. Vérifier la structure de la base de données')
  }
}

testAllAssignationAPIs()






