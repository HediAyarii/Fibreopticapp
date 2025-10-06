'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, BellOff, Smartphone, Wifi, WifiOff } from 'lucide-react'

interface NotificationManagerProps {
  employeeId: number
}

export function NotificationManager({ employeeId }: NotificationManagerProps) {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Vérifier le support des notifications
    const checkSupport = () => {
      const hasNotification = 'Notification' in window
      const hasServiceWorker = 'serviceWorker' in navigator
      const hasPushManager = 'PushManager' in window
      const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost'
      
      console.log('🔍 Vérification du support des notifications:')
      console.log('- Notification:', hasNotification)
      console.log('- ServiceWorker:', hasServiceWorker)
      console.log('- PushManager:', hasPushManager)
      console.log('- Secure Context:', isSecureContext)
      console.log('- Protocol:', location.protocol)
      console.log('- Hostname:', location.hostname)
      
      if (hasNotification && hasServiceWorker && hasPushManager) {
        setIsSupported(true)
        setPermission(Notification.permission)
      } else {
        setIsSupported(false)
        console.log('❌ Support des notifications insuffisant')
      }
    }

    checkSupport()

    // Vérifier la connexion réseau
    setIsOnline(navigator.onLine)
    window.addEventListener('online', () => setIsOnline(true))
    window.addEventListener('offline', () => setIsOnline(false))

    // Charger l'état de souscription existant
    loadSubscriptionState()

    return () => {
      window.removeEventListener('online', () => setIsOnline(true))
      window.removeEventListener('offline', () => setIsOnline(false))
    }
  }, [])

  const loadSubscriptionState = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const existingSubscription = await registration.pushManager.getSubscription()
      
      if (existingSubscription) {
        setSubscription(existingSubscription)
        setIsSubscribed(true)
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'état de souscription:', error)
    }
  }

  const requestPermission = async () => {
    if (!isSupported) return

    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)
      
      if (permission === 'granted') {
        await subscribeToPush()
      }
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error)
    }
  }

  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      
      // Configuration VAPID (clés publiques pour les notifications push)
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BLZZNzGYoo6KLhGm_qVQDIjPWcLZVYeWwPILUwBwaBKL7lEKUQ24f7CWR2GmFhaEiKU_jDDTLv9fo52Ym8xqmak'
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      })

      // Envoyer la souscription au serveur
      const response = await fetch('/api/push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          employeeId
        })
      })

      if (response.ok) {
        setSubscription(subscription)
        setIsSubscribed(true)
        console.log('✅ Souscription aux notifications push réussie')
      } else {
        console.error('❌ Erreur lors de l\'enregistrement de la souscription')
      }
    } catch (error) {
      console.error('Erreur lors de la souscription:', error)
    }
  }

  const unsubscribeFromPush = async () => {
    try {
      if (subscription) {
        await subscription.unsubscribe()
        
        // Supprimer la souscription du serveur
        await fetch('/api/push-subscription', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            employeeId
          })
        })

        setSubscription(null)
        setIsSubscribed(false)
        console.log('✅ Désabonnement des notifications push réussi')
      }
    } catch (error) {
      console.error('Erreur lors du désabonnement:', error)
    }
  }

  const testNotification = async () => {
    if (permission === 'granted') {
      try {
        await fetch('/api/test-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            employeeId,
            title: 'Test Notification',
            body: 'Ceci est une notification de test depuis FinalFibre',
            icon: '/placeholder-logo.png'
          })
        })
      } catch (error) {
        console.error('Erreur lors de l\'envoi de la notification de test:', error)
      }
    }
  }

  // Fonction utilitaire pour convertir la clé VAPID
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  if (!isSupported) {
    const hasNotification = 'Notification' in window
    const hasServiceWorker = 'serviceWorker' in navigator
    const hasPushManager = 'PushManager' in window
    const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost'
    
    return (
      <Card className="glass-card border border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="w-5 h-5 text-red-500" />
            Notifications Push Non Supportées
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Les notifications push ne sont pas disponibles sur votre appareil.
          </p>
          
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${hasNotification ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>API Notification: {hasNotification ? '✅ Supporté' : '❌ Non supporté'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${hasServiceWorker ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>Service Worker: {hasServiceWorker ? '✅ Supporté' : '❌ Non supporté'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${hasPushManager ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>Push Manager: {hasPushManager ? '✅ Supporté' : '❌ Non supporté'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isSecureContext ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>Contexte sécurisé: {isSecureContext ? '✅ OK' : '❌ Requis HTTPS'}</span>
            </div>
          </div>
          
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800 font-medium">Solutions :</p>
            <ul className="text-xs text-blue-700 mt-1 space-y-1">
              <li>• Utilisez Chrome, Firefox ou Safari récent</li>
              <li>• Activez JavaScript dans votre navigateur</li>
              <li>• Vérifiez que les notifications ne sont pas bloquées</li>
              <li>• En production, HTTPS est requis</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-card border border-white/20">
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm sm:text-base">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Notifications Push</span>
            <span className="sm:hidden">Push</span>
          </div>
          <div className="flex gap-2 sm:ml-auto">
            <Badge variant={isOnline ? "default" : "destructive"} className="flex items-center gap-1 text-xs">
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span className="hidden sm:inline">{isOnline ? 'En ligne' : 'Hors ligne'}</span>
            </Badge>
            <Badge variant={isSubscribed ? "default" : "secondary"} className="text-xs">
              {isSubscribed ? 'Activé' : 'Désactivé'}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
        <div className="space-y-2">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Recevez des notifications même quand votre téléphone est éteint ou en veille.
          </p>
          
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Smartphone className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Compatible mobile et desktop</span>
          </div>
        </div>

        <div className="space-y-3">
          {permission === 'default' && (
            <Button onClick={requestPermission} className="w-full text-sm">
              <Bell className="w-4 h-4 mr-2" />
              Activer les Notifications
            </Button>
          )}

          {permission === 'granted' && !isSubscribed && (
            <Button onClick={subscribeToPush} className="w-full text-sm">
              <Bell className="w-4 h-4 mr-2" />
              S'abonner aux Notifications
            </Button>
          )}

          {permission === 'granted' && isSubscribed && (
            <div className="space-y-2">
              <Button onClick={testNotification} variant="outline" className="w-full text-sm">
                <Bell className="w-4 h-4 mr-2" />
                Tester la Notification
              </Button>
              
              <Button onClick={unsubscribeFromPush} variant="destructive" className="w-full text-sm">
                <BellOff className="w-4 h-4 mr-2" />
                Désactiver les Notifications
              </Button>
            </div>
          )}

          {permission === 'denied' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-xs sm:text-sm text-red-800">
                Les notifications sont bloquées. Veuillez les autoriser dans les paramètres de votre navigateur.
              </p>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Les notifications fonctionnent même hors ligne</p>
          <p>• Compatible avec tous les appareils mobiles</p>
          <p>• Respecte votre vie privée</p>
        </div>
      </CardContent>
    </Card>
  )
}
