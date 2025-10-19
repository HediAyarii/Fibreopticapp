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

async function forceRapUpdate() {
  console.log('🔧 Mise à jour forcée du RAP...');
  
  try {
    // 1. Récupérer tous les enregistrements
    console.log('\n📊 1. Récupération de tous les enregistrements:');
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
    
    console.log(`   📊 Enregistrements trouvés: ${allResult.rows.length}`);
    
    // 2. Recalculer et mettre à jour tous les RAP
    console.log('\n📊 2. Recalcul de tous les RAP:');
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
          
          console.log(`   ✅ ${row.nom} ${row.prenom}:`);
          console.log(`      RAP: ${rapActuel}€ → ${rapCorrect}€`);
          console.log(`      Calcul: ${totalGenere}€ - ${salaireNet}€ - ${impot}€ + ${prime}€ = ${rapCorrect}€`);
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
    
    // 4. Vérification finale
    console.log('\n📊 4. Vérification finale:');
    const verificationResult = await pool.query(`
      SELECT 
        nom,
        prenom,
        total_genere,
        salaire_net,
        charge,
        prime,
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
    
    console.log(`\n📊 5. Résultat final:`);
    console.log(`   📊 RAP corrects: ${correctCount}`);
    console.log(`   📊 RAP incorrects: ${incorrectCount}`);
    
    if (incorrectCount === 0) {
      console.log(`\n🎉 TOUS LES RAP SONT MAINTENANT CORRECTS !`);
      console.log(`✅ Formule appliquée: RAP = Total Généré - Salaire Net - Impôt + Prime`);
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

forceRapUpdate().catch(console.error);
