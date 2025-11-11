const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { initializeSocketIO } = require('./lib/socketio')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

// Initialiser Next.js
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  // Créer le serveur HTTP
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Erreur serveur:', err)
      res.statusCode = 500
      res.end('Erreur serveur')
    }
  })

  // Initialiser Socket.IO avec le serveur HTTP
  const io = initializeSocketIO(server)
  
  // Vérifier et définir la variable globale
  if (global.socketIOInstance) {
    console.log('✅ Variable globale socketIOInstance définie')
  } else {
    console.warn('⚠️ Variable globale socketIOInstance NON définie - définition manuelle')
    global.socketIOInstance = io
    console.log('✅ Variable globale socketIOInstance définie manuellement')
  }

  // Démarrer le serveur
  server.listen(port, (err) => {
    if (err) throw err
    console.log(`🚀 Serveur démarré sur http://${hostname}:${port}`)
    console.log(`🔌 Socket.IO initialisé sur /api/socketio`)
  })
})
