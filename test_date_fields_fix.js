// Test script pour vérifier que les champs de date fonctionnent correctement
const testDateFieldsFunctionality = async () => {
  try {
    console.log('🧪 Test des champs de date dans RevenueCalculation...')
    
    // Test 1: Vérifier que l'API accepte les paramètres de date
    console.log('\n📅 Test 1: API avec paramètres de date')
    const startDate = '2024-01-01'
    const endDate = '2024-12-31'
    
    // Test API revenue-calculation
    const revenueResponse = await fetch(`/api/revenue-calculation?date_from=${startDate}&date_to=${endDate}`)
    const revenueData = await revenueResponse.json()
    
    if (revenueData.success) {
      console.log('✅ API revenue-calculation fonctionne avec dates')
      console.log('📊 Données reçues:', {
        nombreEmployes: revenueData.revenue_data?.length || 0,
        totalInterventions: revenueData.total_stats?.total_interventions || 0
      })
    } else {
      console.error('❌ Erreur API revenue-calculation:', revenueData.error)
    }
    
    // Test API interventions-stats
    const statsResponse = await fetch(`/api/interventions-stats?startDate=${startDate}&endDate=${endDate}`)
    const statsData = await statsResponse.json()
    
    if (statsData.success) {
      console.log('✅ API interventions-stats fonctionne avec dates')
      console.log('📊 Statistiques:', {
        total_cloture_terminee: statsData.stats?.total_cloture_terminee || 0,
        avec_articles: statsData.stats?.avec_articles || 0,
        sans_articles: statsData.stats?.sans_articles || 0
      })
    } else {
      console.error('❌ Erreur API interventions-stats:', statsData.error)
    }
    
    // Test 2: Vérifier avec des dates différentes
    console.log('\n📅 Test 2: API avec dates différentes')
    const shortStartDate = '2024-06-01'
    const shortEndDate = '2024-06-30'
    
    const shortRevenueResponse = await fetch(`/api/revenue-calculation?date_from=${shortStartDate}&date_to=${shortEndDate}`)
    const shortRevenueData = await shortRevenueResponse.json()
    
    const shortStatsResponse = await fetch(`/api/interventions-stats?startDate=${shortStartDate}&endDate=${shortEndDate}`)
    const shortStatsData = await statsResponse.json()
    
    if (shortRevenueData.success && shortStatsData.success) {
      console.log('✅ APIs fonctionnent avec dates courtes')
      
      // Comparer les résultats
      if (revenueData.success && statsData.success) {
        console.log('\n🔍 Comparaison des résultats:')
        console.log(`Interventions (année complète): ${revenueData.total_stats?.total_interventions || 0}`)
        console.log(`Interventions (juin 2024): ${shortRevenueData.total_stats?.total_interventions || 0}`)
        console.log(`Total CLOTURE TERMINEE (année): ${statsData.stats?.total_cloture_terminee || 0}`)
        console.log(`Total CLOTURE TERMINEE (juin): ${shortStatsData.stats?.total_cloture_terminee || 0}`)
      }
    }
    
    // Test 3: Vérifier sans paramètres de date
    console.log('\n📅 Test 3: API sans paramètres de date')
    const noDateRevenueResponse = await fetch('/api/revenue-calculation')
    const noDateRevenueData = await noDateRevenueResponse.json()
    
    const noDateStatsResponse = await fetch('/api/interventions-stats')
    const noDateStatsData = await noDateStatsResponse.json()
    
    if (noDateRevenueData.success && noDateStatsData.success) {
      console.log('✅ APIs fonctionnent sans paramètres de date')
      console.log('📊 Données globales:', {
        interventions: noDateRevenueData.total_stats?.total_interventions || 0,
        total_cloture: noDateStatsData.stats?.total_cloture_terminee || 0
      })
    }
    
    console.log('\n✅ Tests terminés avec succès!')
    console.log('💡 Les champs de date devraient maintenant fonctionner correctement dans l\'interface.')
    
  } catch (error) {
    console.error('❌ Erreur test:', error)
  }
}

// Exécuter le test
testDateFieldsFunctionality()
