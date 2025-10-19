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

async function simpleRapTest() {
  console.log('🧪 Test simple de mise à jour du RAP...');
  
  try {
    // 1. Récupérer un enregistrement
    console.log('\n📊 1. Récupération d\'un enregistrement:');
    const result = await pool.query(`
      SELECT id, nom, prenom, rap FROM cout_par_salaire WHERE id = 1
    `);
    
    if (result.rows.length === 0) {
      console.log('   ❌ Aucun enregistrement trouvé');
      return;
    }
    
    const row = result.rows[0];
    console.log(`   📊 ${row.nom} ${row.prenom}: RAP = ${row.rap}€`);
    
    // 2. Essayer de mettre à jour le RAP
    console.log('\n📊 2. Mise à jour du RAP:');
    const newRap = 999.99; // Valeur de test
    
    try {
      const updateResult = await pool.query(`
        UPDATE cout_par_salaire
        SET rap = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING rap, updated_at
      `, [newRap, row.id]);
      
      if (updateResult.rows.length > 0) {
        const updatedRow = updateResult.rows[0];
        console.log(`   ✅ RAP mis à jour: ${row.rap}€ → ${updatedRow.rap}€`);
        console.log(`   📊 Updated: ${updatedRow.updated_at}`);
      } else {
        console.log(`   ❌ Aucune ligne mise à jour`);
      }
    } catch (error) {
      console.log(`   ❌ Erreur lors de la mise à jour: ${error.message}`);
      return;
    }
    
    // 3. Vérifier la mise à jour
    console.log('\n📊 3. Vérification de la mise à jour:');
    const verifyResult = await pool.query(`
      SELECT rap, updated_at FROM cout_par_salaire WHERE id = $1
    `, [row.id]);
    
    if (verifyResult.rows.length > 0) {
      const verifyRow = verifyResult.rows[0];
      console.log(`   📊 RAP après mise à jour: ${verifyRow.rap}€`);
      console.log(`   📊 Updated: ${verifyRow.updated_at}`);
      
      if (Math.abs(parseFloat(verifyRow.rap) - newRap) < 0.01) {
        console.log(`   ✅ RAP correctement mis à jour`);
      } else {
        console.log(`   ❌ RAP non mis à jour (attendu: ${newRap}€, obtenu: ${verifyRow.rap}€)`);
      }
    } else {
      console.log(`   ❌ Enregistrement non trouvé après mise à jour`);
    }
    
    // 4. Restaurer la valeur originale
    console.log('\n📊 4. Restauration de la valeur originale:');
    try {
      await pool.query(`
        UPDATE cout_par_salaire
        SET rap = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [row.rap, row.id]);
      
      console.log(`   ✅ RAP restauré: ${row.rap}€`);
    } catch (error) {
      console.log(`   ❌ Erreur lors de la restauration: ${error.message}`);
    }
    
    console.log('\n🎯 Test simple terminé !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

simpleRapTest().catch(console.error);
