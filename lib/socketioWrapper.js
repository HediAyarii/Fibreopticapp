// Wrapper pour Socket.IO dans les APIs Next.js
let socketIOInstance = null

export function getSocketIOInstance() {
  return socketIOInstance
}

export function setSocketIOInstance(instance) {
  socketIOInstance = instance
}

// Fonctions d'envoi de notifications
export function sendReclamationNotification(employeeId, reclamationData) {
  if (!socketIOInstance) {
    console.warn('⚠️ Socket.IO non initialisé')
    return false
  }

  // Utiliser la fonction du serveur Socket.IO
  try {
    const { sendReclamationNotification: sendReclamation } = require('../lib/socketio')
    return sendReclamation(employeeId, reclamationData)
  } catch (error) {
    console.error('Erreur envoi notification réclamation:', error)
    return false
  }
}

export function sendPenaliteNotification(employeeId, penaliteData) {
  if (!socketIOInstance) {
    console.warn('⚠️ Socket.IO non initialisé')
    return false
  }

  // Utiliser la fonction du serveur Socket.IO
  try {
    const { sendPenaliteNotification: sendPenalite } = require('../lib/socketio')
    return sendPenalite(employeeId, penaliteData)
  } catch (error) {
    console.error('Erreur envoi notification pénalité:', error)
    return false
  }
}

