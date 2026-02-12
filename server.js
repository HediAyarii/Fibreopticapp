const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { initializeSocketIO } = require('./lib/socketio')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

// Fonction pour envoyer les alertes véhicules
async function checkVehiculeAlerts() {
  try {
    const response = await fetch(`http://${hostname}:${port}/api/vehicules-alerts`)
    const data = await response.json()
    if (data.sent) {
      console.log('📧 Email d\'alerte véhicules envoyé:', data.stats)
    } else {
      console.log('📧 Alertes véhicules:', data.message)
    }
  } catch (error) {
    console.error('❌ Erreur vérification alertes véhicules:', error.message)
  }
}

// Planifier la vérification quotidienne des alertes (à 8h00)
function scheduleVehiculeAlerts() {
  const now = new Date()
  const targetHour = 8 // 8h du matin
  
  // Calculer le temps jusqu'à 8h00
  let nextRun = new Date(now)
  nextRun.setHours(targetHour, 0, 0, 0)
  
  // Si 8h est déjà passé aujourd'hui, planifier pour demain
  if (now >= nextRun) {
    nextRun.setDate(nextRun.getDate() + 1)
  }
  
  const timeUntilNextRun = nextRun.getTime() - now.getTime()
  
  console.log(`⏰ Prochaine vérification alertes véhicules: ${nextRun.toLocaleString('fr-FR')}`)
  
  // Planifier la première exécution
  setTimeout(() => {
    checkVehiculeAlerts()
    // Puis répéter toutes les 24h
    setInterval(checkVehiculeAlerts, 24 * 60 * 60 * 1000)
  }, timeUntilNextRun)
  
  // Exécuter aussi au démarrage (après 30 secondes pour laisser le serveur s'initialiser)
  setTimeout(checkVehiculeAlerts, 30000)
}

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
    
    // Démarrer le planificateur d'alertes véhicules
    scheduleVehiculeAlerts()
  })
})
