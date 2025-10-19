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

async function checkDatabaseDirectly() {
  console.log('🔍 Vérification directe de la base de données...');
  
  try {
    // 1. Vérifier les données actuelles
    console.log('\n📊 1. Données actuelles dans la base:');
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
        rap,
        updated_at
      FROM cout_par_salaire
      WHERE LOWER(nom) LIKE '%moulahi%' AND LOWER(prenom) LIKE '%mohamed%'
    `);
    
    if (currentResult.rows.length === 0) {
      console.log('   ❌ Aucun enregistrement trouvé');
      return;
    }
    
    const row = currentResult.rows[0];
    console.log(`   📊 Enregistrement: ${row.nom} ${row.prenom}`);
    console.log(`      ID: ${row.id}`);
    console.log(`      Total Généré: ${row.total_genere}€`);
    console.log(`      Salaire Net: ${row.salaire_net}€`);
    console.log(`      Salaire Brut: ${row.salaire_brut}€`);
    console.log(`      Charge: ${row.charge}€`);
    console.log(`      Taxe: ${row.taxe}€`);
    console.log(`      Pénalité: ${row.penalite}€`);
    console.log(`      RAP: ${row.rap}€`);
    console.log(`      Updated: ${row.updated_at}`);
    
    // 2. Calculer le RAP correct
    console.log('\n📊 2. Calcul du RAP correct:');
    const totalGenere = parseFloat(row.total_genere);
    const salaireNet = parseFloat(row.salaire_net);
    const charge = parseFloat(row.charge);
    const penalite = parseFloat(row.penalite);
    
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
        id,
        montant_verse,
        date_paiement,
        methode_paiement,
        reference_paiement,
        commentaires,
        statut
      FROM paiements_employes
      WHERE cout_par_salaire_id = $1
      ORDER BY date_paiement DESC
    `, [row.id]);
    
    console.log(`   📊 Paiements trouvés: ${paiementsResult.rows.length}`);
    let totalPaiements = 0;
    paiementsResult.rows.forEach((paiement, index) => {
      console.log(`      ${index + 1}. ${paiement.montant_verse}€ le ${paiement.date_paiement} (${paiement.methode_paiement})`);
      totalPaiements += parseFloat(paiement.montant_verse);
    });
    
    if (totalPaiements > 0) {
      console.log(`   📊 Total des paiements: ${totalPaiements}€`);
    } else {
      console.log(`   📊 Aucun paiement enregistré`);
    }
    
    const rapFinal = rapCorrect - totalPaiements;
    console.log(`   📊 RAP Final: ${rapCorrect.toFixed(2)}€ - ${totalPaiements}€ = ${rapFinal.toFixed(2)}€`);
    
    // 4. Mettre à jour avec la formule correcte
    console.log('\n📊 4. Mise à jour avec la formule correcte:');
    try {
      const updateResult = await pool.query(`
        UPDATE cout_par_salaire
        SET taxe = $1,
            rap = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING taxe, rap, updated_at
      `, [impot, rapFinal, row.id]);
      
      if (updateResult.rows.length > 0) {
        const updatedRow = updateResult.rows[0];
        console.log(`   ✅ Mise à jour réussie:`);
        console.log(`      Taxe: ${row.taxe}€ → ${updatedRow.taxe}€`);
        console.log(`      RAP: ${row.rap}€ → ${updatedRow.rap}€`);
        console.log(`      Updated: ${updatedRow.updated_at}`);
      }
    } catch (error) {
      console.log(`   ❌ Erreur lors de la mise à jour: ${error.message}`);
      return;
    }
    
    // 5. Vérification finale
    console.log('\n📊 5. Vérification finale:');
    const finalResult = await pool.query(`
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
    
    if (finalResult.rows.length > 0) {
      const finalRow = finalResult.rows[0];
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

checkDatabaseDirectly().catch(console.error);
