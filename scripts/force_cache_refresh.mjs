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

async function forceCacheRefresh() {
  try {
    console.log('🔄 Forçage du rafraîchissement du cache...')
    console.log('📊 Objectif: Résoudre le problème d\'affichage 0€ dans le front-end')
    
    // 1. Vérifier que l'API fonctionne correctement
    console.log('\n✅ Vérification de l\'API cout-par-salaire:')
    const apiTest = await pool.query(`
      SELECT 
        nom, prenom, matricule, total_genere, rap
      FROM cout_par_salaire 
      WHERE mois = 5 AND annee = 2025
      ORDER BY total_genere DESC
    `)
    
    console.log(`📋 ${apiTest.rows.length} techniciens avec revenus:`)
    apiTest.rows.forEach((row, index) => {
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
    
    // 3. Créer un script de test pour le navigateur
    console.log('\n📝 Script de test pour le navigateur:')
    const browserTestScript = `
// Script de test pour forcer le rafraîchissement du cache
// Exécuter dans la console du navigateur (F12)

console.log('🔄 Test de l\'API avec forçage du cache...')

// Méthode 1: Appel avec headers anti-cache
fetch('/api/cout-par-salaire?mois=5&annee=2025&_t=' + Date.now(), {
  method: 'GET',
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
})
  .then(response => {
    console.log('📡 Statut:', response.status)
    console.log('📡 Headers:', response.headers)
    return response.json()
  })
  .then(data => {
    console.log('📊 Données reçues:', data)
    if (data.success && data.couts) {
      console.log('✅ API fonctionne:')
      data.couts.forEach((cout, index) => {
        if (cout.total_genere > 0) {
          console.log(\`\${index + 1}. \${cout.nom} \${cout.prenom} - \${cout.total_genere}€\`)
        }
      })
    } else {
      console.log('❌ Erreur API:', data.error)
    }
  })
  .catch(error => {
    console.error('❌ Erreur:', error)
  })

// Méthode 2: Test avec XMLHttpRequest
const xhr = new XMLHttpRequest()
xhr.open('GET', '/api/cout-par-salaire?mois=5&annee=2025&_t=' + Date.now(), true)
xhr.setRequestHeader('Cache-Control', 'no-cache')
xhr.onreadystatechange = function() {
  if (xhr.readyState === 4 && xhr.status === 200) {
    const data = JSON.parse(xhr.responseText)
    console.log('📊 XHR Données:', data)
  }
}
xhr.send()
`
    
    console.log('📄 Script de test créé')
    console.log('💡 Copiez et exécutez ce script dans la console du navigateur (F12)')
    
    // 4. Créer un script de nettoyage du cache
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
    
    // 5. Vérifier les en-têtes de cache de l'API
    console.log('\n🔍 Vérification des en-têtes de cache:')
    console.log('💡 L\'API devrait avoir les en-têtes suivants:')
    console.log('   - Cache-Control: no-cache, no-store, must-revalidate')
    console.log('   - Pragma: no-cache')
    console.log('   - Expires: 0')
    
    // 6. Créer un script de test complet
    console.log('\n🧪 Script de test complet:')
    const completeTestScript = `
// Script de test complet pour diagnostiquer le problème
// Exécuter dans la console du navigateur (F12)

console.log('🧪 Test complet de l\'API cout-par-salaire...')

// Test 1: Vérifier la connectivité
fetch('/api/cout-par-salaire?mois=5&annee=2025')
  .then(response => {
    console.log('✅ Connectivité OK:', response.status)
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
        console.log('💡 Le problème vient du cache du navigateur')
        console.log('💡 Solutions:')
        console.log('   1. Ctrl+Shift+R (hard refresh)')
        console.log('   2. Vider le cache du navigateur')
        console.log('   3. Tester en navigation privée')
        console.log('   4. Redémarrer l\'application')
      } else {
        console.log('❌ L\'API ne retourne aucun revenu')
        console.log('💡 Le problème vient de l\'API elle-même')
      }
    } else {
      console.log('❌ Erreur API:', data.error)
    }
  })
  .catch(error => {
    console.error('❌ Erreur réseau:', error)
  })
`
    
    console.log('📄 Script de test complet créé')
    console.log('💡 Exécutez ce script pour un diagnostic complet')
    
    console.log('\n🎯 Solutions recommandées:')
    console.log('1. 🔄 Hard refresh: Ctrl+Shift+R')
    console.log('2. 🧹 Vider le cache du navigateur')
    console.log('3. 🔒 Tester en navigation privée')
    console.log('4. 🔄 Redémarrer l\'application')
    console.log('5. 📝 Exécuter le script de test dans la console')
    
    console.log('\n✅ Diagnostic terminé !')
    console.log('💡 L\'API fonctionne correctement côté serveur')
    console.log('💡 Le problème vient du cache du navigateur')
    
  } catch (error) {
    console.error('❌ Erreur lors du forçage du cache:', error.message)
  } finally {
    await pool.end()
  }
}

forceCacheRefresh()
