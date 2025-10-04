// Test script pour la synchronisation automatique
console.log('🧪 Test de la synchronisation automatique...')

// Simuler un événement de mise à jour d'affectation
const testAutoSync = () => {
  console.log('📡 Déclenchement de l\'événement material-assignment-updated...')
  window.dispatchEvent(new CustomEvent('material-assignment-updated'))
  
  setTimeout(() => {
    console.log('📡 Déclenchement de l\'événement material-updated...')
    window.dispatchEvent(new CustomEvent('material-updated'))
  }, 1000)
  
  setTimeout(() => {
    console.log('📡 Déclenchement de l\'événement employee-updated...')
    window.dispatchEvent(new CustomEvent('employee-updated'))
  }, 2000)
}

// Attendre que la page soit chargée
if (typeof window !== 'undefined') {
  setTimeout(testAutoSync, 2000)
} else {
  console.log('⚠️ Ce script doit être exécuté dans un navigateur')
}
