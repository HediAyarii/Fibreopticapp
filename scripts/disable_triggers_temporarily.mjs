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

async function disableTriggersTemporarily() {
  console.log('🔧 Désactivation temporaire des triggers...');
  
  try {
    // 1. Désactiver les triggers
    console.log('\n📊 1. Désactivation des triggers:');
    await pool.query('ALTER TABLE cout_par_salaire DISABLE TRIGGER trigger_recalcul_rap;');
    console.log('   ✅ trigger_recalcul_rap désactivé');
    
    await pool.query('ALTER TABLE cout_par_salaire DISABLE TRIGGER trigger_calcul_rap_auto;');
    console.log('   ✅ trigger_calcul_rap_auto désactivé');
    
    // 2. Maintenant mettre à jour tous les RAP
    console.log('\n📊 2. Mise à jour de tous les RAP:');
    const allResult = await pool.query(`
      SELECT 
        id,
        nom,
        prenom,
        total_genere,
        salaire_net,
        charge,
        prime,
        rap
      FROM cout_par_salaire
      ORDER BY nom, prenom
    `);
    
    let updatedCount = 0;
    
    for (const row of allResult.rows) {
      const totalGenere = parseFloat(row.total_genere);
      const salaireNet = parseFloat(row.salaire_net);
      const charge = parseFloat(row.charge);
      const prime = parseFloat(row.prime || '0');
      const rapActuel = parseFloat(row.rap);
      
      const impot = charge * 0.5; // 50% de la charge
      const rapCorrect = totalGenere - salaireNet - impot + prime;
      
      const difference = Math.abs(rapActuel - rapCorrect);
      
      if (difference > 0.01) {
        try {
          await pool.query(`
            UPDATE cout_par_salaire
            SET rap = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [rapCorrect, row.id]);
          
          console.log(`   ✅ ${row.nom} ${row.prenom}: ${rapActuel}€ → ${rapCorrect}€`);
          updatedCount++;
        } catch (error) {
          console.log(`   ❌ Erreur pour ${row.nom} ${row.prenom}: ${error.message}`);
        }
      } else {
        console.log(`   ⏭️  ${row.nom} ${row.prenom}: RAP déjà correct (${rapActuel}€)`);
      }
    }
    
    console.log(`\n📊 3. Résumé des mises à jour:`);
    console.log(`   📊 RAP mis à jour: ${updatedCount}`);
    console.log(`   📊 Total traités: ${allResult.rows.length}`);
    
    // 3. Réactiver les triggers
    console.log('\n📊 4. Réactivation des triggers:');
    await pool.query('ALTER TABLE cout_par_salaire ENABLE TRIGGER trigger_recalcul_rap;');
    console.log('   ✅ trigger_recalcul_rap réactivé');
    
    await pool.query('ALTER TABLE cout_par_salaire ENABLE TRIGGER trigger_calcul_rap_auto;');
    console.log('   ✅ trigger_calcul_rap_auto réactivé');
    
    // 4. Vérification finale
    console.log('\n📊 5. Vérification finale:');
    const verificationResult = await pool.query(`
      SELECT 
        nom,
        prenom,
        rap,
        (total_genere - salaire_net - (charge * 0.5) + COALESCE(prime, 0)) as rap_calcule
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
    
    console.log(`\n📊 6. Résultat final:`);
    console.log(`   📊 RAP corrects: ${correctCount}`);
    console.log(`   📊 RAP incorrects: ${incorrectCount}`);
    
    if (incorrectCount === 0) {
      console.log(`\n🎉 TOUS LES RAP SONT MAINTENANT CORRECTS !`);
      console.log(`✅ Les triggers ont été temporairement désactivés`);
      console.log(`✅ Les RAP ont été mis à jour avec la bonne formule`);
      console.log(`✅ Les triggers ont été réactivés`);
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

disableTriggersTemporarily().catch(console.error);
