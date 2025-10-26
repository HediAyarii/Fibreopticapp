// Nettoyage des connexions PostgreSQL
const { Pool } = require('pg');

// Configuration
const dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
  max: 5,
  min: 1,
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 5000,
  acquireTimeoutMillis: 10000,
  allowExitOnIdle: true,
  keepAlive: true,
  keepAliveInitialDelayMillis: 0,
};

const pool = new Pool(dbConfig);

async function cleanupConnections() {
  console.log('🧹 Nettoyage des connexions PostgreSQL...\n');

  try {
    // État avant nettoyage
    console.log('📊 État avant nettoyage:');
    const statsBefore = await pool.query(`
      SELECT 
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as current_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'active') as active_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'idle') as idle_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'idle in transaction') as idle_in_transaction_connections
    `);

    const before = statsBefore.rows[0];
    console.log(`   🔗 Connexions: ${before.current_connections}/${before.max_connections}`);
    console.log(`   ✅ Actives: ${before.active_connections}`);
    console.log(`   😴 Inactives: ${before.idle_connections}`);
    console.log(`   ⏳ En transaction: ${before.idle_in_transaction_connections}`);

    // Recherche des connexions orphelines
    console.log('\n🔍 Recherche des connexions orphelines...');
    const orphanedResult = await pool.query(`
      SELECT 
        pid,
        usename,
        application_name,
        state,
        query_start,
        query
      FROM pg_stat_activity 
      WHERE datname = current_database()
        AND state = 'idle'
        AND query_start < NOW() - INTERVAL '30 seconds'
      ORDER BY query_start
    `);

    if (orphanedResult.rows.length > 0) {
      console.log(`   🧹 ${orphanedResult.rows.length} connexions orphelines trouvées:`);
      
      for (const row of orphanedResult.rows) {
        const timeAgo = Math.round((Date.now() - new Date(row.query_start).getTime()) / 1000);
        console.log(`      - PID: ${row.pid}, User: ${row.usename}, State: ${row.state}, Time: ${timeAgo}s`);
      }

      // Nettoyage des connexions orphelines
      console.log('\n🧹 Nettoyage en cours...');
      let cleaned = 0;
      
      for (const row of orphanedResult.rows) {
        try {
          await pool.query('SELECT pg_terminate_backend($1)', [row.pid]);
          console.log(`   ✅ Connexion ${row.pid} fermée`);
          cleaned++;
        } catch (error) {
          console.log(`   ⚠️  Impossible de fermer la connexion ${row.pid}: ${error.message}`);
        }
      }

      console.log(`\n✅ ${cleaned} connexions orphelines nettoyées`);

    } else {
      console.log('   ℹ️  Aucune connexion orpheline trouvée');
    }

    // État après nettoyage
    console.log('\n📊 État après nettoyage:');
    const statsAfter = await pool.query(`
      SELECT 
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as current_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'active') as active_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'idle') as idle_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'idle in transaction') as idle_in_transaction_connections
    `);

    const after = statsAfter.rows[0];
    console.log(`   🔗 Connexions: ${after.current_connections}/${before.max_connections}`);
    console.log(`   ✅ Actives: ${after.active_connections}`);
    console.log(`   😴 Inactives: ${after.idle_connections}`);
    console.log(`   ⏳ En transaction: ${after.idle_in_transaction_connections}`);

    const cleaned = parseInt(before.current_connections) - parseInt(after.current_connections);
    if (cleaned > 0) {
      console.log(`\n✅ ${cleaned} connexions nettoyées avec succès!`);
    } else {
      console.log('\nℹ️  Aucune connexion supplémentaire nettoyée');
    }

    console.log('\n💡 Recommandations:');
    console.log('   - Surveillez régulièrement les connexions');
    console.log('   - Utilisez le pattern singleton implémenté');
    console.log('   - Redémarrez le serveur de développement si nécessaire');

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Exécuter le nettoyage
cleanupConnections();
