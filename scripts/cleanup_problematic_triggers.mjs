import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024',
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function cleanupProblematicTriggers() {
  console.log('🧹 Nettoyage des triggers problématiques...');
  
  try {
    // Supprimer le trigger problématique
    console.log('\n📊 1. Suppression du trigger problématique...');
    await pool.query(`
      DROP TRIGGER IF EXISTS trigger_sync_benefice_brut ON cout_par_salaire;
    `);
    console.log('✅ Trigger supprimé');
    
    // Supprimer la fonction problématique
    console.log('\n📊 2. Suppression de la fonction problématique...');
    await pool.query(`
      DROP FUNCTION IF EXISTS sync_benefice_brut_to_charges();
    `);
    console.log('✅ Fonction supprimée');
    
    // Supprimer la fonction de synchronisation manuelle problématique
    console.log('\n📊 3. Suppression de la fonction de synchronisation manuelle...');
    await pool.query(`
      DROP FUNCTION IF EXISTS force_sync_all_charges();
    `);
    console.log('✅ Fonction de synchronisation manuelle supprimée');
    
    console.log('\n🎯 Nettoyage terminé !');
    console.log('✅ Les triggers et fonctions problématiques ont été supprimés');
    console.log('✅ Le système est maintenant stable');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

cleanupProblematicTriggers().catch(console.error);

