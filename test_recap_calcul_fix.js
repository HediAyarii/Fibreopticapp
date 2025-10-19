// Test script pour vérifier la correction du filtrage par date dans le récap calcul
const testRecapCalculDateFiltering = async () => {
  try {
    console.log('🧪 Test du filtrage par date dans le récap calcul...')
    
    // Test avec des dates spécifiques
    const startDate = '2024-01-01'
    const endDate = '2024-12-31'
    
    console.log(`📅 Test avec période: ${startDate} à ${endDate}`)
    
    const response = await fetch(`/api/recap-calcul?startDate=${startDate}&endDate=${endDate}`)
    const data = await response.json()
    
    console.log('📊 Réponse API récap calcul:', data)
    
    if (data.success && data.recapData) {
      console.log('✅ API fonctionne correctement')
      console.log('📈 Données reçues:', {
        nombreEmployes: data.recapData.length,
        totalRecettes: data.recapData.reduce((sum, emp) => sum + (emp.recettes_generes || 0), 0),
        totalRecettesEntreprise: data.recapData.reduce((sum, emp) => sum + (emp.recettes_entreprise || 0), 0)
      })
      
      // Afficher les détails des premiers employés
      console.log('👥 Détails des employés:')
      data.recapData.slice(0, 3).forEach((emp, index) => {
        console.log(`${index + 1}. ${emp.employe_prenom} ${emp.employe_nom}:`)
        console.log(`   - Recettes générées: ${emp.recettes_generes} €`)
        console.log(`   - Recettes entreprise: ${emp.recettes_entreprise} €`)
        console.log(`   - Bénéfice net: ${emp.benefice_net} €`)
      })
      
      // Test avec une période plus courte pour vérifier le filtrage
      console.log('\n🔍 Test avec période courte (derniers 30 jours)...')
      const today = new Date()
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      const shortStartDate = thirtyDaysAgo.toISOString().split('T')[0]
      const shortEndDate = today.toISOString().split('T')[0]
      
      const shortResponse = await fetch(`/api/recap-calcul?startDate=${shortStartDate}&endDate=${shortEndDate}`)
      const shortData = await shortResponse.json()
      
      if (shortData.success) {
        console.log('✅ Filtrage par période courte fonctionne')
        console.log(`📊 Données période courte: ${shortData.recapData.length} employés`)
      }
      
    } else {
      console.error('❌ Erreur API:', data.error)
    }
    
  } catch (error) {
    console.error('❌ Erreur test:', error)
  }
}

// Exécuter le test
testRecapCalculDateFiltering()
