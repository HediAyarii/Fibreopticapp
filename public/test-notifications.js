// Script de test pour vérifier le support des notifications
console.log('🔍 Test du support des notifications push...\n')

// Vérifier les APIs
const checks = {
  'Notification API': 'Notification' in window,
  'Service Worker': 'serviceWorker' in navigator,
  'Push Manager': 'PushManager' in window,
  'Secure Context': window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost'
}

console.log('📋 Résultats des vérifications:')
console.log('='.repeat(50))

Object.entries(checks).forEach(([name, supported]) => {
  const status = supported ? '✅ Supporté' : '❌ Non supporté'
  console.log(`${name}: ${status}`)
})

console.log('='.repeat(50))

// Informations supplémentaires
console.log('\n📱 Informations du navigateur:')
console.log(`User Agent: ${navigator.userAgent}`)
console.log(`Protocol: ${location.protocol}`)
console.log(`Hostname: ${location.hostname}`)
console.log(`Port: ${location.port}`)

// Test de permission
if ('Notification' in window) {
  console.log(`\n🔔 Permission actuelle: ${Notification.permission}`)
  
  if (Notification.permission === 'default') {
    console.log('💡 Vous pouvez demander la permission avec Notification.requestPermission()')
  } else if (Notification.permission === 'granted') {
    console.log('✅ Les notifications sont autorisées!')
  } else {
    console.log('❌ Les notifications sont bloquées')
  }
}

// Test Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log(`\n🔧 Service Workers enregistrés: ${registrations.length}`)
    registrations.forEach((registration, index) => {
      console.log(`  ${index + 1}. ${registration.scope}`)
    })
  })
}

console.log('\n🎯 Recommandations:')
if (!checks['Secure Context']) {
  console.log('• HTTPS requis pour les notifications push en production')
}
if (!checks['Service Worker']) {
  console.log('• Service Worker requis pour les notifications push')
}
if (!checks['Push Manager']) {
  console.log('• Push Manager requis pour les notifications push')
}
if (Object.values(checks).every(Boolean)) {
  console.log('• Toutes les APIs sont supportées! Les notifications push devraient fonctionner.')
}
