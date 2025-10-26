// Monitoring simple des connexions PostgreSQL
const { Pool } = require('pg');

// Configuration
const dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
  max: 10,
  min: 1,
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 5000,
  acquireTimeoutMillis: 10000,
  allowExitOnIdle: true,
  keepAlive: true,
  keepAliveInitialDelayMillis: 0,
};

const pool = new Pool(dbConfig);

async function monitorConnections() {
  console.log('🔍 Monitoring des connexions PostgreSQL...');
  console.log('📊 Appuyez sur Ctrl+C pour arrêter\n');

  const monitor = async () => {
    try {
      // Statistiques du pool
      console.clear();
      console.log('📊 === MONITORING DES CONNEXIONS POSTGRESQL ===');
      console.log(`🕐 ${new Date().toLocaleString()}`);
      console.log('');

      // Statistiques du pool local
      console.log('🏊 STATISTIQUES DU POOL LOCAL:');
      console.log(`   📊 Total: ${pool.totalCount}`);
      console.log(`   😴 Inactives: ${pool.idleCount}`);
      console.log(`   ⏳ En attente: ${pool.waitingCount}`);
      console.log('');

      // Statistiques PostgreSQL
      const result = await pool.query(`
        SELECT 
          (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections,
          (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as current_connections,
          (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'active') as active_connections,
          (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'idle') as idle_connections,
          (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'idle in transaction') as idle_in_transaction_connections
      `);

      const stats = result.rows[0];
      const maxConnections = parseInt(stats.max_connections);
      const currentConnections = parseInt(stats.current_connections);
      const activeConnections = parseInt(stats.active_connections);
      const idleConnections = parseInt(stats.idle_connections);
      const idleInTransactionConnections = parseInt(stats.idle_in_transaction_connections);
      const usagePercentage = ((currentConnections / maxConnections) * 100).toFixed(1);

      console.log('📈 STATISTIQUES POSTGRESQL:');
      console.log(`   🔗 Connexions: ${currentConnections}/${maxConnections} (${usagePercentage}%)`);
      console.log(`   ✅ Actives: ${activeConnections}`);
      console.log(`   😴 Inactives: ${idleConnections}`);
      console.log(`   ⏳ En transaction: ${idleInTransactionConnections}`);
      console.log(`   🟢 Santé: ${currentConnections < maxConnections * 0.8 ? 'OK' : '⚠️  ATTENTION'}`);
      console.log('');

      // Connexions détaillées
      const detailedResult = await pool.query(`
        SELECT 
          pid,
          usename,
          application_name,
          client_addr,
          state,
          query_start,
          query
        FROM pg_stat_activity 
        WHERE datname = current_database()
        ORDER BY query_start DESC
        LIMIT 10
      `);

      console.log('🔍 CONNEXIONS DÉTAILLÉES (10 dernières):');
      detailedResult.rows.forEach((row, index) => {
        const timeAgo = row.query_start ? 
          Math.round((Date.now() - new Date(row.query_start).getTime()) / 1000) + 's' : 
          'N/A';
        console.log(`   ${index + 1}. PID: ${row.pid}, User: ${row.usename}, State: ${row.state}, Time: ${timeAgo}`);
        if (row.query && row.query.length > 0) {
          console.log(`      Query: ${row.query.substring(0, 60)}...`);
        }
      });
      console.log('');

      // Alertes
      if (currentConnections > maxConnections * 0.8) {
        console.log('⚠️  ALERTE: Utilisation élevée des connexions!');
        console.log('💡 Recommandations:');
        console.log('   - Redémarrez le serveur de développement');
        console.log('   - Vérifiez les connexions orphelines');
        console.log('   - Utilisez le script de nettoyage');
      }

      console.log('💡 Conseils:');
      console.log('   - En développement, surveillez les connexions idle');
      console.log('   - Redémarrez le serveur si trop de connexions');
      console.log('   - Utilisez la solution singleton implémentée');

    } catch (error) {
      console.error('❌ Erreur lors du monitoring:', error);
    }
  };

  // Monitoring initial
  await monitor();

  // Monitoring toutes les 5 secondes
  const interval = setInterval(monitor, 5000);

  // Nettoyage à l'arrêt
  process.on('SIGINT', async () => {
    console.log('\n🔄 Arrêt du monitoring...');
    clearInterval(interval);
    await pool.end();
    process.exit(0);
  });
}

// Démarrer le monitoring
monitorConnections().catch(console.error);
