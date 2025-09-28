'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, BellOff, Smartphone, Wifi, WifiOff, AlertCircle } from 'lucide-react'

interface SimpleNotificationManagerProps {
  employeeId: number
}

export function SimpleNotificationManager({ employeeId }: SimpleNotificationManagerProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Vérifier la permission de notification
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }

    // Vérifier la connexion réseau
    setIsOnline(navigator.onLine)
    window.addEventListener('online', () => setIsOnline(true))
    window.addEventListener('offline', () => setIsOnline(false))

    return () => {
      window.removeEventListener('online', () => setIsOnline(true))
      window.removeEventListener('offline', () => setIsOnline(false))
    }
  }, [])

  const requestPermission = async () => {
    if (!('Notification' in window)) return

    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)
      
      if (permission === 'granted') {
        // Envoyer une notification de test
        new Notification('FinalFibre - Notifications Activées', {
          body: 'Vous recevrez maintenant des notifications pour les pénalités et réclamations.',
          icon: '/placeholder-logo.png',
          tag: 'finalfibre-notification'
        })
      }
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error)
    }
  }

  const testNotification = async () => {
    if (permission === 'granted') {
      try {
        new Notification('FinalFibre - Test Notification', {
          body: 'Ceci est une notification de test depuis FinalFibre',
          icon: '/placeholder-logo.png',
          tag: 'finalfibre-test'
        })
      } catch (error) {
        console.error('Erreur lors de l\'envoi de la notification:', error)
      }
    }
  }

  const sendReclamationNotification = async (title: string, body: string) => {
    if (permission === 'granted') {
      try {
        new Notification(`🚨 ${title}`, {
          body: body,
          icon: '/placeholder-logo.png',
          tag: 'finalfibre-reclamation',
          requireInteraction: true
        })
      } catch (error) {
        console.error('Erreur lors de l\'envoi de la notification de réclamation:', error)
      }
    }
  }

  const sendPenaltyNotification = async (title: string, body: string) => {
    if (permission === 'granted') {
      try {
        new Notification(`⚠️ ${title}`, {
          body: body,
          icon: '/placeholder-logo.png',
          tag: 'finalfibre-penalty',
          requireInteraction: true
        })
      } catch (error) {
        console.error('Erreur lors de l\'envoi de la notification de pénalité:', error)
      }
    }
  }

  if (!('Notification' in window)) {
    return (
      <Card className="glass-card border border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="w-5 h-5 text-red-500" />
            Notifications Non Supportées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Votre navigateur ne supporte pas les notifications. 
            Veuillez utiliser un navigateur moderne.
          </p>
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
            <span className="hidden sm:inline">Notifications Simples</span>
            <span className="sm:hidden">Simples</span>
          </div>
          <div className="flex gap-2 sm:ml-auto">
            <Badge variant={isOnline ? "default" : "destructive"} className="flex items-center gap-1 text-xs">
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span className="hidden sm:inline">{isOnline ? 'En ligne' : 'Hors ligne'}</span>
            </Badge>
            <Badge variant={permission === 'granted' ? "default" : "secondary"} className="text-xs">
              {permission === 'granted' ? 'Activé' : 'Désactivé'}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
        <div className="space-y-2">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Recevez des notifications pour les pénalités et réclamations.
          </p>
          
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Smartphone className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Compatible avec tous les navigateurs modernes</span>
          </div>
        </div>

        <div className="space-y-3">
          {permission === 'default' && (
            <Button onClick={requestPermission} className="w-full text-sm">
              <Bell className="w-4 h-4 mr-2" />
              Activer les Notifications
            </Button>
          )}

          {permission === 'granted' && (
            <div className="space-y-2">
              <Button onClick={testNotification} variant="outline" className="w-full text-sm">
                <Bell className="w-4 h-4 mr-2" />
                Tester la Notification
              </Button>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button 
                  onClick={() => sendReclamationNotification('Nouvelle Réclamation', 'Vous avez une nouvelle réclamation à traiter')} 
                  variant="outline" 
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50 text-xs sm:text-sm"
                >
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Test Réclamation
                </Button>
                
                <Button 
                  onClick={() => sendPenaltyNotification('Nouvelle Pénalité', 'Vous avez une nouvelle pénalité à traiter')} 
                  variant="outline" 
                  size="sm"
                  className="text-orange-600 border-orange-200 hover:bg-orange-50 text-xs sm:text-sm"
                >
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Test Pénalité
                </Button>
              </div>
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
          <p>• Fonctionne même hors ligne</p>
          <p>• Compatible avec tous les appareils</p>
          <p>• Notifications instantanées</p>
        </div>
      </CardContent>
    </Card>
  )
}
