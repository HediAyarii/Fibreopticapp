// Service Worker pour les notifications push - Version 2
const CACHE_NAME = 'finalfibre-v2'

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installation v2')
  self.skipWaiting()
})

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activation v2')
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
    }).then(() => self.clients.claim())
  )
})

// Gestion des requêtes réseau
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // 1) Pas les POST/PUT/DELETE
  if (event.request.method !== 'GET') {
    return
  }

  // 2) Ne JAMAIS intercepter les navigations de pages (évite le bug Safari avec redirections)
  if (event.request.mode === 'navigate') {
    return
  }

  // 3) Ne pas toucher aux API ni à Next.js ni à la racine
  if (url.pathname.startsWith('/api/') || 
      url.pathname === '/' || 
      url.pathname.startsWith('/_next/')) {
    return
  }

  // 4) Cache-first pour le reste (images, CSS, fonts, etc.)
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        // Protection Safari: si la réponse est une redirection, fetch au lieu du cache
        if (response.redirected) {
          return fetch(event.request)
        }
        return response
      }
      return fetch(event.request).then((fetchResponse) => {
        // Mettre en cache uniquement les réponses OK
        if (fetchResponse && fetchResponse.status === 200) {
          const responseToCache = fetchResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return fetchResponse
      })
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
        title: 'Ouvrir'
      },
      {
        action: 'close',
        title: 'Fermer'
      }
    ]
  }

  // Si des données sont envoyées avec la notification
  if (event.data) {
    try {
      const data = event.data.json()
      console.log('📦 Service Worker: Données reçues', data)
      
      // Utiliser les données reçues pour construire la notification
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || notificationData.tag,
        requireInteraction: data.requireInteraction !== undefined ? data.requireInteraction : true,
        data: data.data || {},
        actions: notificationData.actions
      }
    } catch (error) {
      console.error('❌ Service Worker: Erreur parsing notification data', error)
      
      try {
        // Au cas où le backend envoie une string JSON
        const raw = event.data.text()
        const parsed = JSON.parse(raw)

        notificationData = {
          ...notificationData,
          title: parsed.title || notificationData.title,
          body: parsed.body || notificationData.body,
          icon: parsed.icon || notificationData.icon,
          badge: parsed.badge || notificationData.badge,
          tag: parsed.tag || notificationData.tag,
          data: parsed.data || {},
        }
      } catch (e2) {
        console.error('❌ Impossible de parser même comme string JSON:', e2)
        // Fallback lisible
        notificationData.body = 'Vous avez une nouvelle notification.'
      }
    }
  }

  // Afficher UNE SEULE notification
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  )
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
          if (client.url.includes('networkcom.paris') && 'focus' in client) {
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

// Gestion des messages depuis l'application
self.addEventListener('message', (event) => {
  console.log('💬 Service Worker: Message reçu', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
