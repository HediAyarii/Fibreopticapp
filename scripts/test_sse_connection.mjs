import fetch from 'node-fetch'

async function testSSEConnection() {
  try {
    console.log('🧪 Test de connexion SSE...')
    console.log('=' .repeat(50))
    
    // Test de l'API SSE
    console.log('📋 Test de l\'API /api/employees-updates...')
    
    const response = await fetch('http://localhost:3003/api/employees-updates', {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
      }
    })
    
    console.log('📊 Statut de la réponse:', response.status)
    console.log('📊 Headers de la réponse:')
    response.headers.forEach((value, key) => {
      console.log(`   ${key}: ${value}`)
    })
    
    if (response.ok) {
      console.log('✅ API SSE accessible')
      
      // Lire les premières données du stream
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      
      console.log('📡 Lecture du stream SSE...')
      
      // Lire les 3 premiers messages
      for (let i = 0; i < 3; i++) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        console.log(`📨 Message ${i + 1}:`, chunk.trim())
      }
      
      reader.releaseLock()
      console.log('✅ Test SSE terminé avec succès')
      
    } else {
      console.log('❌ Erreur API SSE:', response.status, response.statusText)
      const errorText = await response.text()
      console.log('📄 Contenu de l\'erreur:', errorText)
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test SSE:', error.message)
    console.log('💡 Vérifiez que le serveur Next.js est démarré (npm run dev)')
  }
}

testSSEConnection()
  .then(() => {
    console.log('🎯 Test terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error)
    process.exit(1)
  })
