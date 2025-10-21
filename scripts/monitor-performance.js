#!/usr/bin/env node

const http = require('http')

console.log('📊 MONITORING DES PERFORMANCES')
console.log('==============================')

// Configuration
const config = {
  target: 'http://localhost:3000',
  checkInterval: 5000, // Vérifier toutes les 5 secondes
  duration: 300000 // 5 minutes
}

// Métriques
const metrics = {
  checks: 0,
  successes: 0,
  errors: 0,
  responseTimes: [],
  startTime: Date.now()
}

// Fonction pour vérifier la santé du serveur
async function checkServerHealth() {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/sections',
      method: 'GET',
      timeout: 5000
    }
    
    const req = http.request(options, (res) => {
      const responseTime = Date.now() - startTime
      metrics.responseTimes.push(responseTime)
      metrics.checks++
      
      if (res.statusCode === 200) {
        metrics.successes++
        resolve({ status: 'OK', responseTime, statusCode: res.statusCode })
      } else {
        metrics.errors++
        resolve({ status: 'ERROR', responseTime, statusCode: res.statusCode })
      }
    })
    
    req.on('error', (error) => {
      metrics.errors++
      metrics.checks++
      resolve({ status: 'ERROR', responseTime: 0, error: error.message })
    })
    
    req.on('timeout', () => {
      metrics.errors++
      metrics.checks++
      resolve({ status: 'TIMEOUT', responseTime: 5000 })
    })
    
    req.end()
  })
}

// Fonction pour afficher les métriques
function displayMetrics() {
  const duration = (Date.now() - metrics.startTime) / 1000
  const avgResponseTime = metrics.responseTimes.length > 0 
    ? metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length 
    : 0
  const maxResponseTime = metrics.responseTimes.length > 0 ? Math.max(...metrics.responseTimes) : 0
  const minResponseTime = metrics.responseTimes.length > 0 ? Math.min(...metrics.responseTimes) : 0
  const successRate = metrics.checks > 0 ? (metrics.successes / metrics.checks) * 100 : 0
  const errorRate = metrics.checks > 0 ? (metrics.errors / metrics.checks) * 100 : 0
  
  console.clear()
  console.log('📊 MONITORING EN TEMPS RÉEL')
  console.log('============================')
  console.log(`⏱️  Durée: ${duration.toFixed(0)}s`)
  console.log(`🔍 Vérifications: ${metrics.checks}`)
  console.log(`✅ Succès: ${metrics.successes} (${successRate.toFixed(1)}%)`)
  console.log(`❌ Erreurs: ${metrics.errors} (${errorRate.toFixed(1)}%)`)
  console.log(`⚡ Temps moyen: ${avgResponseTime.toFixed(0)}ms`)
  console.log(`🚀 Temps max: ${maxResponseTime}ms`)
  console.log(`🏃 Temps min: ${minResponseTime}ms`)
  
  // Statut du serveur
  console.log('')
  console.log('🔧 STATUT DU SERVEUR')
  console.log('====================')
  
  if (errorRate > 10) {
    console.log('❌ Serveur instable - Erreurs fréquentes')
  } else if (errorRate > 5) {
    console.log('⚠️  Serveur dégradé - Quelques erreurs')
  } else {
    console.log('✅ Serveur stable')
  }
  
  if (avgResponseTime > 2000) {
    console.log('❌ Performance dégradée - Temps de réponse élevé')
  } else if (avgResponseTime > 1000) {
    console.log('⚠️  Performance modérée - Surveillance nécessaire')
  } else {
    console.log('✅ Performance excellente')
  }
  
  if (maxResponseTime > 5000) {
    console.log('❌ Goulots d\'étranglement détectés')
  } else {
    console.log('✅ Pas de goulots d\'étranglement')
  }
  
  console.log('')
  console.log('💡 RECOMMANDATIONS')
  console.log('==================')
  
  if (errorRate > 10) {
    console.log('• Redémarrez le serveur Next.js')
    console.log('• Vérifiez les logs d\'erreur')
    console.log('• Vérifiez la connexion à la base de données')
  } else if (avgResponseTime > 2000) {
    console.log('• Optimisez les requêtes SQL')
    console.log('• Ajoutez des index sur la base de données')
    console.log('• Augmentez les limites de connexions')
  } else {
    console.log('• Performance acceptable')
    console.log('• Vous pouvez lancer le test de charge')
  }
  
  console.log('')
  console.log('🔄 Prochaine vérification dans 5 secondes...')
  console.log('   (Ctrl+C pour arrêter)')
}

// Boucle de monitoring
async function startMonitoring() {
  console.log('🔧 Démarrage du monitoring...')
  console.log('')
  
  const interval = setInterval(async () => {
    const result = await checkServerHealth()
    
    if (result.status === 'OK') {
      console.log(`✅ ${new Date().toLocaleTimeString()} - OK (${result.responseTime}ms)`)
    } else {
      console.log(`❌ ${new Date().toLocaleTimeString()} - ${result.status} (${result.responseTime}ms)`)
    }
    
    displayMetrics()
  }, config.checkInterval)
  
  // Arrêter après la durée spécifiée
  setTimeout(() => {
    clearInterval(interval)
    console.log('')
    console.log('🏁 Monitoring terminé')
    displayMetrics()
    process.exit(0)
  }, config.duration)
}

// Gestion de l'arrêt
process.on('SIGINT', () => {
  console.log('\n🛑 Monitoring arrêté')
  displayMetrics()
  process.exit(0)
})

// Démarrer le monitoring
startMonitoring().catch(console.error)
