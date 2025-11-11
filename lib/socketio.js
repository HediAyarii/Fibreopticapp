const { Server: SocketIOServer } = require('socket.io')

// Interface pour les notifications
const NotificationData = {
  id: String,
  type: String, // 'reclamation' | 'penalite'
  title: String,
  message: String,
  timestamp: String,
  employeeId: Number,
  data: Object
}

// Stockage des connexions par employé
const employeeConnections = new Map()

// Instance Socket.IO globale
let io = null

// Rendre l'instance accessible globalement pour les routes API
if (typeof global !== 'undefined') {
  global.socketIOInstance = null;
}

/**
 * Initialise Socket.IO avec le serveur HTTP
 */
function initializeSocketIO(server) {
  if (io) return io

  console.log('🔌 Initialisation du serveur Socket.IO...')
  
  io = new SocketIOServer(server, {
    path: '/api/socketio',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  })

  io.on('connection', (socket) => {
    console.log('🔌 Nouvelle connexion Socket.IO:', socket.id)

    // Écouter l'authentification de l'employé
    socket.on('authenticate', (data) => {
      const { employeeId } = data
      
      if (!employeeConnections.has(employeeId)) {
        employeeConnections.set(employeeId, new Set())
      }
      
      employeeConnections.get(employeeId).add(socket.id)
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

    // Écouter les événements de réclamation technique depuis le client
    socket.on('reclamation_technique_created', (reclamation) => {
      console.log('📢 Broadcast reclamation_technique_created à tous les clients:', reclamation.id)
      // Broadcaster à TOUS les clients (y compris l'émetteur)
      io.emit('reclamation_technique_created', reclamation)
    })

    socket.on('reclamation_technique_updated', (reclamation) => {
      console.log('📢 Broadcast reclamation_technique_updated à tous les clients:', reclamation.id)
      // Broadcaster à TOUS les clients (y compris l'émetteur)
      io.emit('reclamation_technique_updated', reclamation)
    })
  })

  console.log('✅ Serveur Socket.IO initialisé')
  
  return io
}

/**
 * Récupère l'instance Socket.IO
 */
function getSocketIOServer() {
  if (!io) {
    console.warn('⚠️ Socket.IO non initialisé - io est null')
  }
  return io
}

/**
 * Envoie une notification de réclamation à un employé
 */
function sendReclamationNotification(employeeId, reclamationData) {
  if (!io) {
    console.warn('⚠️ Socket.IO non initialisé')
    return false
  }

  const connections = employeeConnections.get(employeeId)
  if (!connections || connections.size === 0) {
    console.log(`⚠️ Aucune connexion trouvée pour l'employé ${employeeId}`)
    return false
  }

  const notification = {
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
    io.to(socketId).emit('notification', notification)
  })

  console.log(`📨 Notification réclamation envoyée à l'employé ${employeeId}`)
  return true
}

/**
 * Envoie une notification de nouvelle réclamation technique (admin)
 */
function sendReclamationTechniqueCreated(reclamationData) {
  if (!io) {
    console.warn('⚠️ Socket.IO non initialisé')
    return false
  }

  // Émettre à tous les admins connectés
  io.emit('reclamation_technique_created', reclamationData)
  console.log(`📨 Nouvelle réclamation technique émise: ${reclamationData.num_inter}`)
  return true
}

/**
 * Envoie une notification de mise à jour de réclamation technique (technicien)
 */
function sendReclamationTechniqueUpdated(reclamationData) {
  if (!io) {
    console.warn('⚠️ Socket.IO non initialisé')
    return false
  }

  // Émettre à tous les clients concernés
  io.emit('reclamation_technique_updated', reclamationData)
  
  // Si un technicien spécifique, lui envoyer aussi une notification
  if (reclamationData.technicien_id) {
    const connections = employeeConnections.get(reclamationData.technicien_id)
    if (connections && connections.size > 0) {
      const notification = {
        id: `reclamation_tech_${Date.now()}`,
        type: 'reclamation_technique',
        title: '📝 Réponse Admin',
        message: `Réponse reçue pour ${reclamationData.num_inter}`,
        timestamp: new Date().toISOString(),
        employeeId: reclamationData.technicien_id,
        data: reclamationData
      }
      
      connections.forEach(socketId => {
        io.to(socketId).emit('notification', notification)
      })
    }
  }
  
  console.log(`📨 Réclamation technique mise à jour émise: ${reclamationData.num_inter}`)
  return true
}

/**
 * Envoie une notification de pénalité à un employé
 */
function sendPenaliteNotification(employeeId, penaliteData) {
  if (!io) {
    console.warn('⚠️ Socket.IO non initialisé')
    return false
  }

  const connections = employeeConnections.get(employeeId)
  if (!connections || connections.size === 0) {
    console.log(`⚠️ Aucune connexion trouvée pour l'employé ${employeeId}`)
    return false
  }

  const notification = {
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
    io.to(socketId).emit('notification', notification)
  })

  console.log(`📨 Notification pénalité envoyée à l'employé ${employeeId}`)
  return true
}

/**
 * Obtient le nombre de connexions actives par employé
 */
function getActiveConnections() {
  const result = {}
  
  employeeConnections.forEach((connections, employeeId) => {
    result[employeeId] = connections.size
  })
  
  return result
}

module.exports = {
  initializeSocketIO,
  getSocketIOServer,
  sendReclamationNotification,
  sendReclamationTechniqueCreated,
  sendReclamationTechniqueUpdated,
  sendPenaliteNotification,
  getActiveConnections
}














