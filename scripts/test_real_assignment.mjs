import fetch from 'node-fetch'

const baseUrl = 'http://localhost:3000'

async function testRealAssignment() {
  console.log('🧪 Test d\'assignation réelle...')
  
  try {
    // Test avec une carte qui n'existe vraiment pas
    console.log('\n📋 Test avec une carte non assignée...')
    const response = await fetch(`${baseUrl}/api/carburant-assignation-periode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        numero_carte: 'CARTE_LIBRE_001',
        employe_id: 12,
        employe_nom: 'Test Employee Libre',
        date_debut: '2024-01-01',
        date_fin_prevue: '2024-12-31',
        commentaires: 'Test assignation carte libre',
        force: false
      })
    })
    
    const data = await response.json()
    console.log(`   📊 Status: ${response.status}`)
    console.log(`   📊 Réponse: ${JSON.stringify(data, null, 2)}`)
    
    if (response.ok) {
      console.log('   ✅ Assignation réussie sans conflit !')
    } else if (response.status === 409) {
      console.log('   ⚠️ Conflit détecté (ce qui ne devrait pas arriver)')
      console.log(`   📊 Message: ${data.message}`)
      if (data.conflits) {
        console.log(`   📊 Conflits: ${data.conflits.length}`)
        data.conflits.forEach((conflit, index) => {
          console.log(`      ${index + 1}. ${JSON.stringify(conflit)}`)
        })
      }
    } else {
      console.log(`   ❌ Erreur: ${data.error}`)
    }
    
    // Test avec une carte déjà assignée (devrait détecter un conflit)
    console.log('\n📋 Test avec une carte déjà assignée...')
    const response2 = await fetch(`${baseUrl}/api/carburant-assignation-periode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        numero_carte: '13', // Carte déjà assignée
        employe_id: 12, // Autre employé
        employe_nom: 'Test Employee Autre',
        date_debut: '2024-01-01',
        date_fin_prevue: '2024-12-31',
        commentaires: 'Test assignation carte déjà assignée',
        force: false
      })
    })
    
    const data2 = await response2.json()
    console.log(`   📊 Status: ${response2.status}`)
    console.log(`   📊 Réponse: ${JSON.stringify(data2, null, 2)}`)
    
    if (response2.status === 409) {
      console.log('   ✅ Conflit correctement détecté !')
      console.log(`   📊 Message: ${data2.message}`)
    } else if (response2.ok) {
      console.log('   ⚠️ Assignation réussie (pas de conflit détecté)')
    } else {
      console.log(`   ❌ Erreur: ${data2.error}`)
    }
    
    console.log('\n🎯 Résumé:')
    console.log('   - Carte libre: Devrait réussir sans conflit')
    console.log('   - Carte assignée: Devrait détecter un conflit')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
  }
}

testRealAssignment()






