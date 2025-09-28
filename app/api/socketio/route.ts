import { NextRequest, NextResponse } from 'next/server'
import { initializeSocketIO, getSocketIOServer } from '@/lib/socketio'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const io = getSocketIOServer()
    
    if (!io) {
      return NextResponse.json({ 
        error: 'Socket.IO non initialisé',
        connected: false 
      }, { status: 503 })
    }

    return NextResponse.json({
      connected: true,
      message: 'Socket.IO opérationnel',
      activeConnections: Object.keys(io.sockets.sockets).length
    })
  } catch (error) {
    console.error('Erreur vérification Socket.IO:', error)
    return NextResponse.json({ 
      error: 'Erreur serveur',
      connected: false 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json()
    
    const io = getSocketIOServer()
    if (!io) {
      return NextResponse.json({ 
        error: 'Socket.IO non initialisé' 
      }, { status: 503 })
    }

    switch (action) {
      case 'broadcast':
        io.emit('test-message', data)
        return NextResponse.json({ success: true, message: 'Message diffusé' })
      
      case 'get-connections':
        return NextResponse.json({ 
          connections: Object.keys(io.sockets.sockets).length,
          sockets: Array.from(io.sockets.sockets.keys())
        })
      
      default:
        return NextResponse.json({ 
          error: 'Action non reconnue' 
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Erreur API Socket.IO:', error)
    return NextResponse.json({ 
      error: 'Erreur serveur' 
    }, { status: 500 })
  }
}









