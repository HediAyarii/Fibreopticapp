"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Bell, BellOff, Smartphone } from "lucide-react"

interface MobilePushNotificationManagerProps {
  employeeId?: number
}

export function MobilePushNotificationManager({ employeeId = 0 }: MobilePushNotificationManagerProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentEmployeeId, setCurrentEmployeeId] = useState(employeeId)

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
      checkSubscription()
    }
  }, [])

  // Vérifier l'état de la souscription quand l'employeeId change
  useEffect(() => {
    if (currentEmployeeId > 0) {
      checkSubscription()
    }
  }, [currentEmployeeId])

  // Mettre à jour l'ID employé quand il change
  useEffect(() => {
    setCurrentEmployeeId(employeeId)
  }, [employeeId])

  const checkSubscription = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready
        const sub = await registration.pushManager.getSubscription()
        setSubscription(sub)
        setIsSubscribed(!!sub)
        
        // Vérifier aussi l'état côté serveur si on a un employeeId
        if (currentEmployeeId > 0) {
          try {
            const response = await fetch(`/api/push-subscription?employee_id=${currentEmployeeId}`)
            const data = await response.json()
            console.log(`📱 Souscriptions serveur pour employé ${currentEmployeeId}: ${data.count}`)
            
            // Si on a une souscription locale mais pas côté serveur, on la réenregistre
            if (sub && data.count === 0) {
              console.log('🔄 Réenregistrement de la souscription côté serveur...')
              await fetch('/api/push-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  subscription: sub,
                  employeeId: currentEmployeeId
                })
              })
            }
          } catch (error) {
            console.error('Erreur vérification serveur:', error)
          }
        }
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
      
      // Utiliser les clés VAPID depuis les variables d'environnement
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BLZZNzGYoo6KLhGm_qVQDIjPWcLZVYeWwPILUwBwaBKL7lEKUQ24f7CWR2GmFhaEiKU_jDDTLv9fo52Ym8xqmak'
      
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      })

      setSubscription(sub)
      setIsSubscribed(true)

      // Si employeeId est 0, on ne peut pas enregistrer la souscription
      if (currentEmployeeId === 0) {
        console.log('⚠️ Impossible d\'enregistrer la souscription sans ID employé')
        console.log('💡 Veuillez vous connecter d\'abord pour activer les notifications')
        alert('Veuillez vous connecter d\'abord pour activer les notifications')
        return
      }

      // Enregistrer la souscription sur le serveur avec l'ID employé fourni
      console.log(`✅ Enregistrement souscription pour l'employé: ${currentEmployeeId}`)
      await fetch('/api/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: sub,
          employeeId: currentEmployeeId // ID du technicien connecté
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
        console.log(`✅ Désinscription pour l'employé: ${currentEmployeeId}`)
        await fetch('/api/push-subscription', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId: currentEmployeeId })
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
          <div className="p-2 bg-green-50 border border-green-200 rounded-md text-center">
            <p className="text-sm text-green-800 font-medium">
              ✅ Notifications Connectées
            </p>
            <p className="text-xs text-green-600">
              Vous recevrez des alertes sur votre écran de verrouillage
            </p>
          </div>
          
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
    </div>
  )
}

