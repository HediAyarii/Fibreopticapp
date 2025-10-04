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
  }
]

async function testHistoriqueAssignation() {
  console.log('🧪 Test de l\'historique d\'assignation...')
  
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
    console.log('\n🎉 L\'historique d\'assignation fonctionne correctement !')
  } else {
    console.log('\n⚠️ L\'historique d\'assignation a des problèmes.')
    console.log('📋 Actions recommandées:')
    console.log('   1. Vérifier la structure de la table carburant_assignations')
    console.log('   2. Vérifier les données d\'assignation existantes')
    console.log('   3. Corriger les erreurs SQL dans les APIs')
  }
}

testHistoriqueAssignation()
