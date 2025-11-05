// Script de diagnostic pour identifier les Event Listeners
// Exécuter avec: node scripts/diagnose-listeners.mjs

import { EventEmitter } from 'events'

// Sauvegarder les méthodes originales
const originalOn = EventEmitter.prototype.on
const originalAddListener = EventEmitter.prototype.addListener

let listenerCount = {}

// Intercepter l'ajout de listeners
EventEmitter.prototype.on = function(event, listener) {
  const stack = new Error().stack
  const caller = stack.split('\n')[2]?.trim() || 'unknown'
  
  const key = `${event} from ${caller}`
  listenerCount[key] = (listenerCount[key] || 0) + 1
  
  return originalOn.call(this, event, listener)
}

EventEmitter.prototype.addListener = EventEmitter.prototype.on

// Afficher les statistiques après 5 secondes
setTimeout(() => {
  console.log('\n📊 Event Listeners Statistics:\n')
  
  const sorted = Object.entries(listenerCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
  
  sorted.forEach(([key, count]) => {
    console.log(`${count}x: ${key}`)
  })
  
  console.log('\n⚠️ Listeners with count > 10:')
  sorted
    .filter(([, count]) => count > 10)
    .forEach(([key, count]) => {
      console.log(`  ${count}x: ${key}`)
    })
}, 5000)

console.log('🔍 Diagnostic en cours... Attendez 5 secondes...')
