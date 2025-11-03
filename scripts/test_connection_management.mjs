#!/usr/bin/env node

import { getPool, closePool, monitorConnections, cleanupOrphanedConnections } from '../lib/database.js'

async function testConnectionManagement() {
  console.log('🧪 Test de la gestion des connexions PostgreSQL...')
  
  try {
    // Test 1: Création du pool
    console.log('\n📊 Test 1: Création du pool')
    const pool1 = getPool()
    console.log('   ✅ Pool créé')
    
    // Test 2: Vérification du singleton
    console.log('\n📊 Test 2: Vérification du singleton')
    const pool2 = getPool()
    console.log(`   ${pool1 === pool2 ? '✅' : '❌'} Singleton fonctionne: ${pool1 === pool2}`)
    
    // Test 3: Monitoring des connexions
    console.log('\n📊 Test 3: Monitoring des connexions')
    const stats = await monitorConnections()
    if (stats) {
      console.log(`   🔗 Connexions: ${stats.currentConnections}/${stats.maxConnections}`)
      console.log(`   🟢 Santé: ${stats.isHealthy ? 'OK' : 'ATTENTION'}`)
    }
    
    // Test 4: Simulation de requêtes
    console.log('\n📊 Test 4: Simulation de requêtes')
    for (let i = 0; i < 5; i++) {
      await pool1.query('SELECT NOW() as current_time')
      console.log(`   ✅ Requête ${i + 1} exécutée`)
    }
    
    // Test 5: Nettoyage des connexions orphelines
    console.log('\n📊 Test 5: Nettoyage des connexions orphelines')
    await cleanupOrphanedConnections()
    console.log('   ✅ Nettoyage terminé')
    
    // Test 6: Fermeture du pool
    console.log('\n📊 Test 6: Fermeture du pool')
    await closePool()
    console.log('   ✅ Pool fermé')
    
    // Test 7: Recréation après fermeture
    console.log('\n📊 Test 7: Recréation après fermeture')
    const pool3 = getPool()
    console.log('   ✅ Nouveau pool créé')
    
    // Test 8: Vérification finale
    console.log('\n📊 Test 8: Vérification finale')
    const finalStats = await monitorConnections()
    if (finalStats) {
      console.log(`   🔗 Connexions finales: ${finalStats.currentConnections}/${finalStats.maxConnections}`)
      console.log(`   🟢 Santé finale: ${finalStats.isHealthy ? 'OK' : 'ATTENTION'}`)
    }
    
    console.log('\n✅ Tous les tests sont passés!')
    console.log('\n💡 Conseils pour éviter les fuites de connexions:')
    console.log('   - Utilisez le pattern singleton global implémenté')
    console.log('   - Fermez toujours les pools dans vos tests')
    console.log('   - Surveillez les connexions avec le script de monitoring')
    console.log('   - Redémarrez le serveur de développement si nécessaire')
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error)
    process.exit(1)
  } finally {
    // Nettoyage final
    try {
      await closePool()
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage final:', error)
    }
  }
}

// Exécuter les tests
testConnectionManagement()


