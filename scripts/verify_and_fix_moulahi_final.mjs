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

async function verifyAndFixMoulahiFinal() {
  console.log('🔍 Vérification et correction finale pour BECHIRMOULAHI MOHAMED...');
  
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
    console.log(`      Taxe: ${row.taxe}€`);
    console.log(`      Pénalité: ${row.penalite}€`);
    console.log(`      RAP Actuel: ${row.rap}€`);
    
    // 2. Calculer avec la formule correcte
    console.log('\n📊 2. Calcul avec la formule correcte:');
    const totalGenere = parseFloat(row.total_genere);
    const salaireNet = parseFloat(row.salaire_net);
    const charge = parseFloat(row.charge);
    const penalite = parseFloat(row.penalite);
    
    // Formule correcte : RAP = Total Généré - Salaire Net - Impôt
    // Où Impôt = 50% × Charge
    const impot = charge * 0.5; // 50% de la charge
    const rapCorrect = totalGenere - salaireNet - impot;
    
    console.log(`   📊 Formule: RAP = Total Généré - Salaire Net - Impôt`);
    console.log(`   📊 Où Impôt = 50% × Charge`);
    console.log(`   📊 Calcul: ${totalGenere}€ - ${salaireNet}€ - ${impot.toFixed(2)}€ = ${rapCorrect.toFixed(2)}€`);
    console.log(`   📊 Impôt: ${impot.toFixed(2)}€ (50% de ${charge}€)`);
    console.log(`   📊 RAP Correct: ${rapCorrect.toFixed(2)}€`);
    
    // 3. Vérifier les paiements
    console.log('\n📊 3. Vérification des paiements:');
    const paiementsResult = await pool.query(`
      SELECT 
        SUM(montant_verse) as total_paiements
      FROM paiements_employes
      WHERE cout_par_salaire_id = $1
    `, [row.id]);
    
    const totalPaiements = parseFloat(paiementsResult.rows[0].total_paiements) || 0;
    console.log(`   📊 Total des paiements: ${totalPaiements}€`);
    
    const rapFinal = rapCorrect - totalPaiements;
    console.log(`   📊 RAP Final: ${rapCorrect.toFixed(2)}€ - ${totalPaiements}€ = ${rapFinal.toFixed(2)}€`);
    
    // 4. Mettre à jour la base de données
    console.log('\n📊 4. Mise à jour de la base de données:');
    try {
      await pool.query(`
        UPDATE cout_par_salaire
        SET taxe = $1,
            rap = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [impot, rapFinal, row.id]);
      
      console.log(`   ✅ Taxe mise à jour: ${row.taxe}€ → ${impot.toFixed(2)}€`);
      console.log(`   ✅ RAP mis à jour: ${row.rap}€ → ${rapFinal.toFixed(2)}€`);
    } catch (error) {
      console.log(`   ❌ Erreur lors de la mise à jour: ${error.message}`);
      return;
    }
    
    // 5. Vérification finale
    console.log('\n📊 5. Vérification finale:');
    const verificationResult = await pool.query(`
      SELECT 
        total_genere,
        salaire_net,
        salaire_brut,
        charge,
        taxe,
        penalite,
        rap,
        (total_genere - salaire_net - taxe) as rap_calcule
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
      console.log(`      Taxe (Impôt): ${finalRow.taxe}€`);
      console.log(`      Pénalité: ${finalRow.penalite}€`);
      console.log(`      RAP: ${finalRow.rap}€`);
      console.log(`      RAP Calculé: ${finalRow.rap_calcule}€`);
      
      const difference = Math.abs(parseFloat(finalRow.rap) - parseFloat(finalRow.rap_calcule));
      if (difference < 0.01) {
        console.log(`   ✅ RAP cohérent`);
      } else {
        console.log(`   ❌ RAP incohérent (diff: ${difference}€)`);
      }
      
      // Vérifier si le RAP correspond au RAP attendu (825.36€)
      const rapAttendu = 825.36;
      const differenceAttendu = Math.abs(parseFloat(finalRow.rap) - rapAttendu);
      console.log(`   📊 RAP Attendu: ${rapAttendu}€`);
      console.log(`   📊 Différence avec attendu: ${differenceAttendu}€`);
      
      if (differenceAttendu < 0.01) {
        console.log(`   ✅ RAP correspond au RAP attendu !`);
      } else {
        console.log(`   ❌ RAP ne correspond pas au RAP attendu`);
      }
    }
    
    console.log('\n🎯 Vérification terminée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

verifyAndFixMoulahiFinal().catch(console.error);
