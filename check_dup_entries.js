const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024'
});

async function checkDupEntries() {
  try {
    console.log('🔍 Vérification des entrées avec _DUP_...\n');
    
    // Compter les entrées avec _DUP_
    const dupCountResult = await pool.query(`
      SELECT COUNT(*) as dup_count
      FROM interventions
      WHERE num_inter LIKE '%_DUP_%'
    `);
    
    console.log(`📊 Entrées avec _DUP_: ${dupCountResult.rows[0].dup_count}\n`);
    
    if (dupCountResult.rows[0].dup_count > 0) {
      // Afficher quelques exemples
      const samplesResult = await pool.query(`
        SELECT 
          id,
          num_inter,
          date_rdv,
          statut,
          nom_technicien,
          prenom_technicien,
          created_at
        FROM interventions
        WHERE num_inter LIKE '%_DUP_%'
        ORDER BY created_at DESC
        LIMIT 10
      `);
      
      console.log('=== EXEMPLES D\'ENTRÉES _DUP_ ===\n');
      samplesResult.rows.forEach((r, i) => {
        console.log(`${i + 1}. ID: ${r.id}`);
        console.log(`   Num: ${r.num_inter}`);
        console.log(`   Date: ${r.date_rdv || 'N/A'}`);
        console.log(`   Statut: ${r.statut || 'N/A'}`);
        console.log(`   Tech: ${r.prenom_technicien} ${r.nom_technicien}`);
        console.log(`   Créé: ${r.created_at}`);
        console.log('');
      });
      
      // Extraire le num_inter original
      const originalCheckResult = await pool.query(`
        SELECT 
          SPLIT_PART(num_inter, '_DUP_', 1) as original_num,
          COUNT(*) as count
        FROM interventions
        WHERE num_inter LIKE '%_DUP_%'
        GROUP BY SPLIT_PART(num_inter, '_DUP_', 1)
        ORDER BY count DESC
        LIMIT 10
      `);
      
      console.log('=== NUMÉROS ORIGINAUX (avant _DUP_) ===\n');
      originalCheckResult.rows.forEach((r, i) => {
        console.log(`${i + 1}. ${r.original_num}: ${r.count} entrées avec _DUP_`);
      });
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkDupEntries();
