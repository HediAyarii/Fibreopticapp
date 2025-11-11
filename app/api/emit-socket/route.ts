// Route API pour émettre des événements Socket.IO
// Cette route utilise directement le module socketio.js

import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Importer le module socketio avec require pour CommonJS
const socketio = require('../../../lib/socketio');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, data } = body;

    // Debug: vérifier ce qui est disponible
    console.log('🔍 Debug emit-socket:');
    console.log('  - Event:', event);
    console.log('  - socketio module chargé:', !!socketio);
    console.log('  - getSocketIOServer existe:', typeof socketio.getSocketIOServer);

    // Récupérer l'instance Socket.IO via la fonction du module
    const io = socketio.getSocketIOServer();
    
    console.log('  - io instance:', !!io);
    console.log('  - io type:', typeof io);
    
    if (!io) {
      console.warn('⚠️ Socket.IO non initialisé (instance non trouvée)');
      return NextResponse.json({ 
        success: false, 
        error: 'Socket.IO not initialized' 
      }, { status: 503 });
    }

    if (event === 'reclamation_created') {
      // Émettre l'événement à tous les clients connectés
      io.emit('reclamation_technique_created', data);
      console.log('📡 Événement reclamation_technique_created émis:', data.num_inter);
      return NextResponse.json({ success: true, emitted: true });
    }
    
    if (event === 'reclamation_updated') {
      // Émettre l'événement à tous les clients connectés
      io.emit('reclamation_technique_updated', data);
      console.log('📡 Événement reclamation_technique_updated émis:', data.num_inter);
      
      // Envoyer aussi une notification au technicien concerné si disponible
      if (data.technicien_id) {
        // Cette partie sera gérée par la fonction sendReclamationTechniqueUpdated
        // Pour l'instant, juste émettre l'événement global
      }
      
      return NextResponse.json({ success: true, emitted: true });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Unknown event type' 
    }, { status: 400 });
    
  } catch (error: any) {
    console.error('❌ Erreur route emit-socket:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
