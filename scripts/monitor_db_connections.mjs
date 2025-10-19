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

async function monitorDbConnections() {
  console.log('🔍 Surveillance des connexions PostgreSQL...');
  
  try {
    // 1. Vérifier l'état actuel du pool
    console.log('\n📊 1. État actuel du pool:');
    console.log(`   📊 Total connexions: ${pool.totalCount}`);
    console.log(`   📊 Connexions inactives: ${pool.idleCount}`);
    console.log(`   📊 Connexions en attente: ${pool.waitingCount}`);
    
    // 2. Vérifier les connexions actives dans PostgreSQL
    console.log('\n📊 2. Connexions actives dans PostgreSQL:');
    const activeConnectionsResult = await pool.query(`
      SELECT 
        pid,
        usename,
        application_name,
        client_addr,
        state,
        query_start,
        state_change,
        query
      FROM pg_stat_activity 
      WHERE datname = 'finalfibre_db'
      ORDER BY query_start DESC
    `);
    
    console.log(`   📊 Connexions actives: ${activeConnectionsResult.rows.length}`);
    activeConnectionsResult.rows.forEach((row, index) => {
      console.log(`      ${index + 1}. PID: ${row.pid}, User: ${row.usename}, State: ${row.state}, Query: ${row.query?.substring(0, 50)}...`);
    });
    
    // 3. Vérifier les limites de connexions
    console.log('\n📊 3. Limites de connexions PostgreSQL:');
    const limitsResult = await pool.query(`
      SELECT 
        setting as max_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as current_connections
      FROM pg_settings 
      WHERE name = 'max_connections'
    `);
    
    const maxConnections = parseInt(limitsResult.rows[0].max_connections);
    const currentConnections = parseInt(limitsResult.rows[0].current_connections);
    
    console.log(`   📊 Max connexions autorisées: ${maxConnections}`);
    console.log(`   📊 Connexions actuelles: ${currentConnections}`);
    console.log(`   📊 Utilisation: ${((currentConnections / maxConnections) * 100).toFixed(1)}%`);
    
    if (currentConnections > maxConnections * 0.8) {
      console.log(`   ⚠️  Attention: Utilisation élevée des connexions (${((currentConnections / maxConnections) * 100).toFixed(1)}%)`);
    }
    
    // 4. Vérifier les connexions longues
    console.log('\n📊 4. Connexions longues (> 5 minutes):');
    const longConnectionsResult = await pool.query(`
      SELECT 
        pid,
        usename,
        application_name,
        state,
        query_start,
        now() - query_start as duration,
        query
      FROM pg_stat_activity 
      WHERE datname = 'finalfibre_db'
        AND state != 'idle'
        AND now() - query_start > interval '5 minutes'
      ORDER BY duration DESC
    `);
    
    console.log(`   📊 Connexions longues: ${longConnectionsResult.rows.length}`);
    longConnectionsResult.rows.forEach((row, index) => {
      console.log(`      ${index + 1}. PID: ${row.pid}, Duration: ${row.duration}, Query: ${row.query?.substring(0, 50)}...`);
    });
    
    // 5. Vérifier les connexions bloquées
    console.log('\n📊 5. Connexions bloquées:');
    const blockedConnectionsResult = await pool.query(`
      SELECT 
        pid,
        usename,
        state,
        wait_event_type,
        wait_event,
        query
      FROM pg_stat_activity 
      WHERE datname = 'finalfibre_db'
        AND state = 'active'
        AND wait_event_type IS NOT NULL
      ORDER BY pid
    `);
    
    console.log(`   📊 Connexions bloquées: ${blockedConnectionsResult.rows.length}`);
    blockedConnectionsResult.rows.forEach((row, index) => {
      console.log(`      ${index + 1}. PID: ${row.pid}, Wait: ${row.wait_event_type}/${row.wait_event}, Query: ${row.query?.substring(0, 50)}...`);
    });
    
    // 6. Recommandations
    console.log('\n📊 6. Recommandations:');
    
    if (currentConnections > maxConnections * 0.8) {
      console.log('   ⚠️  Utilisation élevée des connexions:');
      console.log('      - Augmenter max_connections dans PostgreSQL');
      console.log('      - Optimiser les requêtes longues');
      console.log('      - Implémenter un système de cache');
    }
    
    if (longConnectionsResult.rows.length > 0) {
      console.log('   ⚠️  Connexions longues détectées:');
      console.log('      - Vérifier les requêtes qui prennent du temps');
      console.log('      - Ajouter des index si nécessaire');
      console.log('      - Optimiser les requêtes complexes');
    }
    
    if (blockedConnectionsResult.rows.length > 0) {
      console.log('   ⚠️  Connexions bloquées détectées:');
      console.log('      - Vérifier les verrous de base de données');
      console.log('      - Optimiser les transactions');
      console.log('      - Réduire la durée des transactions');
    }
    
    console.log('\n🎯 Surveillance terminée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

monitorDbConnections().catch(console.error);
