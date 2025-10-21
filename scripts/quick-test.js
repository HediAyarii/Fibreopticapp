#!/usr/bin/env node

const http = require('http')

console.log('🚀 TEST DE CHARGE RAPIDE - 10 UTILISATEURS')
console.log('==========================================')

// Utilisateurs de test
const users = [
  { email: 'admin@fibertech.com', password: 'admin123' },
  { email: 'admin@dgflow.com', password: 'admin@dgflow.com' },
  { email: 'ttest@gmail.com', password: 'ttest@gmail.com' },
  { email: 'test_user@gmail.com', password: 'test_user@gmail.com' },
  { email: 'test@gmail.com', password: 'test@gmail.com' },
  { email: 'chef@finalfibre.com', password: 'chef@finalfibre.com' },
  { email: 'test_chef@example.com', password: 'test_chef@example.com' },
  { email: 'test_new@example.com', password: 'test_new@example.com' },
  { email: 'admin@finalfibre.com', password: 'admin@finalfibre.com' },
  { email: 'test_user_new', password: 'test_user_new' }
]

// Métriques
let totalRequests = 0
let totalErrors = 0
let responseTimes = []
const startTime = Date.now()

// Fonction pour faire une requête
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const requestStart = Date.now()
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    }
    
    const req = http.request(options, (res) => {
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => {
        const responseTime = Date.now() - requestStart
        responseTimes.push(responseTime)
        totalRequests++
        
        if (res.statusCode >= 400) {
          totalErrors++
          console.log(`❌ Erreur ${res.statusCode} sur ${path}`)
        }
        
        resolve({ statusCode: res.statusCode, responseTime })
      })
    })
    
    req.on('error', (error) => {
      totalErrors++
      console.log(`❌ Erreur réseau: ${error.message}`)
      reject(error)
    })
    
    if (data) {
      req.write(JSON.stringify(data))
    }
    
    req.end()
  })
}

// Test pour un utilisateur
async function testUser(userIndex) {
  const user = users[userIndex % users.length]
  console.log(`👤 Test utilisateur ${userIndex + 1}: ${user.email}`)
  
  try {
    // Login
    const loginResult = await makeRequest('/api/auth/login', 'POST', {
      email: user.email,
      password: user.password
    })
    
    if (loginResult.statusCode === 200) {
      console.log(`✅ Login OK - Utilisateur ${userIndex + 1}`)
    } else {
      console.log(`❌ Login échoué - Utilisateur ${userIndex + 1}`)
      return
    }
    
    // Quelques requêtes
    await makeRequest('/api/sections')
    await makeRequest('/api/users')
    await makeRequest('/api/sections')
    
    console.log(`✅ Test terminé - Utilisateur ${userIndex + 1}`)
    
  } catch (error) {
    console.log(`❌ Erreur utilisateur ${userIndex + 1}: ${error.message}`)
  }
}

// Test principal
async function runTest() {
  console.log('🔧 Démarrage des tests...')
  console.log('')
  
  // Lancer tous les utilisateurs en même temps
  const promises = []
  for (let i = 0; i < 10; i++) {
    promises.push(testUser(i))
  }
  
  // Attendre que tous se terminent
  await Promise.all(promises)
  
  // Afficher les résultats
  const duration = (Date.now() - startTime) / 1000
  const avgResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
    : 0
  const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0
  const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0
  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0
  
  console.log('')
  console.log('📊 RÉSULTATS')
  console.log('============')
  console.log(`⏱️  Durée: ${duration.toFixed(2)}s`)
  console.log(`📈 Requêtes: ${totalRequests}`)
  console.log(`❌ Erreurs: ${totalErrors} (${errorRate.toFixed(1)}%)`)
  console.log(`⚡ Temps moyen: ${avgResponseTime.toFixed(0)}ms`)
  console.log(`🚀 Temps max: ${maxResponseTime}ms`)
  console.log(`🏃 Temps min: ${minResponseTime}ms`)
  console.log(`📊 Req/s: ${(totalRequests / duration).toFixed(1)}`)
  
  console.log('')
  console.log('📋 ANALYSE')
  console.log('==========')
  
  if (errorRate > 5) {
    console.log('❌ Taux d\'erreur élevé - Vérifiez le serveur')
  } else {
    console.log('✅ Taux d\'erreur acceptable')
  }
  
  if (avgResponseTime > 2000) {
    console.log('❌ Temps de réponse élevé - Optimisation nécessaire')
  } else {
    console.log('✅ Temps de réponse acceptable')
  }
  
  if (maxResponseTime > 5000) {
    console.log('❌ Temps max élevé - Goulots d\'étranglement')
  } else {
    console.log('✅ Temps max acceptable')
  }
  
  console.log('')
  console.log('🎯 RECOMMANDATIONS')
  console.log('==================')
  
  if (errorRate > 5 || avgResponseTime > 2000) {
    console.log('• Vérifiez les logs du serveur Next.js')
    console.log('• Vérifiez les logs de la base de données')
    console.log('• Augmentez les limites de connexions PostgreSQL')
    console.log('• Optimisez les requêtes SQL lentes')
  } else {
    console.log('• Performance acceptable pour 10 utilisateurs')
    console.log('• Vous pouvez augmenter le nombre d\'utilisateurs')
  }
}

// Démarrer le test
runTest().catch(console.error)
