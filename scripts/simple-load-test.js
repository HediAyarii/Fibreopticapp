#!/usr/bin/env node

const http = require('http')

// Configuration simple
const config = {
  target: 'http://localhost:3000',
  users: 10,
  testDuration: 120, // 2 minutes
}

// Métriques
const metrics = {
  requests: 0,
  errors: 0,
  responseTimes: [],
  startTime: Date.now()
}

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

// Fonction pour faire une requête
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    
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
        const responseTime = Date.now() - startTime
        metrics.responseTimes.push(responseTime)
        metrics.requests++
        
        if (res.statusCode >= 400) {
          metrics.errors++
          console.log(`❌ Erreur ${res.statusCode} sur ${path}`)
        }
        
        resolve({ statusCode: res.statusCode, body, responseTime })
      })
    })
    
    req.on('error', (error) => {
      metrics.errors++
      console.log(`❌ Erreur réseau: ${error.message}`)
      reject(error)
    })
    
    if (data) {
      req.write(JSON.stringify(data))
    }
    
    req.end()
  })
}

// Scénario pour un utilisateur
async function runUserTest(userIndex) {
  const user = users[userIndex % users.length]
  console.log(`👤 Utilisateur ${userIndex + 1}: ${user.email}`)
  
  try {
    // 1. Login
    const loginResult = await makeRequest('/api/auth/login', 'POST', {
      email: user.email,
      password: user.password
    })
    
    if (loginResult.statusCode === 200) {
      console.log(`✅ Login réussi - Utilisateur ${userIndex + 1}`)
    } else {
      console.log(`❌ Échec login - Utilisateur ${userIndex + 1}`)
      return
    }
    
    // 2. Requêtes répétées
    for (let i = 0; i < 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Requêtes aléatoires
      const requests = [
        '/api/sections',
        '/api/users',
        '/api/sections'
      ]
      
      const randomPath = requests[Math.floor(Math.random() * requests.length)]
      await makeRequest(randomPath)
    }
    
    console.log(`✅ Test terminé - Utilisateur ${userIndex + 1}`)
    
  } catch (error) {
    console.log(`❌ Erreur utilisateur ${userIndex + 1}: ${error.message}`)
  }
}

// Test principal
async function runLoadTest() {
  console.log('🚀 DÉMARRAGE DU TEST DE CHARGE')
  console.log('==============================')
  console.log(`👥 Utilisateurs: ${config.users}`)
  console.log(`⏱️  Durée: ${config.testDuration} secondes`)
  console.log('')
  
  // Lancer tous les utilisateurs en parallèle
  const promises = []
  for (let i = 0; i < config.users; i++) {
    promises.push(runUserTest(i))
  }
  
  // Attendre la fin du test
  setTimeout(() => {
    printResults()
    process.exit(0)
  }, config.testDuration * 1000)
  
  // Attendre que tous les tests se terminent
  await Promise.all(promises)
}

// Afficher les résultats
function printResults() {
  const duration = (Date.now() - metrics.startTime) / 1000
  const avgResponseTime = metrics.responseTimes.length > 0 
    ? metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length 
    : 0
  const maxResponseTime = metrics.responseTimes.length > 0 ? Math.max(...metrics.responseTimes) : 0
  const minResponseTime = metrics.responseTimes.length > 0 ? Math.min(...metrics.responseTimes) : 0
  const errorRate = metrics.requests > 0 ? (metrics.errors / metrics.requests) * 100 : 0
  
  console.log('')
  console.log('📊 RÉSULTATS DU TEST')
  console.log('===================')
  console.log(`⏱️  Durée: ${duration.toFixed(2)}s`)
  console.log(`📈 Requêtes: ${metrics.requests}`)
  console.log(`❌ Erreurs: ${metrics.errors} (${errorRate.toFixed(1)}%)`)
  console.log(`⚡ Temps moyen: ${avgResponseTime.toFixed(0)}ms`)
  console.log(`🚀 Temps max: ${maxResponseTime}ms`)
  console.log(`🏃 Temps min: ${minResponseTime}ms`)
  console.log(`📊 Req/s: ${(metrics.requests / duration).toFixed(1)}`)
  
  // Analyse
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
}

// Gestion de l'arrêt
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrompu')
  printResults()
  process.exit(0)
})

// Démarrer
console.log('🔧 Vérification du serveur...')
runLoadTest().catch(console.error)
