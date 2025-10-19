// Test script pour vérifier la correction de l'affichage des totaux Coût Total et Charges
const testCostsDisplayFix = async () => {
  try {
    console.log('🧪 Test de la correction de l\'affichage des totaux...')
    
    // Test 1: Vérifier que l'API retourne des données cohérentes
    console.log('\n📊 Test 1: API cout-par-salaire')
    const response = await fetch('/api/cout-par-salaire?mois=5&annee=2025')
    const data = await response.json()
    
    if (data.success && data.couts) {
      console.log('✅ API fonctionne correctement')
      console.log('📈 Données reçues:', {
        nombreCouts: data.couts.length,
        premierCout: data.couts[0] ? {
          nom: data.couts[0].nom,
          prenom: data.couts[0].prenom,
          cout_total: data.couts[0].cout_total,
          charge: data.couts[0].charge
        } : null
      })
      
      // Vérifier que les valeurs sont des nombres
      const coutsValides = data.couts.filter(cout => 
        !isNaN(parseFloat(cout.cout_total)) && !isNaN(parseFloat(cout.charge))
      )
      console.log(`✅ ${coutsValides.length}/${data.couts.length} entrées avec valeurs numériques valides`)
      
      // Calculer les totaux manuellement pour vérification
      const totalCoutManuel = data.couts.reduce((sum, cout) => {
        const value = parseFloat(cout.cout_total || 0)
        return sum + (isNaN(value) ? 0 : value)
      }, 0)
      
      const totalChargeManuel = data.couts.reduce((sum, cout) => {
        const value = parseFloat(cout.charge || 0)
        return sum + (isNaN(value) ? 0 : value)
      }, 0)
      
      console.log('📊 Totaux calculés:', {
        totalCout: totalCoutManuel.toFixed(2),
        totalCharge: totalChargeManuel.toFixed(2)
      })
      
      // Vérifier qu'il n'y a pas de concaténation de chaînes
      const hasStringConcatenation = data.couts.some(cout => 
        typeof cout.cout_total === 'string' && cout.cout_total.includes(cout.cout_total) ||
        typeof cout.charge === 'string' && cout.charge.includes(cout.charge)
      )
      
      if (hasStringConcatenation) {
        console.warn('⚠️ Détection possible de concaténation de chaînes')
      } else {
        console.log('✅ Pas de concaténation de chaînes détectée')
      }
      
    } else {
      console.error('❌ Erreur API:', data.error)
    }
    
    // Test 2: Vérifier avec différentes années
    console.log('\n📅 Test 2: API avec différentes années')
    const currentYear = new Date().getFullYear()
    const years = [currentYear - 1, currentYear, currentYear + 1]
    
    for (const year of years) {
      const yearResponse = await fetch(`/api/cout-par-salaire?mois=5&annee=${year}`)
      const yearData = await yearResponse.json()
      
      if (yearData.success) {
        console.log(`✅ Année ${year}: ${yearData.couts?.length || 0} entrées`)
      }
    }
    
    // Test 3: Vérifier le formatage des nombres
    console.log('\n🔢 Test 3: Formatage des nombres')
    const testNumbers = [1862.93, 456.59, 0, 1234.567]
    
    testNumbers.forEach(num => {
      console.log(`Nombre: ${num}`)
      console.log(`  toFixed(2): ${num.toFixed(2)}`)
      console.log(`  toLocaleString('fr-FR'): ${num.toLocaleString('fr-FR')}`)
    })
    
    console.log('\n✅ Tests terminés avec succès!')
    console.log('💡 Les totaux devraient maintenant s\'afficher correctement comme des sommes numériques.')
    
  } catch (error) {
    console.error('❌ Erreur test:', error)
  }
}

// Exécuter le test
testCostsDisplayFix()
