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

async function fixMoulahiRap() {
  console.log('🔧 Correction du RAP pour BECHIRMOULAHI MOHAMED...');
  
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
    
    const currentRow = currentResult.rows[0];
    console.log(`   📊 Enregistrement: ${currentRow.nom} ${currentRow.prenom}`);
    console.log(`      Total Généré: ${currentRow.total_genere}€`);
    console.log(`      Salaire Net: ${currentRow.salaire_net}€`);
    console.log(`      Charge: ${currentRow.charge}€`);
    console.log(`      Taxe: ${currentRow.taxe}€`);
    console.log(`      Pénalité: ${currentRow.penalite}€`);
    console.log(`      RAP Actuel: ${currentRow.rap}€`);
    
    // 2. Calculer le RAP correct
    console.log('\n📊 2. Calcul du RAP correct:');
    const totalGenere = parseFloat(currentRow.total_genere);
    const salaireNet = parseFloat(currentRow.salaire_net);
    const charge = parseFloat(currentRow.charge);
    const taxe = parseFloat(currentRow.taxe);
    const penalite = parseFloat(currentRow.penalite);
    
    const totalCouts = salaireNet + charge + taxe + penalite;
    const rapCorrect = totalGenere - totalCouts;
    
    console.log(`   📊 Calcul: ${totalGenere}€ - (${salaireNet}€ + ${charge}€ + ${taxe}€ + ${penalite}€) = ${rapCorrect}€`);
    console.log(`   📊 RAP Correct: ${rapCorrect}€`);
    console.log(`   📊 RAP Actuel: ${currentRow.rap}€`);
    
    // 3. Vérifier les paiements existants
    console.log('\n📊 3. Vérification des paiements:');
    const paiementsResult = await pool.query(`
      SELECT 
        SUM(montant_verse) as total_paiements
      FROM paiements_employes
      WHERE cout_par_salaire_id = $1
    `, [currentRow.id]);
    
    const totalPaiements = parseFloat(paiementsResult.rows[0].total_paiements) || 0;
    console.log(`   📊 Total des paiements: ${totalPaiements}€`);
    
    // 4. Calculer le RAP final avec paiements
    const rapFinal = rapCorrect - totalPaiements;
    console.log(`   📊 RAP Final: ${rapCorrect}€ - ${totalPaiements}€ = ${rapFinal}€`);
    
    // 5. Mettre à jour le RAP
    console.log('\n📊 4. Mise à jour du RAP:');
    if (Math.abs(parseFloat(currentRow.rap) - rapFinal) > 0.01) {
      try {
        await pool.query(`
          UPDATE cout_par_salaire
          SET rap = $1,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [rapFinal, currentRow.id]);
        
        console.log(`   ✅ RAP mis à jour: ${currentRow.rap}€ → ${rapFinal}€`);
      } catch (error) {
        console.log(`   ❌ Erreur lors de la mise à jour: ${error.message}`);
        return;
      }
    } else {
      console.log(`   ✅ RAP déjà correct`);
    }
    
    // 6. Vérification finale
    console.log('\n📊 5. Vérification finale:');
    const verificationResult = await pool.query(`
      SELECT 
        id,
        nom,
        prenom,
        total_genere,
        salaire_net,
        charge,
        taxe,
        penalite,
        rap,
        (total_genere - (salaire_net + charge + taxe + penalite)) as rap_calcule
      FROM cout_par_salaire
      WHERE id = $1
    `, [currentRow.id]);
    
    if (verificationResult.rows.length > 0) {
      const finalRow = verificationResult.rows[0];
      console.log(`   📊 Résultat final: ${finalRow.nom} ${finalRow.prenom}`);
      console.log(`      Total Généré: ${finalRow.total_genere}€`);
      console.log(`      RAP: ${finalRow.rap}€`);
      console.log(`      RAP Calculé: ${finalRow.rap_calcule}€`);
      
      if (Math.abs(parseFloat(finalRow.rap) - parseFloat(finalRow.rap_calcule)) < 0.01) {
        console.log(`   ✅ RAP cohérent`);
      } else {
        console.log(`   ❌ RAP encore incohérent`);
      }
    }
    
    console.log('\n🎯 Correction terminée !');
    console.log('✅ RAP corrigé pour BECHIRMOULAHI MOHAMED');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

fixMoulahiRap().catch(console.error);
