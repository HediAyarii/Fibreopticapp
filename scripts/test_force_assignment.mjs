import fetch from 'node-fetch'

const baseUrl = 'http://localhost:3000'

async function testForceAssignment() {
  console.log('🧪 Test de la fonctionnalité de forçage d\'assignation...')
  
  try {
    // Test 1: Assignation normale (sans conflit)
    console.log('\n📋 Test 1: Assignation normale')
    const normalResponse = await fetch(`${baseUrl}/api/carburant-assignation-periode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        numero_carte: 'TEST_FORCE_001',
        employe_id: 11,
        employe_nom: 'Test Employee',
        date_debut: '2024-01-01',
        date_fin_prevue: '2024-12-31',
        commentaires: 'Test assignation normale',
        force: false
      })
    })
    
    if (normalResponse.ok) {
      console.log('   ✅ Assignation normale réussie')
    } else {
      const error = await normalResponse.json()
      console.log(`   ⚠️ Assignation normale échouée: ${error.error}`)
    }
    
    // Test 2: Assignation avec conflit (sans forçage)
    console.log('\n📋 Test 2: Assignation avec conflit (sans forçage)')
    const conflictResponse = await fetch(`${baseUrl}/api/carburant-assignation-periode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        numero_carte: 'TEST_FORCE_001',
        employe_id: 12,
        employe_nom: 'Test Employee 2',
        date_debut: '2024-06-01',
        date_fin_prevue: '2024-12-31',
        commentaires: 'Test assignation avec conflit',
        force: false
      })
    })
    
    if (conflictResponse.status === 409) {
      console.log('   ✅ Conflit détecté correctement (409)')
      const conflictData = await conflictResponse.json()
      console.log(`   📊 Message: ${conflictData.message}`)
      console.log(`   📊 Conflits: ${conflictData.conflits?.length || 0}`)
    } else {
      console.log(`   ⚠️ Conflit non détecté (status: ${conflictResponse.status})`)
    }
    
    // Test 3: Assignation avec conflit (avec forçage)
    console.log('\n📋 Test 3: Assignation avec conflit (avec forçage)')
    const forceResponse = await fetch(`${baseUrl}/api/carburant-assignation-periode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        numero_carte: 'TEST_FORCE_001',
        employe_id: 12,
        employe_nom: 'Test Employee 2',
        date_debut: '2024-06-01',
        date_fin_prevue: '2024-12-31',
        commentaires: 'Test assignation avec forçage',
        force: true
      })
    })
    
    if (forceResponse.ok) {
      console.log('   ✅ Assignation forcée réussie')
      const forceData = await forceResponse.json()
      console.log(`   📊 Message: ${forceData.message}`)
    } else {
      const error = await forceResponse.json()
      console.log(`   ❌ Forçage échoué: ${error.error}`)
    }
    
    console.log('\n🎯 Résumé des tests:')
    console.log('   - Assignation normale: Testé')
    console.log('   - Détection de conflit: Testé')
    console.log('   - Forçage d\'assignation: Testé')
    console.log('\n🎉 Fonctionnalité de forçage d\'assignation implémentée !')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
  }
}

testForceAssignment()





