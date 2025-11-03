const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024'
});

async function checkDuplicates() {
  try {
    console.log('🔍 Vérification des doublons dans la base...\n');
    
    // Compter le total d'interventions
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM interventions');
    console.log(`📊 Total interventions: ${totalResult.rows[0].total}\n`);
    
    // Trouver les doublons
    const result = await pool.query(`
      SELECT 
        num_inter, 
        date_rdv, 
        statut, 
        COUNT(*) as count,
        ARRAY_AGG(id ORDER BY created_at) as ids
      FROM interventions 
      WHERE num_inter IS NOT NULL 
      GROUP BY num_inter, date_rdv, statut 
      HAVING COUNT(*) > 1 
      ORDER BY count DESC 
      LIMIT 20
    `);
    
    console.log('=== DOUBLONS DÉTECTÉS ===');
    console.log(`Total groupes de doublons: ${result.rows.length}\n`);
    
    if (result.rows.length === 0) {
      console.log('✅ Aucun doublon trouvé!');
    } else {
      result.rows.forEach((r, i) => {
        console.log(`${i + 1}. Num: ${r.num_inter}`);
        console.log(`   Date: ${r.date_rdv || 'N/A'}`);
        console.log(`   Statut: ${r.statut || 'N/A'}`);
        console.log(`   Occurrences: ${r.count} fois`);
        console.log(`   IDs: ${r.ids.join(', ')}`);
        console.log('');
      });
      
      const totalDuplicates = result.rows.reduce((sum, r) => sum + (r.count - 1), 0);
      console.log(`🗑️  Total à supprimer: ${totalDuplicates} lignes`);
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkDuplicates();
