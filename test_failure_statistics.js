// Test script pour les statistiques d'échec avec motifs par technicien
const testFailureStatistics = async () => {
  try {
    console.log('🧪 Test des statistiques d\'échec avec motifs par technicien...')
    
    // Test de l'API
    const startDate = '2024-01-01'
    const endDate = '2024-12-31'
    const technicien = 'all'
    
    const response = await fetch(`/api/statistics/failures?startDate=${startDate}&endDate=${endDate}&technicien=${technicien}`)
    const data = await response.json()
    
    console.log('📊 Réponse API:', data)
    
    if (data.success) {
      console.log('✅ API fonctionne correctement')
      console.log('📈 Statistiques reçues:', {
        total: data.statistics.failures.total,
        byStatus: data.statistics.failures.byStatus.length,
        byReason: data.statistics.failures.byReason.length,
        byTechnician: data.statistics.failures.byTechnician.length,
        motifsByTechnician: data.statistics.failures.motifsByTechnician.length,
        temporalEvolution: data.statistics.failures.temporalEvolution.length
      })
      
      // Test spécifique des motifs par technicien
      if (data.statistics.failures.motifsByTechnician) {
        console.log('🔍 Motifs par technicien:')
        data.statistics.failures.motifsByTechnician.slice(0, 5).forEach((motif, index) => {
          console.log(`${index + 1}. ${motif.nom_technicien} ${motif.prenom_technicien}: ${motif.motif_echec} (${motif.count} fois, ${motif.percentage_technicien}% du technicien)`)
        })
      }
    } else {
      console.error('❌ Erreur API:', data.error)
    }
    
  } catch (error) {
    console.error('❌ Erreur test:', error)
  }
}

// Exécuter le test
testFailureStatistics()
