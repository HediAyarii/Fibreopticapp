// Wrapper TypeScript pour les fonctions Socket.IO
// Ce fichier permet d'utiliser Socket.IO dans les routes API Next.js

/**
 * Charge dynamiquement le module Socket.IO
 */
function getSocketIOModule() {
  try {
    // En Node.js, utiliser require depuis le répertoire racine
    const path = require('path');
    const socketioPath = path.join(process.cwd(), 'lib', 'socketio.js');
    return require(socketioPath);
  } catch (error) {
    console.warn('⚠️ Module Socket.IO non chargé:', error);
    return null;
  }
}

/**
 * Émet un événement quand une nouvelle réclamation technique est créée
 */
export function emitReclamationCreated(reclamation: any) {
  try {
    const socketIO = getSocketIOModule();
    if (socketIO?.sendReclamationTechniqueCreated) {
      const result = socketIO.sendReclamationTechniqueCreated(reclamation);
      console.log(`📡 Émission réclamation créée: ${result ? 'SUCCESS' : 'FAILED'}`);
      return result;
    } else {
      console.warn('⚠️ Socket.IO sendReclamationTechniqueCreated non disponible');
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur émission Socket.IO (créée):', error);
    return false;
  }
}

/**
 * Émet un événement quand une réclamation technique est mise à jour
 */
export function emitReclamationUpdated(reclamation: any) {
  try {
    const socketIO = getSocketIOModule();
    if (socketIO?.sendReclamationTechniqueUpdated) {
      const result = socketIO.sendReclamationTechniqueUpdated(reclamation);
      console.log(`📡 Émission réclamation MAJ: ${result ? 'SUCCESS' : 'FAILED'}`);
      return result;
    } else {
      console.warn('⚠️ Socket.IO sendReclamationTechniqueUpdated non disponible');
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur émission Socket.IO (MAJ):', error);
    return false;
  }
}

/**
 * Récupère l'instance Socket.IO
 */
export function getSocketIO() {
  try {
    const socketIO = getSocketIOModule();
    return socketIO?.getSocketIOServer?.() || null;
  } catch (error) {
    console.error('❌ Erreur récupération instance Socket.IO:', error);
    return null;
  }
}
