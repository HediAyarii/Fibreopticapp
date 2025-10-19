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

async function optimizePostgreSQLConfig() {
  console.log('🔧 Optimisation de la configuration PostgreSQL...');
  
  try {
    // 1. Vérifier la configuration actuelle
    console.log('\n📊 1. Configuration actuelle:');
    const configResult = await pool.query(`
      SELECT 
        name,
        setting,
        unit,
        context,
        short_desc
      FROM pg_settings 
      WHERE name IN (
        'max_connections',
        'shared_buffers',
        'effective_cache_size',
        'work_mem',
        'maintenance_work_mem',
        'checkpoint_completion_target',
        'wal_buffers',
        'default_statistics_target'
      )
      ORDER BY name
    `);
    
    configResult.rows.forEach(row => {
      console.log(`   📊 ${row.name}: ${row.setting} ${row.unit || ''} (${row.short_desc})`);
    });
    
    // 2. Recommandations d'optimisation
    console.log('\n📊 2. Recommandations d\'optimisation:');
    
    const maxConnections = parseInt(configResult.rows.find(r => r.name === 'max_connections')?.setting || '100');
    const sharedBuffers = parseInt(configResult.rows.find(r => r.name === 'shared_buffers')?.setting || '128');
    
    console.log(`   📊 Max connexions actuel: ${maxConnections}`);
    if (maxConnections < 200) {
      console.log(`   ⚠️  Recommandation: Augmenter max_connections à 200 ou plus`);
      console.log(`      ALTER SYSTEM SET max_connections = 200;`);
    }
    
    console.log(`   📊 Shared buffers actuel: ${sharedBuffers}MB`);
    if (sharedBuffers < 256) {
      console.log(`   ⚠️  Recommandation: Augmenter shared_buffers à 256MB ou plus`);
      console.log(`      ALTER SYSTEM SET shared_buffers = '256MB';`);
    }
    
    // 3. Vérifier les index manquants
    console.log('\n📊 3. Vérification des index:');
    const indexResult = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
        AND tablename IN ('interventions', 'employes', 'cout_par_salaire', 'paiements_employes')
      ORDER BY tablename, indexname
    `);
    
    console.log(`   📊 Index existants: ${indexResult.rows.length}`);
    indexResult.rows.forEach(row => {
      console.log(`      ${row.tablename}.${row.indexname}`);
    });
    
    // 4. Vérifier les requêtes lentes
    console.log('\n📊 4. Requêtes lentes (si pg_stat_statements est activé):');
    try {
      const slowQueriesResult = await pool.query(`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows
        FROM pg_stat_statements 
        WHERE mean_time > 1000
        ORDER BY mean_time DESC
        LIMIT 5
      `);
      
      if (slowQueriesResult.rows.length > 0) {
        console.log(`   📊 Requêtes lentes trouvées: ${slowQueriesResult.rows.length}`);
        slowQueriesResult.rows.forEach((row, index) => {
          console.log(`      ${index + 1}. Mean time: ${row.mean_time}ms, Calls: ${row.calls}, Query: ${row.query.substring(0, 100)}...`);
        });
      } else {
        console.log(`   📊 Aucune requête lente détectée`);
      }
    } catch (error) {
      console.log(`   📊 pg_stat_statements non disponible: ${error.message}`);
    }
    
    // 5. Vérifier les verrous
    console.log('\n📊 5. Verrous actifs:');
    const locksResult = await pool.query(`
      SELECT 
        l.locktype,
        l.database,
        l.relation,
        l.page,
        l.tuple,
        l.virtualxid,
        l.transactionid,
        l.classid,
        l.objid,
        l.objsubid,
        l.virtualtransaction,
        l.pid,
        l.mode,
        l.granted,
        a.usename,
        a.query,
        a.query_start,
        a.state
      FROM pg_locks l
      LEFT JOIN pg_stat_activity a ON l.pid = a.pid
      WHERE l.database = (SELECT oid FROM pg_database WHERE datname = current_database())
      ORDER BY l.pid
    `);
    
    console.log(`   📊 Verrous actifs: ${locksResult.rows.length}`);
    if (locksResult.rows.length > 0) {
      locksResult.rows.forEach((row, index) => {
        console.log(`      ${index + 1}. PID: ${row.pid}, Type: ${row.locktype}, Mode: ${row.mode}, Granted: ${row.granted}`);
      });
    }
    
    // 6. Recommandations finales
    console.log('\n📊 6. Recommandations finales:');
    console.log('   📊 Pour éviter "too many clients":');
    console.log('      1. Augmenter max_connections dans PostgreSQL');
    console.log('      2. Optimiser le pool de connexions (déjà fait)');
    console.log('      3. Implémenter un système de cache Redis');
    console.log('      4. Optimiser les requêtes fréquentes');
    console.log('      5. Utiliser des connexions persistantes');
    
    console.log('\n📊 7. Commandes SQL recommandées:');
    console.log('   -- Augmenter les connexions');
    console.log('   ALTER SYSTEM SET max_connections = 200;');
    console.log('   -- Augmenter les buffers');
    console.log('   ALTER SYSTEM SET shared_buffers = \'256MB\';');
    console.log('   -- Optimiser la mémoire de travail');
    console.log('   ALTER SYSTEM SET work_mem = \'4MB\';');
    console.log('   -- Redémarrer PostgreSQL après ces changements');
    console.log('   SELECT pg_reload_conf();');
    
    console.log('\n🎯 Optimisation terminée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

optimizePostgreSQLConfig().catch(console.error);
