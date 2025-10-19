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

async function applyPostgreSQLOptimizations() {
  console.log('🔧 Application des optimisations PostgreSQL...');
  
  try {
    // 1. Augmenter max_connections
    console.log('\n📊 1. Augmentation de max_connections:');
    try {
      await pool.query('ALTER SYSTEM SET max_connections = 200;');
      console.log('   ✅ max_connections augmenté à 200');
    } catch (error) {
      console.log(`   ⚠️  Erreur lors de l'augmentation de max_connections: ${error.message}`);
    }
    
    // 2. Augmenter shared_buffers
    console.log('\n📊 2. Augmentation de shared_buffers:');
    try {
      await pool.query('ALTER SYSTEM SET shared_buffers = \'256MB\';');
      console.log('   ✅ shared_buffers augmenté à 256MB');
    } catch (error) {
      console.log(`   ⚠️  Erreur lors de l'augmentation de shared_buffers: ${error.message}`);
    }
    
    // 3. Optimiser work_mem
    console.log('\n📊 3. Optimisation de work_mem:');
    try {
      await pool.query('ALTER SYSTEM SET work_mem = \'4MB\';');
      console.log('   ✅ work_mem optimisé à 4MB');
    } catch (error) {
      console.log(`   ⚠️  Erreur lors de l'optimisation de work_mem: ${error.message}`);
    }
    
    // 4. Optimiser maintenance_work_mem
    console.log('\n📊 4. Optimisation de maintenance_work_mem:');
    try {
      await pool.query('ALTER SYSTEM SET maintenance_work_mem = \'64MB\';');
      console.log('   ✅ maintenance_work_mem optimisé à 64MB');
    } catch (error) {
      console.log(`   ⚠️  Erreur lors de l'optimisation de maintenance_work_mem: ${error.message}`);
    }
    
    // 5. Optimiser effective_cache_size
    console.log('\n📊 5. Optimisation de effective_cache_size:');
    try {
      await pool.query('ALTER SYSTEM SET effective_cache_size = \'1GB\';');
      console.log('   ✅ effective_cache_size optimisé à 1GB');
    } catch (error) {
      console.log(`   ⚠️  Erreur lors de l'optimisation de effective_cache_size: ${error.message}`);
    }
    
    // 6. Optimiser checkpoint_completion_target
    console.log('\n📊 6. Optimisation de checkpoint_completion_target:');
    try {
      await pool.query('ALTER SYSTEM SET checkpoint_completion_target = 0.9;');
      console.log('   ✅ checkpoint_completion_target optimisé à 0.9');
    } catch (error) {
      console.log(`   ⚠️  Erreur lors de l'optimisation de checkpoint_completion_target: ${error.message}`);
    }
    
    // 7. Recharger la configuration
    console.log('\n📊 7. Rechargement de la configuration:');
    try {
      await pool.query('SELECT pg_reload_conf();');
      console.log('   ✅ Configuration rechargée');
    } catch (error) {
      console.log(`   ⚠️  Erreur lors du rechargement: ${error.message}`);
    }
    
    // 8. Vérifier les nouvelles valeurs
    console.log('\n📊 8. Vérification des nouvelles valeurs:');
    const newConfigResult = await pool.query(`
      SELECT 
        name,
        setting,
        unit
      FROM pg_settings 
      WHERE name IN (
        'max_connections',
        'shared_buffers',
        'work_mem',
        'maintenance_work_mem',
        'effective_cache_size',
        'checkpoint_completion_target'
      )
      ORDER BY name
    `);
    
    newConfigResult.rows.forEach(row => {
      console.log(`   📊 ${row.name}: ${row.setting} ${row.unit || ''}`);
    });
    
    // 9. Créer des index supplémentaires si nécessaire
    console.log('\n📊 9. Création d\'index supplémentaires:');
    try {
      // Index pour les requêtes fréquentes
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_interventions_statut_date 
        ON interventions(statut, date_rdv) 
        WHERE statut IS NOT NULL AND date_rdv IS NOT NULL
      `);
      console.log('   ✅ Index idx_interventions_statut_date créé');
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_interventions_technicien_statut 
        ON interventions(nom_technicien, prenom_technicien, statut) 
        WHERE statut IS NOT NULL
      `);
      console.log('   ✅ Index idx_interventions_technicien_statut créé');
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_cout_par_salaire_nom_prenom 
        ON cout_par_salaire(nom, prenom) 
        WHERE nom IS NOT NULL AND prenom IS NOT NULL
      `);
      console.log('   ✅ Index idx_cout_par_salaire_nom_prenom créé');
      
    } catch (error) {
      console.log(`   ⚠️  Erreur lors de la création des index: ${error.message}`);
    }
    
    console.log('\n🎯 Optimisations appliquées !');
    console.log('✅ Les paramètres PostgreSQL ont été optimisés');
    console.log('✅ Des index supplémentaires ont été créés');
    console.log('✅ Le problème "too many clients" devrait être réduit');
    console.log('⚠️  Note: Un redémarrage de PostgreSQL peut être nécessaire pour certains paramètres');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

applyPostgreSQLOptimizations().catch(console.error);
