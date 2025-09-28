"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Bell, BellOff, Smartphone } from "lucide-react"

export function MobilePushNotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
      checkSubscription()
    }
  }, [])

  const checkSubscription = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready
        const sub = await registration.pushManager.getSubscription()
        setSubscription(sub)
        setIsSubscribed(!!sub)
      } catch (error) {
        console.error('Erreur vérification souscription:', error)
      }
    }
  }

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Les notifications ne sont pas supportées sur cet appareil')
      return
    }

    setIsLoading(true)
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      
      if (result === 'granted') {
        await subscribeToPush()
      }
    } catch (error) {
      console.error('Erreur demande permission:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Les notifications push ne sont pas supportées')
      return
    }

    try {
      const registration = await navigator.serviceWorker.ready
      
      // Générer les clés VAPID (en production, utilisez des clés réelles)
      const vapidPublicKey = 'BCTx_XKKl40Yl4_XmF9ltBjyADCSWWsrs3o6nOX65S90nB2qzR9JXTvkBCoOrtod_5e04azaMSAxAzOt9JJIYxg'
      
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      })

      setSubscription(sub)
      setIsSubscribed(true)

      // Enregistrer la souscription sur le serveur
      await fetch('/api/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: sub,
          employeeId: 1 // ID du technicien connecté
        })
      })

      console.log('✅ Souscription push enregistrée')
      
      // Test notification
      new Notification('Notifications activées', {
        body: 'Vous recevrez maintenant des alertes sur votre écran de verrouillage',
        icon: '/placeholder-logo.png',
        badge: '/placeholder-logo.png',
        tag: 'finalfibre-notification',
        requireInteraction: true
      })

    } catch (error) {
      console.error('Erreur souscription push:', error)
      alert('Erreur lors de l\'activation des notifications')
    }
  }

  const unsubscribeFromPush = async () => {
    if (subscription) {
      try {
        await subscription.unsubscribe()
        setSubscription(null)
        setIsSubscribed(false)
        
        // Supprimer la souscription du serveur
        await fetch('/api/push-subscription', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId: 1 })
        })
        
        console.log('✅ Souscription push supprimée')
      } catch (error) {
        console.error('Erreur désinscription:', error)
      }
    }
  }

  const testNotification = () => {
    if (permission === 'granted') {
      new Notification('Test Notification', {
        body: 'Ceci est un test de notification pour l\'écran de verrouillage',
        icon: '/placeholder-logo.png',
        badge: '/placeholder-logo.png',
        tag: 'test-notification',
        requireInteraction: true,
        silent: false
      })
    }
  }

  if (permission === 'denied') {
    return (
      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
        <p className="text-sm text-red-800">
          Les notifications sont bloquées. Activez-les dans les paramètres de votre navigateur.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <Smartphone className="w-4 h-4" />
        <span>Notifications écran de verrouillage</span>
      </div>

      {permission === 'default' && (
        <Button 
          onClick={requestPermission} 
          className="w-full"
          disabled={isLoading}
        >
          <Bell className="w-4 h-4 mr-2" />
          {isLoading ? 'Activation...' : 'Activer les Notifications'}
        </Button>
      )}

      {permission === 'granted' && !isSubscribed && (
        <Button 
          onClick={subscribeToPush} 
          className="w-full"
        >
          <Bell className="w-4 h-4 mr-2" />
          S'abonner aux Notifications Push
        </Button>
      )}

      {permission === 'granted' && isSubscribed && (
        <div className="space-y-2">
          <Button 
            onClick={testNotification} 
            variant="outline" 
            className="w-full"
          >
            <Bell className="w-4 h-4 mr-2" />
            Tester la Notification
          </Button>
          
          <Button 
            onClick={unsubscribeFromPush} 
            variant="destructive" 
            className="w-full"
          >
            <BellOff className="w-4 h-4 mr-2" />
            Désactiver les Notifications
          </Button>
        </div>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Notifications sur l'écran de verrouillage</p>
        <p>• Fonctionne même quand l'app est fermée</p>
        <p>• Compatible avec tous les navigateurs mobiles</p>
      </div>
    </div>
  )
}

