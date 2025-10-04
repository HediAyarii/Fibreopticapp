// Test script pour l'API employee-material-value
const testEmployeeMaterialValueAPI = async () => {
  try {
    console.log('🧪 Test de l\'API employee-material-value...')
    
    // Test 1: Récupérer toutes les valeurs
    console.log('\n1. Test récupération de toutes les valeurs:')
    const response1 = await fetch('http://localhost:3000/api/employee-material-value')
    const data1 = await response1.json()
    console.log('✅ Réponse:', data1)
    
    // Test 2: Test avec filtrage par date
    console.log('\n2. Test avec filtrage par date:')
    const today = new Date().toISOString().split('T')[0]
    const response2 = await fetch(`http://localhost:3000/api/employee-material-value?startDate=${today}`)
    const data2 = await response2.json()
    console.log('✅ Réponse avec filtre date:', data2)
    
    // Test 3: Test avec employé spécifique
    console.log('\n3. Test avec employé spécifique:')
    const response3 = await fetch('http://localhost:3000/api/employee-material-value?employeId=1')
    const data3 = await response3.json()
    console.log('✅ Réponse avec employé spécifique:', data3)
    
    console.log('\n🎉 Tous les tests sont passés!')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Attendre que le serveur soit prêt
setTimeout(() => {
  testEmployeeMaterialValueAPI()
}, 3000)
