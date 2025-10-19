// Test script pour vérifier le filtrage par date dans les statistiques d'interventions
const testInterventionsStatsDateFiltering = async () => {
  try {
    console.log('🧪 Test du filtrage par date dans les statistiques d\'interventions...')
    
    // Test 1: Sans filtres de date (toutes les données)
    console.log('\n📊 Test 1: Sans filtres de date')
    const response1 = await fetch('/api/interventions-stats')
    const data1 = await response1.json()
    
    if (data1.success) {
      console.log('✅ API fonctionne sans filtres')
      console.log('📈 Statistiques globales:', {
        total_cloture_terminee: data1.stats.total_cloture_terminee,
        avec_articles: data1.stats.avec_articles,
        sans_articles: data1.stats.sans_articles
      })
    } else {
      console.error('❌ Erreur API sans filtres:', data1.error)
    }
    
    // Test 2: Avec filtres de date (période spécifique)
    console.log('\n📅 Test 2: Avec filtres de date (2024-01-01 à 2024-12-31)')
    const startDate = '2024-01-01'
    const endDate = '2024-12-31'
    
    const response2 = await fetch(`/api/interventions-stats?startDate=${startDate}&endDate=${endDate}`)
    const data2 = await response2.json()
    
    if (data2.success) {
      console.log('✅ API fonctionne avec filtres de date')
      console.log('📈 Statistiques filtrées:', {
        total_cloture_terminee: data2.stats.total_cloture_terminee,
        avec_articles: data2.stats.avec_articles,
        sans_articles: data2.stats.sans_articles
      })
      
      // Comparer avec les données globales
      if (data1.success) {
        console.log('\n🔍 Comparaison:')
        console.log(`Total global: ${data1.stats.total_cloture_terminee} vs Total filtré: ${data2.stats.total_cloture_terminee}`)
        console.log(`Avec articles global: ${data1.stats.avec_articles} vs Avec articles filtré: ${data2.stats.avec_articles}`)
        console.log(`Sans articles global: ${data1.stats.sans_articles} vs Sans articles filtré: ${data2.stats.sans_articles}`)
      }
    } else {
      console.error('❌ Erreur API avec filtres:', data2.error)
    }
    
    // Test 3: Avec période courte (derniers 30 jours)
    console.log('\n📅 Test 3: Avec période courte (derniers 30 jours)')
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    const shortStartDate = thirtyDaysAgo.toISOString().split('T')[0]
    const shortEndDate = today.toISOString().split('T')[0]
    
    const response3 = await fetch(`/api/interventions-stats?startDate=${shortStartDate}&endDate=${shortEndDate}`)
    const data3 = await response3.json()
    
    if (data3.success) {
      console.log('✅ API fonctionne avec période courte')
      console.log('📈 Statistiques période courte:', {
        total_cloture_terminee: data3.stats.total_cloture_terminee,
        avec_articles: data3.stats.avec_articles,
        sans_articles: data3.stats.sans_articles
      })
    } else {
      console.error('❌ Erreur API période courte:', data3.error)
    }
    
    // Test 4: Avec seulement date de début
    console.log('\n📅 Test 4: Avec seulement date de début (2024-06-01)')
    const response4 = await fetch('/api/interventions-stats?startDate=2024-06-01')
    const data4 = await response4.json()
    
    if (data4.success) {
      console.log('✅ API fonctionne avec date de début seulement')
      console.log('📈 Statistiques depuis juin 2024:', {
        total_cloture_terminee: data4.stats.total_cloture_terminee,
        avec_articles: data4.stats.avec_articles,
        sans_articles: data4.stats.sans_articles
      })
    } else {
      console.error('❌ Erreur API date de début:', data4.error)
    }
    
    // Test 5: Avec seulement date de fin
    console.log('\n📅 Test 5: Avec seulement date de fin (2024-06-30)')
    const response5 = await fetch('/api/interventions-stats?endDate=2024-06-30')
    const data5 = await response5.json()
    
    if (data5.success) {
      console.log('✅ API fonctionne avec date de fin seulement')
      console.log('📈 Statistiques jusqu\'à fin juin 2024:', {
        total_cloture_terminee: data5.stats.total_cloture_terminee,
        avec_articles: data5.stats.avec_articles,
        sans_articles: data5.stats.sans_articles
      })
    } else {
      console.error('❌ Erreur API date de fin:', data5.error)
    }
    
  } catch (error) {
    console.error('❌ Erreur test:', error)
  }
}

// Exécuter le test
testInterventionsStatsDateFiltering()
