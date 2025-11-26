"use client"

import { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

export interface NotificationData {
  id: string
  type: 'reclamation' | 'penalite'
  title: string
  message: string
  timestamp: string
  employeeId: number
  data: any
}

interface UseSocketIOProps {
  employeeId?: number
  onNotification?: (notification: NotificationData) => void
}

export function useSocketIO({ employeeId, onNotification }: UseSocketIOProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [permissionGranted, setPermissionGranted] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialiser l'audio pour les sons de notification
  useEffect(() => {
    audioRef.current = new Audio()
    audioRef.current.preload = 'auto'
  }, [])

  // Fonction pour jouer un son de notification
  const playNotificationSound = (type: 'reclamation' | 'penalite') => {
    if (!audioRef.current) return

    // Sons différents selon le type
    const soundUrl = type === 'reclamation' 
      ? '/sounds/reclamation.mp3' 
      : '/sounds/penalite.mp3'

    audioRef.current.src = soundUrl
    audioRef.current.volume = 0.7
    
    audioRef.current.play().catch(error => {
      console.log('Impossible de jouer le son:', error)
    })
  }

  // Fonction pour demander la permission de notification
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setPermissionGranted(permission === 'granted')
      return permission === 'granted'
    }
    return false
  }

  // Fonction pour afficher une notification du navigateur
  const showBrowserNotification = async (notification: NotificationData) => {
    if (!permissionGranted || !('Notification' in window)) return

    // Vérifier si un Service Worker est actif (pour éviter les notifications en double)
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration && registration.active) {
        // Service Worker actif, il gère déjà les notifications push
        console.log('⏭️ Service Worker actif, skip notification navigateur')
        return
      }
    }

    const browserNotification = new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: notification.id,
      requireInteraction: true,
      silent: false
    })

    // Fermer la notification après 5 secondes
    setTimeout(() => {
      browserNotification.close()
    }, 5000)

    // Gérer le clic sur la notification
    browserNotification.onclick = () => {
      window.focus()
      browserNotification.close()
    }
  }

  // Initialiser Socket.IO
  useEffect(() => {
    if (!employeeId) return

    // Déterminer l'URL du socket basée sur l'environnement
    // En production, utiliser le domaine actuel, en dev utiliser localhost
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin
      : 'http://localhost:3000'

    console.log('🔌 Connexion Socket.IO à:', socketUrl)

    const socketInstance = io(socketUrl, {
      path: '/api/socketio',
      transports: ['polling', 'websocket'],
      upgrade: true,
      rememberUpgrade: false,
      timeout: 20000,
      forceNew: true,
      secure: window.location.protocol === 'https:',
      rejectUnauthorized: false
    })

    // Gérer la connexion
    socketInstance.on('connect', () => {
      console.log('🔌 Connecté au serveur Socket.IO')
      setConnected(true)
      
      // S'authentifier avec l'ID de l'employé
      socketInstance.emit('authenticate', { employeeId })
    })

    // Gérer la déconnexion
    socketInstance.on('disconnect', () => {
      console.log('🔌 Déconnecté du serveur Socket.IO')
      setConnected(false)
    })

    // Gérer l'authentification
    socketInstance.on('authenticated', (data) => {
      console.log('✅ Authentification Socket.IO réussie:', data)
    })

    // Gérer les notifications
    socketInstance.on('notification', (notification: NotificationData) => {
      console.log('📨 Notification reçue:', notification)
      
      // Ajouter à la liste des notifications
      setNotifications(prev => [notification, ...prev.slice(0, 9)]) // Garder les 10 dernières
      
      // Jouer le son
      playNotificationSound(notification.type)
      
      // Afficher la notification du navigateur
      showBrowserNotification(notification)
      
      // Appeler le callback si fourni
      if (onNotification) {
        onNotification(notification)
      }
    })

    // Gérer les demandes de permission
    socketInstance.on('notification-permission-requested', () => {
      requestNotificationPermission()
    })

    // Ping/Pong pour maintenir la connexion (seulement si onglet actif)
    const pingInterval = setInterval(() => {
      if (socketInstance.connected && !document.hidden) {
        socketInstance.emit('ping')
      }
    }, 60000) // 60 secondes au lieu de 30

    setSocket(socketInstance)

    // Nettoyage
    return () => {
      clearInterval(pingInterval)
      socketInstance.disconnect()
    }
  }, [employeeId])

  // Demander la permission de notification au montage
  useEffect(() => {
    requestNotificationPermission()
  }, [])

  // Fonction pour marquer une notification comme lue
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    )
  }

  // Fonction pour supprimer une notification
  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
  }

  // Fonction pour supprimer toutes les notifications
  const clearAllNotifications = () => {
    setNotifications([])
  }

  return {
    socket,
    connected,
    notifications,
    permissionGranted,
    markAsRead,
    removeNotification,
    clearAllNotifications,
    requestNotificationPermission
  }
}
