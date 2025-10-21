#!/usr/bin/env node

const http = require('http')
const https = require('https')
const { URL } = require('url')

// Configuration du test
const config = {
  target: 'http://localhost:3000',
  users: 10,
  duration: 300, // 5 minutes
  rampUp: 60, // Montée en charge sur 1 minute
}

// Compteurs pour les métriques
const metrics = {
  requests: 0,
  errors: 0,
  responseTimes: [],
  startTime: Date.now()
}

// Utilisateurs de test
const testUsers = [
  { email: 'admin@fibertech.com', password: 'admin123', role: 'admin' },
  { email: 'admin@dgflow.com', password: 'admin@dgflow.com', role: 'employee' },
  { email: 'ttest@gmail.com', password: 'ttest@gmail.com', role: 'employee' },
  { email: 'test_user@gmail.com', password: 'test_user@gmail.com', role: 'employee' },
  { email: 'test@gmail.com', password: 'test@gmail.com', role: 'employee' },
  { email: 'chef@finalfibre.com', password: 'chef@finalfibre.com', role: 'employee' },
  { email: 'test_chef@example.com', password: 'test_chef@example.com', role: 'employee' },
  { email: 'test_new@example.com', password: 'test_new@example.com', role: 'employee' },
  { email: 'admin@finalfibre.com', password: 'admin@finalfibre.com', role: 'admin' },
  { email: 'test_user_new', password: 'test_user_new', role: 'employee' }
]

// Fonction pour faire une requête HTTP
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    const protocol = options.protocol === 'https:' ? https : http
    
    const req = protocol.request(options, (res) => {
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => {
        const responseTime = Date.now() - startTime
        metrics.responseTimes.push(responseTime)
        metrics.requests++
        
        if (res.statusCode >= 400) {
          metrics.errors++
        }
        
        resolve({
          statusCode: res.statusCode,
          body: body,
          responseTime: responseTime
        })
      })
    })
    
    req.on('error', (error) => {
      metrics.errors++
      reject(error)
    })
    
    if (data) {
      req.write(JSON.stringify(data))
    }
    
    req.end()
  })
}

// Scénario de test pour un utilisateur
async function runUserScenario(user, userIndex) {
  console.log(`👤 Utilisateur ${userIndex + 1} (${user.email}) - Démarrage`)
  
  try {
    // 1. Login
    const loginOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }
    
    const loginResult = await makeRequest(loginOptions, {
      email: user.email,
      password: user.password
    })
    
    if (loginResult.statusCode !== 200) {
      console.log(`❌ Échec login utilisateur ${userIndex + 1}: ${loginResult.statusCode}`)
      return
    }
    
    console.log(`✅ Login réussi utilisateur ${userIndex + 1}`)
    
    // 2. Récupérer les utilisateurs (si admin)
    if (user.role === 'admin') {
      const usersOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/users',
        method: 'GET'
      }
      
      await makeRequest(usersOptions)
      console.log(`📋 Consultation utilisateurs - Utilisateur ${userIndex + 1}`)
    }
    
    // 3. Récupérer les sections
    const sectionsOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/sections',
      method: 'GET'
    }
    
    await makeRequest(sectionsOptions)
    console.log(`📋 Consultation sections - Utilisateur ${userIndex + 1}`)
    
    // 4. Simuler la navigation (plusieurs requêtes)
    for (let i = 0; i < 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
      
      // Requête aléatoire
      const randomRequests = [
        { path: '/api/users', method: 'GET' },
        { path: '/api/sections', method: 'GET' },
        { path: '/api/users', method: 'GET' }
      ]
      
      const randomRequest = randomRequests[Math.floor(Math.random() * randomRequests.length)]
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: randomRequest.path,
        method: randomRequest.method
      }
      
      await makeRequest(options)
    }
    
    console.log(`✅ Scénario terminé - Utilisateur ${userIndex + 1}`)
    
  } catch (error) {
    console.log(`❌ Erreur utilisateur ${userIndex + 1}:`, error.message)
  }
}

// Fonction principale de test
async function runLoadTest() {
  console.log('🚀 Démarrage du test de charge')
  console.log(`📊 Configuration:`)
  console.log(`   - Utilisateurs: ${config.users}`)
  console.log(`   - Durée: ${config.duration} secondes`)
  console.log(`   - Montée en charge: ${config.rampUp} secondes`)
  console.log('')
  
  const startTime = Date.now()
  const promises = []
  
  // Lancer les utilisateurs avec un délai progressif
  for (let i = 0; i < config.users; i++) {
    const delay = (config.rampUp / config.users) * i * 1000
    
    setTimeout(async () => {
      const user = testUsers[i % testUsers.length]
      await runUserScenario(user, i)
    }, delay)
  }
  
  // Attendre la fin du test
  setTimeout(() => {
    printResults()
    process.exit(0)
  }, config.duration * 1000)
}

// Afficher les résultats
function printResults() {
  const duration = (Date.now() - metrics.startTime) / 1000
  const avgResponseTime = metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length
  const maxResponseTime = Math.max(...metrics.responseTimes)
  const minResponseTime = Math.min(...metrics.responseTimes)
  const errorRate = (metrics.errors / metrics.requests) * 100
  
  console.log('')
  console.log('📊 RÉSULTATS DU TEST DE CHARGE')
  console.log('================================')
  console.log(`⏱️  Durée: ${duration.toFixed(2)} secondes`)
  console.log(`📈 Requêtes totales: ${metrics.requests}`)
  console.log(`❌ Erreurs: ${metrics.errors} (${errorRate.toFixed(2)}%)`)
  console.log(`⚡ Temps de réponse moyen: ${avgResponseTime.toFixed(2)}ms`)
  console.log(`🚀 Temps de réponse max: ${maxResponseTime}ms`)
  console.log(`🏃 Temps de réponse min: ${minResponseTime}ms`)
  console.log(`📊 Requêtes/seconde: ${(metrics.requests / duration).toFixed(2)}`)
  
  // Analyse des performances
  console.log('')
  console.log('📋 ANALYSE DES PERFORMANCES')
  console.log('============================')
  
  if (errorRate > 5) {
    console.log('❌ Taux d\'erreur élevé (>5%) - Vérifiez les logs du serveur')
  } else {
    console.log('✅ Taux d\'erreur acceptable')
  }
  
  if (avgResponseTime > 2000) {
    console.log('❌ Temps de réponse élevé (>2s) - Optimisation nécessaire')
  } else if (avgResponseTime > 1000) {
    console.log('⚠️  Temps de réponse modéré (>1s) - Surveillance recommandée')
  } else {
    console.log('✅ Temps de réponse excellent')
  }
  
  if (maxResponseTime > 5000) {
    console.log('❌ Temps de réponse maximum élevé (>5s) - Goulots d\'étranglement détectés')
  } else {
    console.log('✅ Temps de réponse maximum acceptable')
  }
}

// Gestion des signaux pour arrêt propre
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrompu par l\'utilisateur')
  printResults()
  process.exit(0)
})

// Démarrer le test
runLoadTest().catch(console.error)
