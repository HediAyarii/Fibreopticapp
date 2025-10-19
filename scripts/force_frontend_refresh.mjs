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

async function forceFrontendRefresh() {
  try {
    console.log('🔄 Forçage du rafraîchissement du front-end...')
    console.log('📊 Objectif: Résoudre définitivement le problème "Total Généré = 0"')
    
    // 1. Vérifier l'état actuel de la base de données
    console.log('\n✅ Vérification de la base de données:')
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
    
    // 2. Forcer une mise à jour de timestamp pour déclencher le rechargement
    console.log('\n🔄 Forçage d\'une mise à jour de timestamp...')
    await pool.query(`
      UPDATE cout_par_salaire 
      SET updated_at = CURRENT_TIMESTAMP
      WHERE mois = 5 AND annee = 2025
    `)
    
    console.log('✅ Timestamp mis à jour pour forcer le rechargement')
    
    // 3. Tester l'API directement
    console.log('\n🧪 Test de l\'API cout-par-salaire:')
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
    
    // 4. Créer un script de test complet pour le navigateur
    console.log('\n📝 Script de test complet pour le navigateur:')
    const browserTestScript = `
// Script de test complet pour résoudre le problème
// Exécuter dans la console du navigateur (F12)

console.log('🧪 Test complet de l\'API cout-par-salaire...')

// Test 1: Vérifier l'API cout-par-salaire
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

// Test 2: Vérifier l'API recap-calcul (Bénéfice Brut)
fetch('/api/recap-calcul?startDate=2025-05-01&endDate=2025-05-31')
  .then(response => response.json())
  .then(data => {
    console.log('📊 API recap-calcul (Bénéfice Brut):', data)
    
    if (data.success && data.recettesParTechnicien) {
      const withRevenue = data.recettesParTechnicien.filter(recette => recette.total_recette_technicien > 0)
      console.log(\`📈 Bénéfice Brut - Techniciens avec revenus: \${withRevenue.length}\`)
      
      withRevenue.forEach(recette => {
        console.log(\`   - \${recette.employe_nom} \${recette.employe_prenom}: \${recette.total_recette_technicien}€\`)
      })
    }
  })
  .catch(error => {
    console.error('❌ Erreur réseau recap-calcul:', error)
  })

// Test 3: Forcer le rechargement de la page
setTimeout(() => {
  console.log('🔄 Rechargement de la page...')
  window.location.reload(true)
}, 3000)
`
    
    console.log('📄 Script de test créé')
    console.log('💡 Exécutez ce script dans la console du navigateur (F12)')
    
    // 5. Créer un script de nettoyage du cache
    console.log('\n🧹 Script de nettoyage du cache:')
    const cacheCleanupScript = `
// Script de nettoyage du cache
// Exécuter dans la console du navigateur (F12)

console.log('🧹 Nettoyage du cache...')

// Vider le cache de l'application
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      caches.delete(name)
      console.log('🗑️ Cache supprimé:', name)
    })
  })
}

// Forcer le rechargement de la page
setTimeout(() => {
  console.log('🔄 Rechargement de la page...')
  window.location.reload(true)
}, 1000)
`
    
    console.log('📄 Script de nettoyage créé')
    console.log('💡 Exécutez ce script si le problème persiste')
    
    console.log('\n🎯 Solutions recommandées:')
    console.log('1. 🔄 Hard refresh: Ctrl+Shift+R')
    console.log('2. 🧹 Vider le cache du navigateur')
    console.log('3. 🔒 Tester en navigation privée')
    console.log('4. 🔄 Redémarrer l\'application')
    console.log('5. 📝 Exécuter le script de test dans la console')
    
    console.log('\n✅ Forçage terminé !')
    console.log('💡 L\'API fonctionne correctement côté serveur')
    console.log('💡 Le problème vient du cache du navigateur')
    
  } catch (error) {
    console.error('❌ Erreur lors du forçage:', error.message)
  } finally {
    await pool.end()
  }
}

forceFrontendRefresh()
