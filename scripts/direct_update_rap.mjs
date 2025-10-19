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

async function directUpdateRap() {
  console.log('🔧 Mise à jour directe des RAP...');
  
  try {
    // 1. Mise à jour directe avec SQL
    console.log('\n📊 1. Mise à jour directe avec SQL:');
    
    const updateResult = await pool.query(`
      UPDATE cout_par_salaire
      SET 
        taxe = charge * 0.5,
        rap = total_genere - salaire_net - (charge * 0.5),
        updated_at = CURRENT_TIMESTAMP
      WHERE id > 0
      RETURNING id, nom, prenom, taxe, rap
    `);
    
    console.log(`   ✅ ${updateResult.rows.length} enregistrements mis à jour`);
    
    // 2. Vérification des résultats
    console.log('\n📊 2. Vérification des résultats:');
    updateResult.rows.forEach(row => {
      console.log(`   📊 ${row.nom} ${row.prenom}: Taxe=${row.taxe}€, RAP=${row.rap}€`);
    });
    
    // 3. Vérification finale
    console.log('\n📊 3. Vérification finale:');
    const verificationResult = await pool.query(`
      SELECT 
        nom,
        prenom,
        
        total_genere,
        salaire_net,
        charge,
        taxe,
        rap,
        (total_genere - salaire_net - taxe) as rap_calcule
      FROM cout_par_salaire
      ORDER BY nom, prenom
    `);
    
    let correctCount = 0;
    let incorrectCount = 0;
    
    for (const row of verificationResult.rows) {
      const difference = Math.abs(parseFloat(row.rap) - parseFloat(row.rap_calcule));
      if (difference < 0.01) {
        correctCount++;
        console.log(`   ✅ ${row.nom} ${row.prenom}: RAP correct (${row.rap}€)`);
      } else {
        incorrectCount++;
        console.log(`   ❌ ${row.nom} ${row.prenom}: RAP incorrect (${row.rap}€ vs ${row.rap_calcule}€)`);
      }
    }
    
    console.log(`\n📊 4. Résultat final:`);
    console.log(`   📊 RAP corrects: ${correctCount}`);
    console.log(`   📊 RAP incorrects: ${incorrectCount}`);
    
    if (incorrectCount === 0) {
      console.log(`\n🎉 TOUS LES RAP SONT MAINTENANT CORRECTS !`);
      console.log(`✅ Formule appliquée: RAP = Total Généré - Salaire Net - Impôt`);
      console.log(`✅ Où Impôt = 50% × Charge`);
    } else {
      console.log(`\n⚠️  ${incorrectCount} RAP restent incorrects`);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

directUpdateRap().catch(console.error);
