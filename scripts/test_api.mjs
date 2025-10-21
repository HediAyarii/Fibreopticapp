import https from 'https';
import http from 'http';

async function testAPI() {
  return new Promise((resolve, reject) => {
    const url = 'http://localhost:3000/api/carburant-auto-expire';
    
    console.log(`🔄 Test de l'API: ${url}`);
    
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Script/1.0'
      },
      timeout: 10000
    };
    
    const req = http.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ API fonctionne correctement');
          console.log('📊 Résultats:');
          console.log(`   - Assignations expirées: ${result.summary?.expired_count || 0}`);
          console.log(`   - Assignations expirant bientôt: ${result.summary?.upcoming_count || 0}`);
          resolve(result);
        } catch (parseError) {
          console.error('❌ Erreur parsing:', parseError.message);
          console.error('📄 Réponse brute:', data);
          reject(parseError);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Erreur de connexion:', error.message);
      reject(error);
    });
    
    req.on('timeout', () => {
      console.error('❌ Timeout de la requête');
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    req.end();
  });
}

testAPI()
  .then(() => {
    console.log('🎉 Test terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur:', error.message);
    process.exit(1);
  });




