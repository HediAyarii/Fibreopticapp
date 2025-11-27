"use client"

import { useEffect, useState, useRef } from 'react'

export interface NotificationData {
  id: string
  type: 'reclamation' | 'penalite'
  title: string
  message: string
  timestamp: string
  employeeId: number
  data: any
}

interface UsePollingNotificationsProps {
  employeeId?: number
  onNotification?: (notification: NotificationData) => void
}

export function usePollingNotifications({ employeeId, onNotification }: UsePollingNotificationsProps) {
  const [connected, setConnected] = useState(false)
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [permissionGranted, setPermissionGranted] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastCheckRef = useRef<string>('')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialiser l'audio pour les sons de notification
  useEffect(() => {
    audioRef.current = new Audio()
    audioRef.current.preload = 'auto'
  }, [])

  // Fonction pour jouer un son de notification
  const playNotificationSound = (type: 'reclamation' | 'penalite') => {
    try {
      // Essayer d'abord les fichiers audio personnalisés
      const soundUrl = type === 'reclamation' 
        ? '/sounds/reclamation.mp3' 
        : '/sounds/penalite.mp3'

      if (audioRef.current) {
        audioRef.current.src = soundUrl
        audioRef.current.volume = 0.7
        
        audioRef.current.play().catch(error => {
          console.log('Fichier audio personnalisé non trouvé, utilisation du son système:', error)
          // Fallback: utiliser le son système du navigateur
          playSystemSound(type)
        })
      } else {
        playSystemSound(type)
      }
    } catch (error) {
      console.log('Erreur lecture son personnalisé, utilisation du son système:', error)
      playSystemSound(type)
    }
  }

  // Fonction pour jouer un son système
  const playSystemSound = (type: 'reclamation' | 'penalite') => {
    try {
      // Créer un contexte audio pour générer un son simple
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Fréquence différente selon le type
      const frequency = type === 'reclamation' ? 800 : 600
      
      // Créer un oscillateur pour générer le son
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
      
      console.log(`🔊 Son système joué pour ${type}`)
    } catch (error) {
      console.log('Impossible de jouer le son système:', error)
    }
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
  const showBrowserNotification = (notification: NotificationData) => {
    if (!permissionGranted || !('Notification' in window)) return

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

  // Fonction pour vérifier les nouvelles notifications
  const checkForNotifications = async () => {
    if (!employeeId) return

    try {
      console.log(`🔍 Vérification notifications pour employé ${employeeId}`)
      
      // Utiliser fetchWithAuth pour les appels authentifiés
      const { fetchWithAuth } = await import('@/lib/authManager')
      
      // Vérifier les réclamations
      const reclamationsResponse = await fetchWithAuth(`/api/reclamations?employe_id=${employeeId}`)
      
      // Si la session a expiré, ne pas continuer
      if (!reclamationsResponse.ok) {
        console.log('Session expirée détectée dans usePollingNotifications')
        return
      }
      
      const reclamationsData = await reclamationsResponse.json()
      
      // Vérifier les pénalités
      const penalitesResponse = await fetchWithAuth(`/api/penalites?employe_id=${employeeId}`)
      
      // Si la session a expiré, ne pas continuer
      if (!penalitesResponse.ok) {
        console.log('Session expirée détectée dans usePollingNotifications')
        return
      }
      
      const penalitesData = await penalitesResponse.json()

      console.log(`📊 Réclamations: ${reclamationsData.reclamations?.length || 0}, Pénalités: ${penalitesData.penalites?.length || 0}`)

      // Créer un identifiant unique pour cette vérification basé sur les IDs des éléments
      const currentCheck = JSON.stringify({
        reclamations: reclamationsData.reclamations?.map((r: any) => r.id).sort() || [],
        penalites: penalitesData.penalites?.map((p: any) => p.id).sort() || [],
        timestamp: new Date().toISOString()
      })

      // Si c'est la première vérification, juste stocker l'état
      if (!lastCheckRef.current) {
        lastCheckRef.current = currentCheck
        setConnected(true)
        console.log('✅ Première vérification terminée')
        return
      }

      // Comparer avec l'état précédent
      if (currentCheck !== lastCheckRef.current) {
        const previousState = JSON.parse(lastCheckRef.current)
        const currentState = JSON.parse(currentCheck)

        console.log('🆕 Changements détectés!')

        // Vérifier les nouvelles réclamations
        const newReclamationIds = currentState.reclamations.filter((id: number) => !previousState.reclamations.includes(id))
        if (newReclamationIds.length > 0) {
          console.log(`📨 ${newReclamationIds.length} nouvelle(s) réclamation(s) détectée(s)`)
          
          newReclamationIds.forEach((reclamationId: number) => {
            const reclamation = reclamationsData.reclamations.find((r: any) => r.id === reclamationId)
            if (reclamation) {
              const notification: NotificationData = {
                id: `reclamation_${reclamation.id}_${Date.now()}`,
                type: 'reclamation',
                title: '🚨 Nouvelle Réclamation',
                message: `Réclamation ${reclamation.numero_reclamation} - ${reclamation.type_reclamation}`,
                timestamp: reclamation.created_at,
                employeeId,
                data: {
                  numero_reclamation: reclamation.numero_reclamation,
                  type_reclamation: reclamation.type_reclamation,
                  description: reclamation.description_probleme,
                  delai_resolution: reclamation.type_reclamation === 'Client' ? 7 : 14,
                  intervention_client: reclamation.intervention_client
                }
              }

              // Ajouter à la liste des notifications
              setNotifications(prev => [notification, ...prev.slice(0, 9)])
              
              // Jouer le son
              playNotificationSound('reclamation')
              
              // Afficher la notification du navigateur
              showBrowserNotification(notification)
              
              // Appeler le callback si fourni
              if (onNotification) {
                onNotification(notification)
              }
            }
          })
        }

        // Vérifier les nouvelles pénalités
        const newPenaliteIds = currentState.penalites.filter((id: number) => !previousState.penalites.includes(id))
        if (newPenaliteIds.length > 0) {
          console.log(`💰 ${newPenaliteIds.length} nouvelle(s) pénalité(s) détectée(s)`)
          
          newPenaliteIds.forEach((penaliteId: number) => {
            const penalite = penalitesData.penalites.find((p: any) => p.id === penaliteId)
            if (penalite) {
              const notification: NotificationData = {
                id: `penalite_${penalite.id}_${Date.now()}`,
                type: 'penalite',
                title: '💰 Nouvelle Pénalité',
                message: `Pénalité de ${penalite.montant}€ - ${penalite.type_penalite}`,
                timestamp: penalite.created_at,
                employeeId,
                data: {
                  montant: penalite.montant,
                  type_penalite: penalite.type_penalite,
                  motif: penalite.motif,
                  intervention_num: penalite.num_inter
                }
              }

              // Ajouter à la liste des notifications
              setNotifications(prev => [notification, ...prev.slice(0, 9)])
              
              // Jouer le son
              playNotificationSound('penalite')
              
              // Afficher la notification du navigateur
              showBrowserNotification(notification)
              
              // Appeler le callback si fourni
              if (onNotification) {
                onNotification(notification)
              }
            }
          })
        }

        lastCheckRef.current = currentCheck
      }

      setConnected(true)
    } catch (error) {
      console.error('Erreur vérification notifications:', error)
      setConnected(false)
    }
  }

  // Initialiser le polling
  useEffect(() => {
    if (!employeeId) return

    // Vérification immédiate
    checkForNotifications()

    // Polling toutes les 30 secondes (optimisé pour performance)
    intervalRef.current = setInterval(() => {
      if (!document.hidden) { // Seulement si l'onglet est actif
        checkForNotifications()
      }
    }, 30000)

    // Nettoyage
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setConnected(false)
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
    connected,
    notifications,
    permissionGranted,
    markAsRead,
    removeNotification,
    clearAllNotifications,
    requestNotificationPermission
  }
}
