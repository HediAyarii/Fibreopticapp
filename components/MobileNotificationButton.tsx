"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Bell, BellOff } from "lucide-react"

export function MobileNotificationButton() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isRequesting, setIsRequesting] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      return
    }

    setIsRequesting(true)
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      
      if (result === 'granted') {
        // Test notification
        new Notification('Notifications activées', {
          body: 'Vous recevrez maintenant des alertes pour vos interventions.',
          icon: '/placeholder-logo.png'
        })
      }
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error)
    } finally {
      setIsRequesting(false)
    }
  }

  if (permission === 'granted') {
    return (
      <Button
        variant="outline"
        size="sm"
        className="p-2 text-green-600 border-green-200 hover:bg-green-50"
        disabled
      >
        <Bell className="w-4 h-4" />
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={requestPermission}
      disabled={isRequesting}
      className="p-2 text-orange-600 border-orange-200 hover:bg-orange-50"
    >
      {isRequesting ? (
        <BellOff className="w-4 h-4 animate-pulse" />
      ) : (
        <BellOff className="w-4 h-4" />
      )}
    </Button>
  )
}





