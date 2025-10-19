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

async function testConnectionLoad() {
  console.log('🧪 Test de charge des connexions...');
  
  try {
    // 1. Test de connexions simultanées
    console.log('\n📊 1. Test de connexions simultanées:');
    const concurrentConnections = 20;
    const promises = [];
    
    for (let i = 0; i < concurrentConnections; i++) {
      promises.push(
        pool.query(`
          SELECT 
            ${i} as connection_id,
            current_timestamp as start_time,
            (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as current_connections
        `)
      );
    }
    
    console.log(`   📊 Lancement de ${concurrentConnections} requêtes simultanées...`);
    const startTime = Date.now();
    
    try {
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`   ✅ Toutes les requêtes terminées en ${duration}ms`);
      console.log(`   📊 Connexions max observées: ${Math.max(...results.map(r => r.rows[0].current_connections))}`);
      
    } catch (error) {
      if (error.message.includes('too many clients')) {
        console.log(`   ❌ Erreur "too many clients" détectée: ${error.message}`);
        console.log(`   ⚠️  Le problème persiste malgré les optimisations`);
      } else {
        console.log(`   ❌ Autre erreur: ${error.message}`);
      }
    }
    
    // 2. Test de requêtes longues
    console.log('\n📊 2. Test de requêtes longues:');
    const longQueries = 5;
    const longPromises = [];
    
    for (let i = 0; i < longQueries; i++) {
      longPromises.push(
        pool.query(`
          SELECT 
            ${i} as query_id,
            current_timestamp as start_time,
            pg_sleep(2) as sleep_duration,
            (SELECT count(*) FROM interventions) as total_interventions
        `)
      );
    }
    
    console.log(`   📊 Lancement de ${longQueries} requêtes longues (2s chacune)...`);
    const longStartTime = Date.now();
    
    try {
      const longResults = await Promise.all(longPromises);
      const longEndTime = Date.now();
      const longDuration = longEndTime - longStartTime;
      
      console.log(`   ✅ Toutes les requêtes longues terminées en ${longDuration}ms`);
      
    } catch (error) {
      console.log(`   ❌ Erreur lors des requêtes longues: ${error.message}`);
    }
    
    // 3. Test de stress avec requêtes complexes
    console.log('\n📊 3. Test de stress avec requêtes complexes:');
    const complexQueries = 10;
    const complexPromises = [];
    
    for (let i = 0; i < complexQueries; i++) {
      complexPromises.push(
        pool.query(`
          SELECT 
            i.nom_technicien,
            i.prenom_technicien,
            COUNT(*) as interventions_count,
            SUM(
              CASE 
                WHEN i.statut = 'CLOTURE TERMINEE' THEN
                  COALESCE(
                    (SELECT SUM(
                      CASE 
                        WHEN cp.prix_tech IS NOT NULL THEN cp.prix_tech
                        ELSE 0
                      END
                    )
                    FROM unnest(string_to_array(i.articles, ',')) as article_item
                    LEFT JOIN company_pricing cp ON 
                      TRIM(SPLIT_PART(article_item, 'x', 1)) = cp.service_code
                      AND cp.company_name = 'ERT OUEST'
                      AND cp.category = i.type_intervention
                    ), 0
                  )
                ELSE 0
              END
            ) as total_recette
          FROM interventions i
          WHERE i.statut = 'CLOTURE TERMINEE'
            AND i.articles IS NOT NULL 
            AND i.articles != ''
          GROUP BY i.nom_technicien, i.prenom_technicien
          ORDER BY total_recette DESC
          LIMIT 10
        `)
      );
    }
    
    console.log(`   📊 Lancement de ${complexQueries} requêtes complexes...`);
    const complexStartTime = Date.now();
    
    try {
      const complexResults = await Promise.all(complexPromises);
      const complexEndTime = Date.now();
      const complexDuration = complexEndTime - complexStartTime;
      
      console.log(`   ✅ Toutes les requêtes complexes terminées en ${complexDuration}ms`);
      
    } catch (error) {
      console.log(`   ❌ Erreur lors des requêtes complexes: ${error.message}`);
    }
    
    // 4. Vérification finale de l'état
    console.log('\n📊 4. Vérification finale de l\'état:');
    const finalStats = await pool.query(`
      SELECT 
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as current_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'active') as active_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'idle') as idle_connections
    `);
    
    const stats = finalStats.rows[0];
    const usagePercentage = ((parseInt(stats.current_connections) / parseInt(stats.max_connections)) * 100).toFixed(1);
    
    console.log(`   📊 État final:`);
    console.log(`      Max connexions: ${stats.max_connections}`);
    console.log(`      Connexions actuelles: ${stats.current_connections}`);
    console.log(`      Connexions actives: ${stats.active_connections}`);
    console.log(`      Connexions inactives: ${stats.idle_connections}`);
    console.log(`      Utilisation: ${usagePercentage}%`);
    
    if (parseFloat(usagePercentage) > 80) {
      console.log(`   ⚠️  Utilisation élevée des connexions`);
    } else {
      console.log(`   ✅ Utilisation normale des connexions`);
    }
    
    console.log('\n🎯 Test de charge terminé !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

testConnectionLoad().catch(console.error);
