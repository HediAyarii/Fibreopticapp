// Script de démarrage avec gestion des connexions
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Démarrage de l\'application avec gestion des connexions...\n');

// Configuration
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

// Fonction pour nettoyer les connexions avant le démarrage
async function cleanupBeforeStart() {
  console.log('🧹 Nettoyage des connexions avant démarrage...');
  
  try {
    const { Pool } = require('pg');
    
    const pool = new Pool({
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
    });

    // Nettoyage des connexions orphelines
    const result = await pool.query(`
      SELECT pid
      FROM pg_stat_activity 
      WHERE datname = current_database()
        AND state = 'idle'
        AND query_start < NOW() - INTERVAL '30 seconds'
    `);

    if (result.rows.length > 0) {
      console.log(`   🧹 ${result.rows.length} connexions orphelines trouvées`);
      
      for (const row of result.rows) {
        try {
          await pool.query('SELECT pg_terminate_backend($1)', [row.pid]);
          console.log(`   ✅ Connexion ${row.pid} fermée`);
        } catch (error) {
          console.log(`   ⚠️  Impossible de fermer la connexion ${row.pid}`);
        }
      }
    } else {
      console.log('   ℹ️  Aucune connexion orpheline trouvée');
    }

    await pool.end();
    console.log('   ✅ Nettoyage terminé\n');

  } catch (error) {
    console.log('   ⚠️  Erreur lors du nettoyage:', error.message);
    console.log('   ℹ️  Continuation du démarrage...\n');
  }
}

// Fonction pour démarrer l'application
function startApplication() {
  console.log('🚀 Démarrage de l\'application Next.js...\n');
  
  const command = isDevelopment ? 'npm run dev' : 'npm start';
  const child = spawn(command, [], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
  });

  // Gestion des signaux
  process.on('SIGINT', () => {
    console.log('\n🔄 Arrêt de l\'application...');
    child.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🔄 Arrêt de l\'application...');
    child.kill('SIGTERM');
    process.exit(0);
  });

  child.on('error', (error) => {
    console.error('❌ Erreur lors du démarrage:', error);
    process.exit(1);
  });

  child.on('exit', (code) => {
    console.log(`\n📊 Application arrêtée avec le code: ${code}`);
    process.exit(code);
  });
}

// Fonction principale
async function main() {
  try {
    // Nettoyage avant démarrage
    await cleanupBeforeStart();
    
    // Démarrage de l'application
    startApplication();
    
  } catch (error) {
    console.error('❌ Erreur lors du démarrage:', error);
    process.exit(1);
  }
}

// Affichage des informations
console.log('📋 Configuration:');
console.log(`   🔧 Mode: ${isDevelopment ? 'Développement' : 'Production'}`);
console.log(`   🗄️  Base de données: ${process.env.POSTGRES_DB || 'finalfibre_db'}`);
console.log(`   🏠 Host: ${process.env.POSTGRES_HOST || 'localhost'}`);
console.log(`   🔌 Port: ${process.env.POSTGRES_PORT || '5432'}`);
console.log('');

console.log('💡 Solution des fuites de connexions:');
console.log('   ✅ Pattern singleton global implémenté');
console.log('   ✅ Configuration optimisée pour le développement');
console.log('   ✅ Nettoyage automatique des connexions orphelines');
console.log('   ✅ Handlers de fermeture automatique');
console.log('');

// Démarrer
main();
