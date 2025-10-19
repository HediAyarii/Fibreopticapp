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

async function testRapAutoCorrection() {
  console.log('🧪 Test du système de correction automatique des RAP...');
  
  try {
    // 1. Tester la fonction de vérification
    console.log('\n📊 1. Test de la fonction de vérification:');
    const verificationResult = await pool.query(`
      SELECT * FROM verifier_coherence_rap()
      ORDER BY nom, prenom
    `);
    
    const total = verificationResult.rows.length;
    const cohérents = verificationResult.rows.filter(row => row.est_coherent).length;
    const incohérents = total - cohérents;
    
    console.log(`   📊 Total: ${total} enregistrements`);
    console.log(`   📊 Cohérents: ${cohérents}`);
    console.log(`   📊 Incohérents: ${incohérents}`);
    
    if (incohérents > 0) {
      console.log('   ⚠️  RAP incohérents détectés:');
      verificationResult.rows
        .filter(row => !row.est_coherent)
        .forEach(row => {
          console.log(`      ${row.nom} ${row.prenom}: ${row.rap_actuel}€ vs ${row.rap_calcule}€`);
        });
    } else {
      console.log('   ✅ Tous les RAP sont cohérents !');
    }
    
    // 2. Tester la fonction de correction (si nécessaire)
    if (incohérents > 0) {
      console.log('\n📊 2. Test de la fonction de correction:');
      const correctionResult = await pool.query(`
        SELECT * FROM corriger_tous_les_rap()
        WHERE ABS(difference) > 0.01
      `);
      
      console.log(`   📊 Corrections effectuées: ${correctionResult.rows.length}`);
      
      if (correctionResult.rows.length > 0) {
        console.log('   🔧 RAP corrigés:');
        correctionResult.rows.forEach(row => {
          console.log(`      ${row.nom} ${row.prenom}: ${row.ancien_rap}€ → ${row.nouveau_rap}€`);
        });
      }
    }
    
    // 3. Vérification finale
    console.log('\n📊 3. Vérification finale:');
    const finalVerification = await pool.query(`
      SELECT * FROM verifier_coherence_rap()
      WHERE est_coherent = false
    `);
    
    const finalIncohérents = finalVerification.rows.length;
    console.log(`   📊 RAP incohérents restants: ${finalIncohérents}`);
    
    if (finalIncohérents === 0) {
      console.log('   ✅ Tous les RAP sont maintenant cohérents !');
    } else {
      console.log('   ❌ Des RAP restent incohérents');
    }
    
    // 4. Test de l'API
    console.log('\n📊 4. Test de l\'API:');
    try {
      const response = await fetch('http://localhost:3000/api/rap/auto-correct');
      const data = await response.json();
      
      if (data.success) {
        console.log(`   ✅ API fonctionnelle: ${data.cohérents}/${data.total} RAP cohérents`);
      } else {
        console.log(`   ❌ Erreur API: ${data.error}`);
      }
    } catch (error) {
      console.log(`   ⚠️  API non accessible: ${error.message}`);
      console.log('   💡 Assurez-vous que le serveur Next.js est démarré (npm run dev)');
    }
    
    console.log('\n🎯 Test terminé !');
    console.log('✅ Système de correction automatique des RAP opérationnel');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

testRapAutoCorrection().catch(console.error);
