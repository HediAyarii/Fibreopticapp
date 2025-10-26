#!/usr/bin/env node

import { monitorConnections, cleanupOrphanedConnections, getPoolStats } from '../lib/database.js'

async function startMonitoring() {
  console.log('🔍 Démarrage du monitoring des connexions PostgreSQL...')
  console.log('📊 Appuyez sur Ctrl+C pour arrêter\n')

  const monitor = async () => {
    try {
      const stats = await monitorConnections()
      const poolStats = getPoolStats()
      
      if (stats) {
        console.clear()
        console.log('📊 === MONITORING DES CONNEXIONS POSTGRESQL ===')
        console.log(`🕐 ${new Date().toLocaleString()}`)
        console.log('')
        
        // Statistiques globales
        console.log('📈 STATISTIQUES GLOBALES:')
        console.log(`   🔗 Connexions: ${stats.currentConnections}/${stats.maxConnections} (${stats.usagePercentage})`)
        console.log(`   ✅ Actives: ${stats.activeConnections}`)
        console.log(`   😴 Inactives: ${stats.idleConnections}`)
        console.log(`   ⏳ En transaction: ${stats.idleInTransactionConnections}`)
        console.log(`   🟢 Santé: ${stats.isHealthy ? 'OK' : '⚠️  ATTENTION'}`)
        console.log('')
        
        // Statistiques du pool
        if (poolStats) {
          console.log('🏊 STATISTIQUES DU POOL:')
          console.log(`   📊 Total: ${poolStats.totalCount}`)
          console.log(`   😴 Inactives: ${poolStats.idleCount}`)
          console.log(`   ⏳ En attente: ${poolStats.waitingCount}`)
          console.log('')
        }
        
        // Alertes
        if (!stats.isHealthy) {
          console.log('⚠️  ALERTE: Utilisation élevée des connexions!')
          console.log('🧹 Nettoyage automatique des connexions orphelines...')
          await cleanupOrphanedConnections()
        }
        
        console.log('💡 Conseils:')
        console.log('   - En développement, redémarrez le serveur si trop de connexions')
        console.log('   - Vérifiez que les pools sont bien fermés lors des hot reloads')
        console.log('   - Utilisez la fonction closePool() dans vos tests')
        
      } else {
        console.log('❌ Impossible de récupérer les statistiques')
      }
    } catch (error) {
      console.error('❌ Erreur lors du monitoring:', error)
    }
  }

  // Monitoring initial
  await monitor()
  
  // Monitoring toutes les 5 secondes
  const interval = setInterval(monitor, 5000)
  
  // Nettoyage à l'arrêt
  process.on('SIGINT', () => {
    console.log('\n🔄 Arrêt du monitoring...')
    clearInterval(interval)
    process.exit(0)
  })
}

// Démarrer le monitoring
startMonitoring().catch(console.error)
