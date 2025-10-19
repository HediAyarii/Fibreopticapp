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

async function findCorrectRapFormula() {
  console.log('🔍 Recherche de la formule RAP correcte...');
  
  try {
    // 1. Récupérer les données actuelles
    console.log('\n📊 1. Données actuelles:');
    const currentResult = await pool.query(`
      SELECT 
        id,
        nom,
        prenom,
        total_genere,
        salaire_net,
        salaire_brut,
        charge,
        taxe,
        penalite,
        rap
      FROM cout_par_salaire
      WHERE LOWER(nom) LIKE '%moulahi%' AND LOWER(prenom) LIKE '%mohamed%'
    `);
    
    if (currentResult.rows.length === 0) {
      console.log('   ❌ Aucun enregistrement trouvé');
      return;
    }
    
    const row = currentResult.rows[0];
    const totalGenere = parseFloat(row.total_genere);
    const salaireNet = parseFloat(row.salaire_net);
    const salaireBrut = parseFloat(row.salaire_brut);
    const charge = parseFloat(row.charge);
    const taxe = parseFloat(row.taxe);
    const penalite = parseFloat(row.penalite);
    const rapActuel = parseFloat(row.rap);
    
    console.log(`   📊 Total Généré: ${totalGenere}€`);
    console.log(`   📊 Salaire Net: ${salaireNet}€`);
    console.log(`   📊 Salaire Brut: ${salaireBrut}€`);
    console.log(`   📊 Charge: ${charge}€`);
    console.log(`   📊 Taxe: ${taxe}€`);
    console.log(`   📊 Pénalité: ${penalite}€`);
    console.log(`   📊 RAP Actuel: ${rapActuel}€`);
    
    // 2. Analyser la différence entre RAP actuel et attendu
    const rapAttendu = 825.36;
    const difference = rapAttendu - rapActuel;
    console.log(`\n📊 2. Analyse de la différence:`);
    console.log(`   📊 RAP Attendu: ${rapAttendu}€`);
    console.log(`   📊 RAP Actuel: ${rapActuel}€`);
    console.log(`   📊 Différence: ${difference}€`);
    console.log(`   📊 Charge: ${charge}€`);
    
    if (Math.abs(difference - charge) < 0.01) {
      console.log(`   ✅ La différence correspond exactement à la charge !`);
      console.log(`   📊 Formule probable: RAP = Total Généré - (Salaire Net + Taxe + Pénalité)`);
      console.log(`   📊 (sans la charge)`);
    }
    
    // 3. Tester la formule sans la charge
    console.log(`\n📊 3. Test de la formule sans charge:`);
    const totalCoutsSansCharge = salaireNet + taxe + penalite;
    const rapSansCharge = totalGenere - totalCoutsSansCharge;
    
    console.log(`   📊 Calcul: ${totalGenere}€ - (${salaireNet}€ + ${taxe}€ + ${penalite}€)`);
    console.log(`   📊 Total Coûts (sans charge): ${totalCoutsSansCharge}€`);
    console.log(`   📊 RAP (sans charge): ${rapSansCharge}€`);
    
    const differenceSansCharge = Math.abs(rapSansCharge - rapAttendu);
    if (differenceSansCharge < 0.01) {
      console.log(`   ✅ RAP correspond avec la formule sans charge !`);
    } else {
      console.log(`   ❌ RAP ne correspond toujours pas`);
    }
    
    // 4. Tester d'autres formules possibles
    console.log(`\n📊 4. Test d'autres formules:`);
    
    const formules = [
      {
        nom: 'Standard (Net + Charge + Taxe + Pénalité)',
        calcul: totalGenere - (salaireNet + charge + taxe + penalite)
      },
      {
        nom: 'Sans Charge (Net + Taxe + Pénalité)',
        calcul: totalGenere - (salaireNet + taxe + penalite)
      },
      {
        nom: 'Sans Taxe (Net + Charge + Pénalité)',
        calcul: totalGenere - (salaireNet + charge + penalite)
      },
      {
        nom: 'Sans Charge ni Taxe (Net + Pénalité)',
        calcul: totalGenere - (salaireNet + penalite)
      },
      {
        nom: 'Seulement Net',
        calcul: totalGenere - salaireNet
      },
      {
        nom: 'Seulement Brut',
        calcul: totalGenere - salaireBrut
      },
      {
        nom: 'Brut + Taxe',
        calcul: totalGenere - (salaireBrut + taxe)
      },
      {
        nom: 'Brut + Charge',
        calcul: totalGenere - (salaireBrut + charge)
      }
    ];
    
    formules.forEach(formule => {
      const difference = Math.abs(formule.calcul - rapAttendu);
      console.log(`   📊 ${formule.nom}: ${formule.calcul.toFixed(2)}€ (diff: ${difference.toFixed(2)}€)`);
      
      if (difference < 0.01) {
        console.log(`      ✅ CORRESPOND AU RAP ATTENDU !`);
      }
    });
    
    // 5. Mettre à jour avec la formule correcte
    console.log(`\n📊 5. Mise à jour avec la formule correcte:`);
    const rapCorrect = totalGenere - (salaireNet + taxe + penalite);
    
    try {
      await pool.query(`
        UPDATE cout_par_salaire
        SET rap = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [rapCorrect, row.id]);
      
      console.log(`   ✅ RAP mis à jour: ${rapActuel}€ → ${rapCorrect}€`);
    } catch (error) {
      console.log(`   ❌ Erreur lors de la mise à jour: ${error.message}`);
    }
    
    // 6. Vérification finale
    console.log(`\n📊 6. Vérification finale:`);
    const verificationResult = await pool.query(`
      SELECT 
        total_genere,
        salaire_net,
        salaire_brut,
        charge,
        taxe,
        penalite,
        rap
      FROM cout_par_salaire
      WHERE id = $1
    `, [row.id]);
    
    if (verificationResult.rows.length > 0) {
      const finalRow = verificationResult.rows[0];
      console.log(`   📊 Résultat final: ${row.nom} ${row.prenom}`);
      console.log(`      Total Généré: ${finalRow.total_genere}€`);
      console.log(`      Salaire Net: ${finalRow.salaire_net}€`);
      console.log(`      Salaire Brut: ${finalRow.salaire_brut}€`);
      console.log(`      Charge: ${finalRow.charge}€`);
      console.log(`      Taxe: ${finalRow.taxe}€`);
      console.log(`      Pénalité: ${finalRow.penalite}€`);
      console.log(`      RAP: ${finalRow.rap}€`);
      
      const difference = Math.abs(parseFloat(finalRow.rap) - rapAttendu);
      if (difference < 0.01) {
        console.log(`   ✅ RAP correspond au RAP attendu !`);
      } else {
        console.log(`   ❌ RAP ne correspond toujours pas (diff: ${difference}€)`);
      }
    }
    
    console.log('\n🎯 Recherche terminée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

findCorrectRapFormula().catch(console.error);
