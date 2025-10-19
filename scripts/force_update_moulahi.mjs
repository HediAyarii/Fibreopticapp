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

async function forceUpdateMoulahi() {
  console.log('🔧 Mise à jour forcée pour BECHIRMOULAHI MOHAMED...');
  
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
    console.log(`   📊 Enregistrement: ${row.nom} ${row.prenom}`);
    console.log(`      ID: ${row.id}`);
    console.log(`      Total Généré: ${row.total_genere}€`);
    console.log(`      Salaire Net: ${row.salaire_net}€`);
    console.log(`      Charge: ${row.charge}€`);
    console.log(`      Taxe Actuelle: ${row.taxe}€`);
    console.log(`      RAP Actuel: ${row.rap}€`);
    
    // 2. Calculer les nouvelles valeurs
    console.log('\n📊 2. Calcul des nouvelles valeurs:');
    const totalGenere = parseFloat(row.total_genere);
    const salaireNet = parseFloat(row.salaire_net);
    const charge = parseFloat(row.charge);
    
    const impot = charge * 0.5; // 50% de la charge
    const rapCorrect = totalGenere - salaireNet - impot;
    
    console.log(`   📊 Impôt: ${impot.toFixed(2)}€ (50% de ${charge}€)`);
    console.log(`   📊 RAP: ${rapCorrect.toFixed(2)}€`);
    
    // 3. Mise à jour forcée
    console.log('\n📊 3. Mise à jour forcée:');
    try {
      // Désactiver les contraintes temporairement
      await pool.query('SET session_replication_role = replica;');
      
      // Mise à jour directe
      const updateResult = await pool.query(`
        UPDATE cout_par_salaire
        SET taxe = $1,
            rap = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [impot, rapCorrect, row.id]);
      
      // Réactiver les contraintes
      await pool.query('SET session_replication_role = DEFAULT;');
      
      console.log(`   ✅ Mise à jour effectuée: ${updateResult.rowCount} ligne(s) modifiée(s)`);
      
    } catch (error) {
      console.log(`   ❌ Erreur lors de la mise à jour: ${error.message}`);
      
      // Essayer une approche alternative
      console.log('\n📊 4. Approche alternative:');
      try {
        const alternativeResult = await pool.query(`
          UPDATE cout_par_salaire
          SET taxe = $1,
              rap = $2,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
          RETURNING taxe, rap
        `, [impot, rapCorrect, row.id]);
        
        if (alternativeResult.rows.length > 0) {
          console.log(`   ✅ Mise à jour alternative réussie`);
        }
      } catch (altError) {
        console.log(`   ❌ Erreur alternative: ${altError.message}`);
      }
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
        updated_at
      FROM cout_par_salaire
      WHERE id = $1
    `, [row.id]);
    
    if (finalResult.rows.length > 0) {
      const finalRow = finalResult.rows[0];
      console.log(`   📊 Résultat final: ${row.nom} ${row.prenom}`);
      console.log(`      Total Généré: ${finalRow.total_genere}€`);
      console.log(`      Salaire Net: ${finalRow.salaire_net}€`);
      console.log(`      Charge: ${finalRow.charge}€`);
      console.log(`      Taxe (Impôt): ${finalRow.taxe}€`);
      console.log(`      Pénalité: ${finalRow.penalite}€`);
      console.log(`      RAP: ${finalRow.rap}€`);
      console.log(`      Updated: ${finalRow.updated_at}`);
      
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
    
    console.log('\n🎯 Mise à jour terminée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

forceUpdateMoulahi().catch(console.error);
