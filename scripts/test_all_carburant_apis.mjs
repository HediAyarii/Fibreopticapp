import fetch from 'node-fetch'

const baseUrl = 'http://localhost:3000'

const apiTests = [
  {
    name: 'carburant-historique (employe)',
    url: '/api/carburant-histoire?employe_id=11',
    method: 'GET'
  },
  {
    name: 'carburant-historique (carte)',
    url: '/api/carburant-histoire?numero_carte=TEST001',
    method: 'GET'
  },
  {
    name: 'carburant-historique (général)',
    url: '/api/carburant-histoire',
    method: 'GET'
  },
  {
    name: 'consommation-carburant-historique',
    url: '/api/consommation-carburant-historique',
    method: 'GET'
  },
  {
    name: 'employes (avec carburant)',
    url: '/api/employes',
    method: 'GET'
  }
]

async function testAllCarburantAPIs() {
  console.log('🧪 Test de toutes les APIs carburant...')
  
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
    console.log('\n🎉 Toutes les APIs carburant fonctionnent correctement !')
  } else {
    console.log('\n⚠️ Certaines APIs carburant ont des problèmes.')
  }
}

testAllCarburantAPIs()






