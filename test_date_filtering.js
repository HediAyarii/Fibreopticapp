// Test script pour le filtrage par date
console.log('🧪 Test du filtrage par date...')

// Fonction pour tester le filtrage par date
const testDateFiltering = async () => {
  try {
    console.log('\n1. Test sans filtres:')
    const response1 = await fetch('http://localhost:3001/api/employee-material-value')
    const data1 = await response1.json()
    console.log('✅ Tous les employés:', data1.employeeValues?.length || 0, 'employés trouvés')
    
    // Test avec une date de début
    console.log('\n2. Test avec date de début (2024-01-01):')
    const response2 = await fetch('http://localhost:3001/api/employee-material-value?startDate=2024-01-01')
    const data2 = await response2.json()
    console.log('✅ Employés depuis 2024-01-01:', data2.employeeValues?.length || 0, 'employés trouvés')
    
    // Test avec une date de fin
    console.log('\n3. Test avec date de fin (2024-12-31):')
    const response3 = await fetch('http://localhost:3001/api/employee-material-value?endDate=2024-12-31')
    const data3 = await response3.json()
    console.log('✅ Employés jusqu\'au 2024-12-31:', data3.employeeValues?.length || 0, 'employés trouvés')
    
    // Test avec une période spécifique
    console.log('\n4. Test avec période (2024-06-01 à 2024-06-30):')
    const response4 = await fetch('http://localhost:3001/api/employee-material-value?startDate=2024-06-01&endDate=2024-06-30')
    const data4 = await response4.json()
    console.log('✅ Employés en juin 2024:', data4.employeeValues?.length || 0, 'employés trouvés')
    
    // Test avec un employé spécifique
    console.log('\n5. Test avec employé spécifique (ID: 1):')
    const response5 = await fetch('http://localhost:3001/api/employee-material-value?employeId=1')
    const data5 = await response5.json()
    console.log('✅ Employé ID 1:', data5.employeeValues?.length || 0, 'résultats trouvés')
    
    // Test avec employé et période
    console.log('\n6. Test avec employé et période:')
    const response6 = await fetch('http://localhost:3001/api/employee-material-value?employeId=1&startDate=2024-01-01')
    const data6 = await response6.json()
    console.log('✅ Employé ID 1 depuis 2024-01-01:', data6.employeeValues?.length || 0, 'résultats trouvés')
    
    console.log('\n🎉 Tests de filtrage par date terminés!')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Attendre que le serveur soit prêt
setTimeout(() => {
  testDateFiltering()
}, 3000)
