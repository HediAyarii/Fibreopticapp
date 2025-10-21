// Script d'enregistrement du Service Worker
console.log('🔧 Enregistrement du Service Worker...')

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
      
      console.log('✅ Service Worker enregistré avec succès:', registration.scope)
      
      // Vérifier les mises à jour
      registration.addEventListener('updatefound', () => {
        console.log('🔄 Mise à jour du Service Worker disponible')
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 Nouveau Service Worker installé, rechargement...')
              window.location.reload()
            }
          })
        }
      })
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement du Service Worker:', error)
    }
  })
} else {
  console.log('❌ Service Worker non supporté')
}
