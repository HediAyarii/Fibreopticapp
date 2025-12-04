import { Server as NetServer } from 'http'
import { NextRequest } from 'next/server'
import { Server as SocketIOServer } from 'socket.io'

// Interface pour les notifications
export interface NotificationData {
  id: string
  type: 'reclamation' | 'penalite'
  title: string
  message: string
  timestamp: string
  employeeId: number
  data: any
}

// Interface pour les données de réclamation
export interface ReclamationNotificationData {
  numero_reclamation: string
  type_reclamation: string
  description: string
  delai_resolution: number
  intervention_client?: string
}

// Interface pour les données de pénalité
export interface PenaliteNotificationData {
  montant: number
  type_penalite: string
  motif: string
  intervention_num?: string
}

// Stockage des connexions par employé
const employeeConnections = new Map<number, Set<string>>()

// Instance Socket.IO globale
let io: SocketIOServer | null = null

// Déclaration TypeScript pour la variable globale
declare global {
  var socketIOInstance: SocketIOServer | undefined
}

/**
 * Initialise Socket.IO avec le serveur HTTP
 */
export function initializeSocketIO(server: NetServer) {
  if (io) return io
  
  // Vérifier si Socket.IO est déjà initialisé globalement
  if (global.socketIOInstance) {
    io = global.socketIOInstance
    console.log('🔌 Instance Socket.IO récupérée depuis global')
    return io
  }

  console.log('🔌 Initialisation du serveur Socket.IO...')
  
  // Configuration CORS dynamique basée sur l'environnement
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [
        process.env.NEXT_PUBLIC_APP_URL || 'https://tech.networkcom.paris',
        'https://tech.networkcom.paris',
        'http://localhost:3000'
      ]
    : [
        'http://localhost:3000',
        'http://127.0.0.1:3000'
      ]

  console.log('🔐 CORS autorisés:', allowedOrigins)
  
  io = new SocketIOServer(server, {
    path: '/api/socketio',
    addTrailingSlash: false,
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true
    },
    // Configuration pour reverse proxy
    transports: ['polling', 'websocket'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
  })

  io.on('connection', (socket) => {
    console.log('🔌 Nouvelle connexion Socket.IO:', socket.id)

    // Écouter l'authentification de l'employé
    socket.on('authenticate', (data: { employeeId: number }) => {
      const { employeeId } = data
      
      if (!employeeConnections.has(employeeId)) {
        employeeConnections.set(employeeId, new Set())
      }
      
      employeeConnections.get(employeeId)!.add(socket.id)
      socket.data.employeeId = employeeId
      
      console.log(`👤 Employé ${employeeId} connecté avec socket ${socket.id}`)
      
      // Confirmer l'authentification
      socket.emit('authenticated', { 
        success: true, 
        employeeId,
        message: 'Authentification réussie' 
      })
    })

    // Écouter les demandes de permission de notification
    socket.on('request-notification-permission', async () => {
      socket.emit('notification-permission-requested', {
        message: 'Demande de permission envoyée au navigateur'
      })
    })

    // Gérer la déconnexion
    socket.on('disconnect', () => {
      console.log('🔌 Déconnexion Socket.IO:', socket.id)
      
      if (socket.data.employeeId) {
        const employeeId = socket.data.employeeId
        const connections = employeeConnections.get(employeeId)
        
        if (connections) {
          connections.delete(socket.id)
          
          if (connections.size === 0) {
            employeeConnections.delete(employeeId)
          }
        }
        
        console.log(`👤 Employé ${employeeId} déconnecté`)
      }
    })

    // Ping/Pong pour maintenir la connexion
    socket.on('ping', () => {
      socket.emit('pong')
    })
  })

  // Stocker l'instance globalement
  global.socketIOInstance = io
  
  console.log('✅ Serveur Socket.IO initialisé et stocké globalement')
  return io
}

/**
 * Récupère l'instance Socket.IO
 */
export function getSocketIOServer(): SocketIOServer | null {
  // Essayer d'abord la variable locale, puis la globale
  if (io) return io
  if (global.socketIOInstance) {
    io = global.socketIOInstance
    return io
  }
  return null
}

/**
 * Envoie une notification de réclamation à un employé
 */
export function sendReclamationNotification(
  employeeId: number, 
  reclamationData: ReclamationNotificationData
): boolean {
  if (!io) {
    console.warn('⚠️ Socket.IO non initialisé')
    return false
  }

  const connections = employeeConnections.get(employeeId)
  if (!connections || connections.size === 0) {
    console.log(`⚠️ Aucune connexion trouvée pour l'employé ${employeeId}`)
    return false
  }

  const notification: NotificationData = {
    id: `reclamation_${Date.now()}`,
    type: 'reclamation',
    title: '🚨 Nouvelle Réclamation',
    message: `Réclamation ${reclamationData.numero_reclamation} - ${reclamationData.type_reclamation}`,
    timestamp: new Date().toISOString(),
    employeeId,
    data: reclamationData
  }

  // Envoyer à toutes les connexions de l'employé
  connections.forEach(socketId => {
    io!.to(socketId).emit('notification', notification)
  })

  console.log(`📨 Notification réclamation envoyée à l'employé ${employeeId}`)
  return true
}

/**
 * Envoie une notification de pénalité à un employé
 */
export function sendPenaliteNotification(
  employeeId: number, 
  penaliteData: PenaliteNotificationData
): boolean {
  if (!io) {
    console.warn('⚠️ Socket.IO non initialisé')
    return false
  }

  const connections = employeeConnections.get(employeeId)
  if (!connections || connections.size === 0) {
    console.log(`⚠️ Aucune connexion trouvée pour l'employé ${employeeId}`)
    return false
  }

  const notification: NotificationData = {
    id: `penalite_${Date.now()}`,
    type: 'penalite',
    title: '💰 Nouvelle Pénalité',
    message: `Pénalité de ${penaliteData.montant}€ - ${penaliteData.type_penalite}`,
    timestamp: new Date().toISOString(),
    employeeId,
    data: penaliteData
  }

  // Envoyer à toutes les connexions de l'employé
  connections.forEach(socketId => {
    io!.to(socketId).emit('notification', notification)
  })

  console.log(`📨 Notification pénalité envoyée à l'employé ${employeeId}`)
  return true
}

/**
 * Envoie une notification de création de réclamation technique
 */
export function sendReclamationTechniqueCreated(reclamation: any): boolean {
  // Essayer plusieurs sources pour l'instance Socket.IO
  const socketIO = io || global.socketIOInstance
  
  if (!socketIO) {
    console.warn('⚠️ Socket.IO non initialisé - io:', !!io, 'global:', !!global.socketIOInstance)
    return false
  }

  // Broadcast à tous les clients connectés
  socketIO.emit('reclamation_technique_created', reclamation)
  console.log(`✅ Événement reclamation_technique_created émis via Socket.IO pour réclamation ID: ${reclamation.id}`)
  return true
}

/**
 * Envoie une notification de mise à jour de réclamation technique
 */
export function sendReclamationTechniqueUpdated(reclamation: any): boolean {
  // Essayer plusieurs sources pour l'instance Socket.IO
  const socketIO = io || global.socketIOInstance
  
  if (!socketIO) {
    console.warn('⚠️ Socket.IO non initialisé - io:', !!io, 'global:', !!global.socketIOInstance)
    return false
  }

  // Obtenir le nombre de clients connectés
  const connectedSockets = socketIO.sockets.sockets.size
  console.log(`📡 Broadcasting reclamation_technique_updated à ${connectedSockets} client(s) connecté(s)`)

  // Broadcast à tous les clients connectés
  socketIO.emit('reclamation_technique_updated', reclamation)
  console.log(`✅ Événement reclamation_technique_updated émis via Socket.IO pour réclamation ID: ${reclamation.id}`, {
    id: reclamation.id,
    statut: reclamation.statut,
    technicien_id: reclamation.technicien_id
  })
  return true
}

/**
 * Obtient le nombre de connexions actives par employé
 */
export function getActiveConnections(): { [employeeId: number]: number } {
  const result: { [employeeId: number]: number } = {}
  
  employeeConnections.forEach((connections, employeeId) => {
    result[employeeId] = connections.size
  })
  
  return result
}