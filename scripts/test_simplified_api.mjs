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

async function testSimplifiedApi() {
  try {
    console.log('🧪 Test de l\'API cout-par-salaire simplifiée...')
    
    // 1. Tester l'API directement
    console.log('\n🔧 Test de l\'API cout-par-salaire:')
    try {
      const apiResponse = await fetch('http://localhost:3000/api/cout-par-salaire?mois=5&annee=2025')
      const apiData = await apiResponse.json()
      
      if (apiData.success && apiData.couts) {
        console.log(`📊 API retourne ${apiData.couts.length} techniciens:`)
        const withRevenue = apiData.couts.filter(cout => cout.total_genere > 0)
        const withoutRevenue = apiData.couts.filter(cout => cout.total_genere === 0)
        
        console.log(`📈 Avec revenus: ${withRevenue.length}`)
        console.log(`📉 Sans revenus: ${withoutRevenue.length}`)
        
        if (withRevenue.length > 0) {
          console.log('✅ L\'API fonctionne correctement!')
          withRevenue.forEach(cout => {
            console.log(`   - ${cout.nom} ${cout.prenom}: ${cout.total_genere}€`)
          })
        } else {
          console.log('❌ L\'API ne retourne aucun revenu')
        }
      } else {
        console.log('❌ Erreur API:', apiData.error)
      }
    } catch (error) {
      console.log('❌ Erreur lors du test de l\'API:', error.message)
    }
    
    // 2. Vérifier la base de données
    console.log('\n📊 Vérification de la base de données:')
    const dbCheck = await pool.query(`
      SELECT 
        nom, prenom, matricule, total_genere, rap, updated_at
      FROM cout_par_salaire 
      WHERE mois = 5 AND annee = 2025
      ORDER BY total_genere DESC
    `)
    
    console.log(`📋 ${dbCheck.rows.length} techniciens dans la base:`)
    dbCheck.rows.forEach((row, index) => {
      if (row.total_genere > 0) {
        console.log(`${index + 1}. ${row.nom} ${row.prenom} (${row.matricule}) - ${row.total_genere}€`)
      }
    })
    
    // 3. Créer un script de test pour le navigateur
    console.log('\n📝 Script de test pour le navigateur:')
    const browserTestScript = `
// Script de test pour vérifier l'API simplifiée
// Exécuter dans la console du navigateur (F12)

console.log('🧪 Test de l\'API cout-par-salaire simplifiée...')

fetch('/api/cout-par-salaire?mois=5&annee=2025')
  .then(response => {
    console.log('📡 Statut de la réponse:', response.status)
    console.log('📡 Headers:', response.headers)
    return response.json()
  })
  .then(data => {
    console.log('📊 Données reçues:', data)
    
    if (data.success && data.couts) {
      const withRevenue = data.couts.filter(cout => cout.total_genere > 0)
      const withoutRevenue = data.couts.filter(cout => cout.total_genere === 0)
      
      console.log(\`📈 Techniciens avec revenus: \${withRevenue.length}\`)
      console.log(\`📉 Techniciens sans revenus: \${withoutRevenue.length}\`)
      
      if (withRevenue.length > 0) {
        console.log('✅ L\'API fonctionne correctement!')
        console.log('💡 Les "Total Généré" devraient maintenant s\'afficher correctement')
        
        withRevenue.forEach(cout => {
          console.log(\`   - \${cout.nom} \${cout.prenom}: \${cout.total_genere}€\`)
        })
      } else {
        console.log('❌ L\'API ne retourne toujours aucun revenu')
        console.log('💡 Le problème persiste')
      }
    } else {
      console.log('❌ Erreur API:', data.error)
    }
  })
  .catch(error => {
    console.error('❌ Erreur réseau:', error)
  })
`
    
    console.log('📄 Script de test créé')
    console.log('💡 Exécutez ce script dans la console du navigateur (F12)')
    
    console.log('\n🎯 Test terminé !')
    console.log('💡 L\'API est maintenant simplifiée et devrait fonctionner correctement')
    console.log('💡 Rafraîchissez votre front-end pour voir les changements')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
  } finally {
    await pool.end()
  }
}

testSimplifiedApi()
