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

async function fixMoulahiTaxeInconsistency() {
  console.log('🔧 Correction de l\'incohérence de taxe pour BECHIRMOULAHI MOHAMED...');
  
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
      console.log('   ❌ Aucun enregistrement BECHIRMOULAHI MOHAMED trouvé');
      return;
    }
    
    const row = currentResult.rows[0];
    console.log(`   📊 Enregistrement: ${row.nom} ${row.prenom}`);
    console.log(`      Total Généré: ${row.total_genere}€`);
    console.log(`      Salaire Net: ${row.salaire_net}€`);
    console.log(`      Salaire Brut: ${row.salaire_brut}€`);
    console.log(`      Charge: ${row.charge}€`);
    console.log(`      Taxe Actuelle: ${row.taxe}€`);
    console.log(`      Pénalité: ${row.penalite}€`);
    console.log(`      RAP Actuel: ${row.rap}€`);
    
    // 2. Calculer la taxe correcte (50% du salaire brut)
    const salaireBrut = parseFloat(row.salaire_brut);
    const taxeCorrecte = salaireBrut * 0.5; // 50%
    console.log(`\n📊 2. Calcul de la taxe correcte:`);
    console.log(`   📊 Salaire Brut: ${salaireBrut}€`);
    console.log(`   📊 Taxe 50%: ${salaireBrut}€ × 0.5 = ${taxeCorrecte}€`);
    
    // 3. Vérifier si la taxe actuelle est correcte
    const taxeActuelle = parseFloat(row.taxe);
    const differenceTaxe = Math.abs(taxeActuelle - taxeCorrecte);
    
    if (differenceTaxe < 0.01) {
      console.log(`   ✅ Taxe déjà correcte`);
    } else {
      console.log(`   ❌ Taxe incorrecte: ${taxeActuelle}€ vs ${taxeCorrecte}€`);
      console.log(`   📊 Différence: ${differenceTaxe}€`);
      
      // 4. Mettre à jour la taxe
      console.log(`\n📊 3. Mise à jour de la taxe:`);
      try {
        await pool.query(`
          UPDATE cout_par_salaire
          SET taxe = $1,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [taxeCorrecte, row.id]);
        
        console.log(`   ✅ Taxe mise à jour: ${taxeActuelle}€ → ${taxeCorrecte}€`);
      } catch (error) {
        console.log(`   ❌ Erreur lors de la mise à jour: ${error.message}`);
        return;
      }
    }
    
    // 5. Recalculer le RAP avec la taxe correcte
    console.log(`\n📊 4. Recalcul du RAP:`);
    const totalGenere = parseFloat(row.total_genere);
    const salaireNet = parseFloat(row.salaire_net);
    const charge = parseFloat(row.charge);
    const penalite = parseFloat(row.penalite);
    
    const totalCouts = salaireNet + charge + taxeCorrecte + penalite;
    const rapCorrect = totalGenere - totalCouts;
    
    console.log(`   📊 Calcul: ${totalGenere}€ - (${salaireNet}€ + ${charge}€ + ${taxeCorrecte}€ + ${penalite}€)`);
    console.log(`   📊 Total Coûts: ${totalCouts}€`);
    console.log(`   📊 RAP Correct: ${rapCorrect}€`);
    
    // 6. Mettre à jour le RAP
    console.log(`\n📊 5. Mise à jour du RAP:`);
    try {
      await pool.query(`
        UPDATE cout_par_salaire
        SET rap = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [rapCorrect, row.id]);
      
      console.log(`   ✅ RAP mis à jour: ${row.rap}€ → ${rapCorrect}€`);
    } catch (error) {
      console.log(`   ❌ Erreur lors de la mise à jour du RAP: ${error.message}`);
      return;
    }
    
    // 7. Vérification finale
    console.log(`\n📊 6. Vérification finale:`);
    const verificationResult = await pool.query(`
      SELECT 
        total_genere,
        salaire_net,
        salaire_brut,
        charge,
        taxe,
        penalite,
        rap,
        (total_genere - (salaire_net + charge + taxe + penalite)) as rap_calcule
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
      console.log(`      RAP Calculé: ${finalRow.rap_calcule}€`);
      
      const difference = Math.abs(parseFloat(finalRow.rap) - parseFloat(finalRow.rap_calcule));
      if (difference < 0.01) {
        console.log(`   ✅ RAP cohérent`);
      } else {
        console.log(`   ❌ RAP incohérent (diff: ${difference}€)`);
      }
    }
    
    console.log('\n🎯 Correction terminée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

fixMoulahiTaxeInconsistency().catch(console.error);
