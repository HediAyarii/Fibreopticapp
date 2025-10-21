// Service Worker pour les notifications push
const CACHE_NAME = 'finalfibre-v1'
const urlsToCache = [
  '/',
  '/logintech',
  '/technicien/dashboard',
  '/manifest.json'
]

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installation')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Cache ouvert')
        return cache.addAll(urlsToCache)
      })
  )
})

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activation')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Suppression ancien cache', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Gestion des requêtes réseau
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retourner la réponse du cache si disponible
        if (response) {
          return response
        }
        return fetch(event.request)
      })
  )
})

// Gestion des notifications push
self.addEventListener('push', (event) => {
  console.log('📱 Service Worker: Notification push reçue')
  
  let notificationData = {
    title: 'FinalFibre',
    body: 'Nouvelle notification',
    icon: '/placeholder-logo.png',
    badge: '/placeholder-logo.png',
    tag: 'finalfibre-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Ouvrir',
        icon: '/placeholder-logo.png'
      },
      {
        action: 'close',
        title: 'Fermer',
        icon: '/placeholder-logo.png'
      }
    ]
  }

  // Si des données sont envoyées avec la notification
  if (event.data) {
    try {
      const data = event.data.json()
      notificationData = {
        ...notificationData,
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        data: data.data || {}
      }
    } catch (error) {
      console.error('❌ Service Worker: Erreur parsing notification data', error)
    }
  }

  const notificationPromise = self.registration.showNotification(
    notificationData.title,
    notificationData
  )

  event.waitUntil(notificationPromise)
})

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Service Worker: Clic sur notification', event.action)
  
  event.notification.close()

  if (event.action === 'close') {
    return
  }

  // Ouvrir l'application
  const urlToOpen = event.notification.data?.url || '/technicien/dashboard'
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Chercher une fenêtre ouverte
        for (const client of clientList) {
          if (client.url.includes('finalfibre') && 'focus' in client) {
            return client.focus()
          }
        }
        
        // Ouvrir une nouvelle fenêtre si aucune n'est ouverte
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

// Gestion des erreurs
self.addEventListener('error', (event) => {
  console.error('❌ Service Worker: Erreur', event.error)
})

// Gestion des notifications push
self.addEventListener('push', (event) => {
  console.log('🔔 Service Worker: Notification push reçue', event.data)
  
  const options = {
    body: event.data ? event.data.text() : 'Nouvelle notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'finalfibre-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Ouvrir'
      },
      {
        action: 'close',
        title: 'Fermer'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('FinalFibre', options)
  )
})

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Service Worker: Clic sur notification', event.action)
  
  event.notification.close()
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/logintech')
    )
  }
})

// Gestion des messages depuis l'application
self.addEventListener('message', (event) => {
  console.log('💬 Service Worker: Message reçu', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
