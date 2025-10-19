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

async function testApiDirectly() {
  try {
    console.log('🧪 Test direct de l\'API pour différentes périodes...')
    console.log('📊 Objectif: Vérifier pourquoi l\'API affiche des interventions pour des périodes vides')
    
    // 1. Tester différentes périodes
    const testPeriods = [
      { name: 'Juin 2025', startDate: '2025-06-01', endDate: '2025-06-30' },
      { name: 'Juillet 2025', startDate: '2025-07-01', endDate: '2025-07-31' },
      { name: 'Décembre 2025', startDate: '2025-12-01', endDate: '2025-12-31' },
      { name: 'Janvier 2026', startDate: '2026-01-01', endDate: '2026-01-31' },
      { name: 'Mai 2025 (avec données)', startDate: '2025-05-01', endDate: '2025-05-31' }
    ]
    
    for (const period of testPeriods) {
      console.log(`\n📊 Test pour ${period.name} (${period.startDate} - ${period.endDate}):`)
      
      try {
        const apiResponse = await fetch(`http://localhost:3000/api/recap-calcul?startDate=${period.startDate}&endDate=${period.endDate}`)
        const apiData = await apiResponse.json()
        
        if (apiData.success && apiData.recettesParTechnicien) {
          const totalInterventions = apiData.recettesParTechnicien.reduce((sum, recette) => sum + (recette.nombre_interventions || 0), 0)
          const totalRevenue = apiData.recettesParTechnicien.reduce((sum, recette) => sum + (recette.total_recette_technicien || 0), 0)
          
          console.log(`   - API: ${apiData.recettesParTechnicien.length} techniciens`)
          console.log(`   - Total interventions: ${totalInterventions}`)
          console.log(`   - Total revenus: ${totalRevenue}€`)
          
          if (totalInterventions > 0 && period.name !== 'Mai 2025 (avec données)') {
            console.log(`   ❌ PROBLÈME: ${totalInterventions} interventions trouvées pour ${period.name}`)
            console.log(`   💡 Cela ne devrait pas être le cas si la période est vide`)
            
            // Afficher les techniciens avec des interventions
            const techniciansWithInterventions = apiData.recettesParTechnicien.filter(recette => recette.nombre_interventions > 0)
            console.log(`   📋 Techniciens avec interventions:`)
            techniciansWithInterventions.forEach(tech => {
              console.log(`      - ${tech.employe_nom} ${tech.employe_prenom}: ${tech.nombre_interventions} interventions, ${tech.total_recette_technicien}€`)
            })
          } else if (totalInterventions > 0) {
            console.log(`   ✅ ${totalInterventions} interventions (normal pour mai 2025)`)
          } else {
            console.log(`   ✅ Aucune intervention (normal)`)
          }
        } else {
          console.log(`   ❌ Erreur API: ${apiData.error || 'Erreur inconnue'}`)
        }
      } catch (error) {
        console.log(`   ❌ Erreur lors du test de l'API: ${error.message}`)
      }
    }
    
    // 2. Test spécifique pour CHIKHA SALEM
    console.log('\n📊 Test spécifique pour CHIKHA SALEM:')
    const chikhaTestPeriods = [
      { name: 'Juin 2025', startDate: '2025-06-01', endDate: '2025-06-30' },
      { name: 'Mai 2025', startDate: '2025-05-01', endDate: '2025-05-31' }
    ]
    
    for (const period of chikhaTestPeriods) {
      console.log(`\n📊 CHIKHA SALEM - ${period.name}:`)
      
      try {
        const apiResponse = await fetch(`http://localhost:3000/api/recap-calcul?startDate=${period.startDate}&endDate=${period.endDate}`)
        const apiData = await apiResponse.json()
        
        if (apiData.success && apiData.recettesParTechnicien) {
          const chikhaSalem = apiData.recettesParTechnicien.find(recette => 
            recette.employe_nom.toLowerCase() === 'chikha' && recette.employe_prenom.toLowerCase() === 'salem'
          )
          
          if (chikhaSalem) {
            console.log(`   ✅ CHIKHA SALEM trouvé:`)
            console.log(`      - Interventions: ${chikhaSalem.nombre_interventions}`)
            console.log(`      - Revenus: ${chikhaSalem.total_recette_technicien}€`)
            
            if (chikhaSalem.nombre_interventions > 0 && period.name === 'Juin 2025') {
              console.log(`   ❌ PROBLÈME: CHIKHA SALEM a ${chikhaSalem.nombre_interventions} interventions pour juin 2025`)
              console.log(`   💡 Cela ne devrait pas être le cas`)
            } else if (chikhaSalem.nombre_interventions > 0) {
              console.log(`   ✅ ${chikhaSalem.nombre_interventions} interventions (normal pour mai 2025)`)
            } else {
              console.log(`   ✅ Aucune intervention (normal)`)
            }
          } else {
            console.log(`   ✅ CHIKHA SALEM non trouvé (normal pour ${period.name})`)
          }
        } else {
          console.log(`   ❌ Erreur API: ${apiData.error || 'Erreur inconnue'}`)
        }
      } catch (error) {
        console.log(`   ❌ Erreur: ${error.message}`)
      }
    }
    
    // 3. Créer un script de test pour le navigateur
    console.log('\n📝 Script de test pour le navigateur:')
    const browserTestScript = `
// Script de test pour vérifier le filtrage de dates
// Exécuter dans la console du navigateur (F12)

console.log('🧪 Test du filtrage de dates dans l\'API...')

const testPeriods = [
  { name: 'Juin 2025', startDate: '2025-06-01', endDate: '2025-06-30' },
  { name: 'Juillet 2025', startDate: '2025-07-01', endDate: '2025-07-31' },
  { name: 'Décembre 2025', startDate: '2025-12-01', endDate: '2025-12-31' },
  { name: 'Janvier 2026', startDate: '2026-01-01', endDate: '2026-01-31' }
]

async function testDateFiltering() {
  for (const period of testPeriods) {
    console.log(\`\\n📊 Test pour \${period.name}:\`)
    
    try {
      const response = await fetch(\`/api/recap-calcul?startDate=\${period.startDate}&endDate=\${period.endDate}\`)
      const data = await response.json()
      
      if (data.success && data.recettesParTechnicien) {
        const totalInterventions = data.recettesParTechnicien.reduce((sum, recette) => sum + (recette.nombre_interventions || 0), 0)
        const totalRevenue = data.recettesParTechnicien.reduce((sum, recette) => sum + (recette.total_recette_technicien || 0), 0)
        
        console.log(\`   - API: \${data.recettesParTechnicien.length} techniciens\`)
        console.log(\`   - Total interventions: \${totalInterventions}\`)
        console.log(\`   - Total revenus: \${totalRevenue}€\`)
        
        if (totalInterventions > 0) {
          console.log(\`   ❌ PROBLÈME: \${totalInterventions} interventions trouvées pour \${period.name}\`)
          console.log(\`   💡 Cela ne devrait pas être le cas si la période est vide\`)
          
          // Afficher les techniciens avec des interventions
          const techniciansWithInterventions = data.recettesParTechnicien.filter(recette => recette.nombre_interventions > 0)
          console.log(\`   📋 Techniciens avec interventions:\`)
          techniciansWithInterventions.forEach(tech => {
            console.log(\`      - \${tech.employe_nom} \${tech.employe_prenom}: \${tech.nombre_interventions} interventions, \${tech.total_recette_technicien}€\`)
          })
        } else {
          console.log(\`   ✅ Aucune intervention (normal)\`)
        }
      } else {
        console.log(\`   ❌ Erreur API: \${data.error || 'Erreur inconnue'}\`)
      }
    } catch (error) {
      console.error(\`   ❌ Erreur: \${error.message}\`)
    }
  }
}

testDateFiltering()
`
    
    console.log('📄 Script de test créé')
    console.log('💡 Exécutez ce script dans la console du navigateur (F12)')
    
    console.log('\n🎯 Test terminé !')
    console.log('💡 Le problème semble être dans le filtrage de dates de l\'API')
    console.log('💡 L\'API ne filtre pas correctement les dates et retourne des données d\'autres périodes')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
  } finally {
    await pool.end()
  }
}

testApiDirectly()
