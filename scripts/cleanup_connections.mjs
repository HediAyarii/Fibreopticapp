#!/usr/bin/env node

import { cleanupOrphanedConnections, monitorConnections } from '../lib/database.js'

async function cleanupConnections() {
  console.log('🧹 Nettoyage des connexions PostgreSQL...')
  
  try {
    // Afficher l'état avant nettoyage
    console.log('\n📊 État avant nettoyage:')
    const statsBefore = await monitorConnections()
    if (statsBefore) {
      console.log(`   🔗 Connexions: ${statsBefore.currentConnections}/${statsBefore.maxConnections}`)
      console.log(`   ✅ Actives: ${statsBefore.activeConnections}`)
      console.log(`   😴 Inactives: ${statsBefore.idleConnections}`)
    }
    
    // Nettoyer les connexions orphelines
    console.log('\n🧹 Nettoyage en cours...')
    await cleanupOrphanedConnections()
    
    // Afficher l'état après nettoyage
    console.log('\n📊 État après nettoyage:')
    const statsAfter = await monitorConnections()
    if (statsAfter) {
      console.log(`   🔗 Connexions: ${statsAfter.currentConnections}/${statsAfter.maxConnections}`)
      console.log(`   ✅ Actives: ${statsAfter.activeConnections}`)
      console.log(`   😴 Inactives: ${statsAfter.idleConnections}`)
      
      const cleaned = (statsBefore?.currentConnections || 0) - statsAfter.currentConnections
      if (cleaned > 0) {
        console.log(`   ✅ ${cleaned} connexions orphelines nettoyées`)
      } else {
        console.log(`   ℹ️  Aucune connexion orpheline trouvée`)
      }
    }
    
    console.log('\n✅ Nettoyage terminé!')
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error)
    process.exit(1)
  }
}

// Exécuter le nettoyage
cleanupConnections()
