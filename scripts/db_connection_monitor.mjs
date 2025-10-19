import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024',
  ssl: false,
  max: 50,
  min: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
  acquireTimeoutMillis: 10000,
  allowExitOnIdle: true,
});

async function monitorConnections() {
  console.log('🔍 Surveillance en temps réel des connexions...');
  
  try {
    const result = await pool.query(`
      SELECT 
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as current_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'active') as active_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'idle') as idle_connections
    `);
    
    const stats = result.rows[0];
    const maxConnections = stats.max_connections;
    const currentConnections = parseInt(stats.current_connections);
    const activeConnections = parseInt(stats.active_connections);
    const idleConnections = parseInt(stats.idle_connections);
    const usagePercentage = ((currentConnections / maxConnections) * 100).toFixed(1);
    
    console.log(`📊 Connexions: ${currentConnections}/${maxConnections} (${usagePercentage}%)`);
    console.log(`📊 Actives: ${activeConnections}, Inactives: ${idleConnections}`);
    
    if (currentConnections > maxConnections * 0.8) {
      console.log(`⚠️  ATTENTION: Utilisation élevée des connexions (${usagePercentage}%)`);
      console.log(`⚠️  Risque de "too many clients" imminent !`);
    } else if (currentConnections > maxConnections * 0.6) {
      console.log(`⚠️  Utilisation modérée des connexions (${usagePercentage}%)`);
    } else {
      console.log(`✅ Utilisation normale des connexions (${usagePercentage}%)`);
    }
    
    return {
      maxConnections,
      currentConnections,
      activeConnections,
      idleConnections,
      usagePercentage: parseFloat(usagePercentage)
    };
    
  } catch (error) {
    console.error('❌ Erreur de surveillance:', error.message);
    return null;
  }
}

// Surveillance continue
async function startMonitoring() {
  console.log('🚀 Démarrage de la surveillance des connexions...');
  console.log('💡 Appuyez sur Ctrl+C pour arrêter\n');
  
  let alertCount = 0;
  
  while (true) {
    try {
      const stats = await monitorConnections();
      
      if (stats && stats.usagePercentage > 80) {
        alertCount++;
        console.log(`🚨 ALERTE ${alertCount}: Utilisation critique des connexions !`);
        
        if (alertCount >= 3) {
          console.log('🚨 ACTION REQUISE: Redémarrer l\'application ou optimiser les requêtes');
          alertCount = 0; // Reset pour éviter le spam
        }
      } else {
        alertCount = 0; // Reset si utilisation normale
      }
      
      // Attendre 30 secondes avant la prochaine vérification
      await new Promise(resolve => setTimeout(resolve, 30000));
      
    } catch (error) {
      console.error('❌ Erreur dans la boucle de surveillance:', error.message);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Attendre 5 secondes en cas d'erreur
    }
  }
}

// Gestion de l'arrêt propre
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt de la surveillance...');
  await pool.end();
  process.exit(0);
});

startMonitoring().catch(console.error);
