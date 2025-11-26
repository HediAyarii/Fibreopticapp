const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'finalfibre_db',
  password: process.env.DB_PASSWORD || 'salamboo',
  port: process.env.DB_PORT || 5432,
});

async function deleteSpecificDuplicate() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Vérification du doublon pour num_inter = 133610416...\n');
    
    // Vérifier les enregistrements existants
    const checkQuery = `
      SELECT id, num_inter, date_rdv, cloture_hotline, created_at 
      FROM interventions 
      WHERE num_inter = '133610416'
      ORDER BY created_at ASC
    `;
    
    const checkResult = await client.query(checkQuery);
    console.log(`📊 Nombre d'enregistrements trouvés: ${checkResult.rows.length}\n`);
    
    if (checkResult.rows.length === 0) {
      console.log('✅ Aucun enregistrement trouvé avec ce num_inter.');
      return;
    }
    
    if (checkResult.rows.length === 1) {
      console.log('✅ Un seul enregistrement trouvé, pas de doublon.');
      console.log(checkResult.rows[0]);
      return;
    }
    
    // Afficher tous les enregistrements
    console.log('📋 Enregistrements trouvés:');
    checkResult.rows.forEach((row, index) => {
      console.log(`\n${index + 1}. ID: ${row.id}`);
      console.log(`   date_rdv: ${row.date_rdv}`);
      console.log(`   cloture_hotline: ${row.cloture_hotline}`);
      console.log(`   created_at: ${row.created_at}`);
    });
    
    // Garder le plus ancien (created_at le plus petit), supprimer les autres
    const keepId = checkResult.rows[0].id;
    const deleteIds = checkResult.rows.slice(1).map(row => row.id);
    
    console.log(`\n✅ On garde l'enregistrement ID: ${keepId} (le plus ancien)`);
    console.log(`🗑️  On supprime les doublons IDs: ${deleteIds.join(', ')}\n`);
    
    // Supprimer les doublons
    const deleteQuery = `
      DELETE FROM interventions 
      WHERE id = ANY($1::int[])
      RETURNING id, num_inter
    `;
    
    const deleteResult = await client.query(deleteQuery, [deleteIds]);
    
    console.log(`✅ ${deleteResult.rows.length} doublon(s) supprimé(s):`);
    deleteResult.rows.forEach(row => {
      console.log(`   - ID ${row.id} (num_inter: ${row.num_inter})`);
    });
    
    // Vérifier le résultat final
    const finalCheck = await client.query(checkQuery);
    console.log(`\n📊 Vérification finale: ${finalCheck.rows.length} enregistrement(s) restant(s)\n`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

deleteSpecificDuplicate();
