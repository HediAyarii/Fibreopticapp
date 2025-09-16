"use client"

import React, { useState } from 'react'
import { Bell, X, AlertTriangle, CreditCard, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { usePollingNotifications, NotificationData } from '@/hooks/usePollingNotifications'

interface NotificationCenterProps {
  employeeId: number
}

export function NotificationCenter({ employeeId }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { 
    notifications, 
    connected, 
    markAsRead, 
    removeNotification, 
    clearAllNotifications,
    permissionGranted 
  } = usePollingNotifications({ 
    employeeId,
    onNotification: (notification) => {
      console.log('Nouvelle notification reçue:', notification)
    }
  })

  const unreadCount = notifications.filter(n => !n.read).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reclamation':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />
      case 'penalite':
        return <CreditCard className="w-5 h-5 text-red-500" />
      default:
        return <Bell className="w-5 h-5 text-blue-500" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'reclamation':
        return 'border-orange-200 bg-orange-50'
      case 'penalite':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-blue-200 bg-blue-50'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)}h`
    return date.toLocaleDateString('fr-FR')
  }

  return (
    <div className="relative">
      {/* Bouton de notification */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Panneau de notifications */}
      {isOpen && (
        <Card className="absolute right-0 top-12 w-96 z-50 shadow-lg border border-white/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
                {connected ? (
                  <Badge variant="default" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Connecté
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Déconnecté
                  </Badge>
                )}
              </CardTitle>
              <div className="flex gap-1">
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllNotifications}
                    className="text-xs"
                  >
                    Tout effacer
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {!permissionGranted && (
              <CardDescription className="text-orange-600 text-sm">
                ⚠️ Activez les notifications du navigateur pour recevoir des alertes
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune notification</p>
                  <p className="text-sm">Vous recevrez des alertes ici</p>
                </div>
              ) : (
                <div className="space-y-2 p-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border transition-all hover:shadow-sm ${getNotificationColor(notification.type)} ${
                        !notification.read ? 'ring-2 ring-primary/20' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-sm">
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">
                                {formatTimestamp(notification.timestamp)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeNotification(notification.id)}
                                className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          
                          {/* Détails spécifiques */}
                          {notification.type === 'reclamation' && (
                            <div className="text-xs space-y-1">
                              <p><strong>Type:</strong> {notification.data.type_reclamation}</p>
                              <p><strong>Délai:</strong> {notification.data.delai_resolution} jours</p>
                              {notification.data.intervention_client && (
                                <p><strong>Client:</strong> {notification.data.intervention_client}</p>
                              )}
                            </div>
                          )}
                          
                          {notification.type === 'penalite' && (
                            <div className="text-xs space-y-1">
                              <p><strong>Montant:</strong> {notification.data.montant}€</p>
                              <p><strong>Type:</strong> {notification.data.type_penalite}</p>
                              {notification.data.intervention_num && (
                                <p><strong>Intervention:</strong> {notification.data.intervention_num}</p>
                              )}
                            </div>
                          )}
                          
                          {!notification.read && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="mt-2 h-6 text-xs"
                            >
                              Marquer comme lu
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
