import pkg from 'pg'
const { Pool } = pkg

// Configuration de la base de données
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

async function testBrowserAPIs() {
  try {
    console.log('🧪 Test des APIs depuis le serveur...')
    console.log('📊 Objectif: Vérifier que les APIs retournent les bonnes données')
    
    // 1. Test de l'API cout-par-salaire
    console.log('\n🔧 Test de l\'API cout-par-salaire:')
    try {
      const response = await fetch('http://localhost:3000/api/cout-par-salaire?mois=5&annee=2025')
      const data = await response.json()
      
      if (data.success && data.couts) {
        console.log(`✅ API cout-par-salaire: ${data.couts.length} techniciens`)
        
        const chikhaSalem = data.couts.find(cout => 
          cout.nom.toLowerCase() === 'chikha' && cout.prenom.toLowerCase() === 'salem'
        )
        
        if (chikhaSalem) {
          console.log(`✅ CHIKHA SALEM dans API cout-par-salaire:`)
          console.log(`   - Total Généré: ${chikhaSalem.total_genere}€`)
          console.log(`   - RAP: ${chikhaSalem.rap}€`)
        } else {
          console.log('❌ CHIKHA SALEM non trouvé dans API cout-par-salaire')
        }
        
        // Afficher tous les techniciens avec revenus
        const withRevenue = data.couts.filter(cout => cout.total_genere > 0)
        console.log(`📈 ${withRevenue.length} techniciens avec revenus:`)
        withRevenue.forEach(cout => {
          console.log(`   - ${cout.nom} ${cout.prenom}: ${cout.total_genere}€`)
        })
      } else {
        console.log('❌ Erreur API cout-par-salaire:', data.error)
      }
    } catch (error) {
      console.log('❌ Erreur lors du test de l\'API cout-par-salaire:', error.message)
    }
    
    // 2. Test de l'API recap-calcul
    console.log('\n🔧 Test de l\'API recap-calcul:')
    try {
      const response = await fetch('http://localhost:3000/api/recap-calcul?startDate=2025-05-01&endDate=2025-05-31')
      const data = await response.json()
      
      if (data.success && data.recettesParTechnicien) {
        console.log(`✅ API recap-calcul: ${data.recettesParTechnicien.length} techniciens`)
        
        const chikhaSalem = data.recettesParTechnicien.find(recette => 
          recette.employe_nom.toLowerCase() === 'chikha' && recette.employe_prenom.toLowerCase() === 'salem'
        )
        
        if (chikhaSalem) {
          console.log(`✅ CHIKHA SALEM dans API recap-calcul:`)
          console.log(`   - Recette Technicien: ${chikhaSalem.total_recette_technicien}€`)
          console.log(`   - Nombre d'interventions: ${chikhaSalem.nombre_interventions}`)
        } else {
          console.log('❌ CHIKHA SALEM non trouvé dans API recap-calcul')
        }
        
        // Afficher tous les techniciens avec revenus
        const withRevenue = data.recettesParTechnicien.filter(recette => recette.total_recette_technicien > 0)
        console.log(`📈 ${withRevenue.length} techniciens avec revenus:`)
        withRevenue.forEach(recette => {
          console.log(`   - ${recette.employe_nom} ${recette.employe_prenom}: ${recette.total_recette_technicien}€`)
        })
      } else {
        console.log('❌ Erreur API recap-calcul:', data.error)
      }
    } catch (error) {
      console.log('❌ Erreur lors du test de l\'API recap-calcul:', error.message)
    }
    
    // 3. Comparaison directe
    console.log('\n🔍 Comparaison directe des APIs:')
    try {
      const [coutResponse, recapResponse] = await Promise.all([
        fetch('http://localhost:3000/api/cout-par-salaire?mois=5&annee=2025'),
        fetch('http://localhost:3000/api/recap-calcul?startDate=2025-05-01&endDate=2025-05-31')
      ])
      
      const coutData = await coutResponse.json()
      const recapData = await recapResponse.json()
      
      if (coutData.success && recapData.success) {
        const coutChikha = coutData.couts.find(cout => 
          cout.nom.toLowerCase() === 'chikha' && cout.prenom.toLowerCase() === 'salem'
        )
        const recapChikha = recapData.recettesParTechnicien.find(recette => 
          recette.employe_nom.toLowerCase() === 'chikha' && recette.employe_prenom.toLowerCase() === 'salem'
        )
        
        if (coutChikha && recapChikha) {
          const coutValue = parseFloat(coutChikha.total_genere || 0)
          const recapValue = parseFloat(recapChikha.total_recette_technicien || 0)
          const difference = recapValue - coutValue
          
          console.log(`📊 CHIKHA SALEM - Comparaison des APIs:`)
          console.log(`   - Charges par Salarié: ${coutValue}€`)
          console.log(`   - Bénéfice Brut: ${recapValue}€`)
          console.log(`   - Différence: ${difference}€`)
          
          if (Math.abs(difference) < 0.01) {
            console.log('✅ COHÉRENCE PARFAITE entre les APIs !')
          } else {
            console.log('❌ INCOHÉRENCE DÉTECTÉE entre les APIs !')
            console.log(`💡 Différence: ${difference}€`)
          }
        } else {
          console.log('❌ CHIKHA SALEM non trouvé dans une ou plusieurs APIs')
        }
      }
    } catch (error) {
      console.log('❌ Erreur lors de la comparaison:', error.message)
    }
    
    // 4. Créer un script de test pour le navigateur
    console.log('\n📝 Script de test pour le navigateur:')
    const browserTestScript = `
// Script de test complet pour vérifier la cohérence
// Exécuter dans la console du navigateur (F12)

console.log('🧪 Test complet de cohérence...')

async function testCoherence() {
  try {
    // Test 1: API cout-par-salaire
    console.log('📊 Test de l\'API cout-par-salaire...')
    const coutResponse = await fetch('/api/cout-par-salaire?mois=5&annee=2025')
    const coutData = await coutResponse.json()
    
    if (coutData.success && coutData.couts) {
      const chikhaSalem = coutData.couts.find(cout => 
        cout.nom.toLowerCase() === 'chikha' && cout.prenom.toLowerCase() === 'salem'
      )
      
      if (chikhaSalem) {
        console.log('✅ CHIKHA SALEM dans Charges par Salarié:')
        console.log(\`   - Total Généré: \${chikhaSalem.total_genere}€\`)
        console.log(\`   - RAP: \${chikhaSalem.rap}€\`)
      } else {
        console.log('❌ CHIKHA SALEM non trouvé dans Charges par Salarié')
      }
    }
    
    // Test 2: API recap-calcul
    console.log('📊 Test de l\'API recap-calcul...')
    const recapResponse = await fetch('/api/recap-calcul?startDate=2025-05-01&endDate=2025-05-31')
    const recapData = await recapResponse.json()
    
    if (recapData.success && recapData.recettesParTechnicien) {
      const chikhaSalem = recapData.recettesParTechnicien.find(recette => 
        recette.employe_nom.toLowerCase() === 'chikha' && recette.employe_prenom.toLowerCase() === 'salem'
      )
      
      if (chikhaSalem) {
        console.log('✅ CHIKHA SALEM dans Bénéfice Brut:')
        console.log(\`   - Recette Technicien: \${chikhaSalem.total_recette_technicien}€\`)
        console.log(\`   - Nombre d'interventions: \${chikhaSalem.nombre_interventions}\`)
      } else {
        console.log('❌ CHIKHA SALEM non trouvé dans Bénéfice Brut')
      }
    }
    
    // Test 3: Comparaison
    if (coutData.success && recapData.success) {
      const coutChikha = coutData.couts.find(cout => 
        cout.nom.toLowerCase() === 'chikha' && cout.prenom.toLowerCase() === 'salem'
      )
      const recapChikha = recapData.recettesParTechnicien.find(recette => 
        recette.employe_nom.toLowerCase() === 'chikha' && recette.employe_prenom.toLowerCase() === 'salem'
      )
      
      if (coutChikha && recapChikha) {
        const coutValue = parseFloat(coutChikha.total_genere || 0)
        const recapValue = parseFloat(recapChikha.total_recette_technicien || 0)
        const difference = recapValue - coutValue
        
        console.log('🔍 Comparaison finale:')
        console.log(\`   - Charges par Salarié: \${coutValue}€\`)
        console.log(\`   - Bénéfice Brut: \${recapValue}€\`)
        console.log(\`   - Différence: \${difference}€\`)
        
        if (Math.abs(difference) < 0.01) {
          console.log('✅ COHÉRENCE PARFAITE !')
        } else {
          console.log('❌ INCOHÉRENCE DÉTECTÉE !')
          console.log('💡 Le problème pourrait être dans le cache du navigateur')
          console.log('💡 Essayez un hard refresh (Ctrl+Shift+R)')
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

testCoherence()
`
    
    console.log('📄 Script de test créé')
    console.log('💡 Exécutez ce script dans la console du navigateur (F12)')
    
    console.log('\n🎯 Test des APIs terminé !')
    console.log('💡 Si vous voyez encore une incohérence, essayez un hard refresh (Ctrl+Shift+R)')
    
  } catch (error) {
    console.error('❌ Erreur lors du test des APIs:', error.message)
  } finally {
    await pool.end()
  }
}

testBrowserAPIs()
