"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Bell, BellOff, Smartphone } from "lucide-react"

export function LoginNotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
      setIsSupported(true)
    }
  }, [])

  const requestPermission = async () => {
    if (!isSupported) return

    setIsLoading(true)
    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)
      
      if (permission === 'granted') {
        // Demander à l'utilisateur de se connecter d'abord
        alert('Veuillez vous connecter d\'abord pour activer les notifications push. Les notifications seront automatiquement activées après la connexion.')
      }
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isSupported) {
    return (
      <div className="text-center py-2">
        <p className="text-xs text-gray-500">
          Notifications non supportées sur ce navigateur
        </p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {permission === 'granted' ? (
        <div className="flex items-center gap-2 text-green-600">
          <Bell className="w-4 h-4" />
          <span className="text-xs font-medium">Notifications autorisées</span>
        </div>
      ) : (
        <Button
          onClick={requestPermission}
          disabled={isLoading}
          size="sm"
          variant="outline"
          className="h-8 px-3 text-xs"
        >
          {isLoading ? (
            <>
              <div className="w-3 h-3 mr-1 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
              Activation...
            </>
          ) : (
            <>
              <Bell className="w-3 h-3 mr-1" />
              Autoriser
            </>
          )}
        </Button>
      )}
    </div>
  )
}
