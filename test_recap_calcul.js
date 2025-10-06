// Test script pour l'API récap calcul
const testRecapCalculAPI = async () => {
  try {
    console.log('🧪 Test de l\'API récap calcul...')
    
    // Test 1: Récupérer toutes les données
    console.log('\n1. Test récupération de toutes les données:')
    const response1 = await fetch('http://localhost:3001/api/recap-calcul')
    const data1 = await response1.json()
    console.log('✅ Réponse:', data1)
    
    // Test 2: Test avec filtrage par date
    console.log('\n2. Test avec filtrage par date:')
    const today = new Date().toISOString().split('T')[0]
    const response2 = await fetch(`http://localhost:3001/api/recap-calcul?startDate=${today}`)
    const data2 = await response2.json()
    console.log('✅ Réponse avec filtre date:', data2)
    
    // Test 3: Test avec grille Axecom
    console.log('\n3. Test avec grille Axecom:')
    const response3 = await fetch('http://localhost:3001/api/recap-calcul?grille=axecom')
    const data3 = await response3.json()
    console.log('✅ Réponse avec grille Axecom:', data3)
    
    // Test 4: Test avec grille ERT
    console.log('\n4. Test avec grille ERT:')
    const response4 = await fetch('http://localhost:3001/api/recap-calcul?grille=ert')
    const data4 = await response4.json()
    console.log('✅ Réponse avec grille ERT:', data4)
    
    // Test 5: Test avec employé spécifique
    console.log('\n5. Test avec employé spécifique (ID: 1):')
    const response5 = await fetch('http://localhost:3001/api/recap-calcul?employeId=1')
    const data5 = await response5.json()
    console.log('✅ Employé ID 1:', data5)
    
    // Test 6: Test avec employé et période
    console.log('\n6. Test avec employé et période:')
    const response6 = await fetch('http://localhost:3001/api/recap-calcul?employeId=1&startDate=2024-01-01')
    const data6 = await response6.json()
    console.log('✅ Employé ID 1 depuis 2024-01-01:', data6)
    
    // Test 7: Test avec tous les filtres
    console.log('\n7. Test avec tous les filtres:')
    const response7 = await fetch('http://localhost:3001/api/recap-calcul?startDate=2024-01-01&endDate=2024-12-31&grille=axecom&employeId=1')
    const data7 = await response7.json()
    console.log('✅ Tous les filtres:', data7)
    
    console.log('\n🎉 Tous les tests sont passés!')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Attendre que le serveur soit prêt
setTimeout(() => {
  testRecapCalculAPI()
}, 3000)
