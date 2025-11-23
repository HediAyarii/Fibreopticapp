import { NextRequest } from 'next/server'

// Store des clients SSE connectés
const clients = new Map<number, ReadableStreamDefaultController>()

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const employeId = parseInt(searchParams.get('employeId') || '0')

  if (!employeId) {
    return new Response('Employee ID required', { status: 400 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Enregistrer le client
      clients.set(employeId, controller)
      console.log(`✅ SSE: Technicien ${employeId} connecté. Total clients: ${clients.size}`)

      // Envoyer un message initial
      const message = `data: ${JSON.stringify({ type: 'connected', employeId })}\n\n`
      controller.enqueue(encoder.encode(message))

      // Heartbeat pour maintenir la connexion
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch (error) {
          console.log(`❌ SSE: Erreur heartbeat pour technicien ${employeId}`)
          clearInterval(interval)
        }
      }, 30000) // Toutes les 30 secondes

      // Cleanup à la fermeture
      req.signal.addEventListener('abort', () => {
        console.log(`🔌 SSE: Technicien ${employeId} déconnecté`)
        clearInterval(interval)
        clients.delete(employeId)
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

// Fonction helper pour envoyer des événements aux techniciens
export function sendToTechnicien(employeId: number, event: string, data: any) {
  const controller = clients.get(employeId)
  if (controller) {
    try {
      const encoder = new TextEncoder()
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
      controller.enqueue(encoder.encode(message))
      console.log(`📤 SSE: Événement "${event}" envoyé au technicien ${employeId}`)
      return true
    } catch (error) {
      console.error(`❌ SSE: Erreur envoi au technicien ${employeId}:`, error)
      clients.delete(employeId)
      return false
    }
  }
  return false
}

// Export pour utilisation dans d'autres API routes
export { clients }
