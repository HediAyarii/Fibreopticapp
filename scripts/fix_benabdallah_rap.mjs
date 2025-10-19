import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024',
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function fixBenabdallahRap() {
  console.log('🔧 Correction du RAP pour BENADBALLAH TAOUFIK...');
  
  try {
    // 1. Vérifier l'état actuel
    console.log('\n📊 1. État actuel de BENADBALLAH TAOUFIK:');
    const currentResult = await pool.query(`
      SELECT id, nom, prenom, mois, annee, total_genere, salaire_net, charge, taxe, penalite, rap
      FROM cout_par_salaire
      WHERE LOWER(nom) = 'benadballah' AND LOWER(prenom) = 'taoufik'
        AND mois = 5 AND annee = 2025
    `);
    
    if (currentResult.rows.length === 0) {
      console.log('   ❌ Aucun enregistrement trouvé pour BENADBALLAH TAOUFIK');
      return;
    }
    
    const record = currentResult.rows[0];
    console.log(`   📊 Total généré: ${record.total_genere}€`);
    console.log(`   📊 Salaire net: ${record.salaire_net}€`);
    console.log(`   📊 Charge: ${record.charge}€`);
    console.log(`   📊 Taxe: ${record.taxe}€`);
    console.log(`   📊 Pénalité: ${record.penalite}€`);
    console.log(`   📊 RAP actuel: ${record.rap}€`);
    
    // 2. Calculer le RAP manuellement
    console.log('\n📊 2. Calcul manuel du RAP:');
    const totalGenere = parseFloat(record.total_genere || 0);
    const salaireNet = parseFloat(record.salaire_net || 0);
    const charge = parseFloat(record.charge || 0);
    const taxe = parseFloat(record.taxe || 0);
    const penalite = parseFloat(record.penalite || 0);
    
    // RAP = Total généré - (Salaire net + Charge + Taxe + Pénalité)
    const rapManuel = totalGenere - (salaireNet + charge + taxe + penalite);
    
    console.log(`   📊 Calcul: ${totalGenere.toFixed(2)} - (${salaireNet.toFixed(2)} + ${charge.toFixed(2)} + ${taxe.toFixed(2)} + ${penalite.toFixed(2)})`);
    console.log(`   📊 RAP calculé: ${rapManuel.toFixed(2)}€`);
    
    // 3. Vérifier si la fonction RAP existe
    console.log('\n📊 3. Vérification de la fonction RAP:');
    try {
      const functionResult = await pool.query(`
        SELECT calculer_rap_avec_paiements($1, $2, $3, $4, $5) as rap_calcule
      `, [totalGenere, salaireNet, charge, taxe, penalite]);
      
      const rapFonction = parseFloat(functionResult.rows[0].rap_calcule || 0);
      console.log(`   📊 RAP via fonction: ${rapFonction.toFixed(2)}€`);
      
      // Utiliser la fonction si elle existe
      await pool.query(
        `UPDATE cout_par_salaire
         SET rap = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [rapFonction, record.id]
      );
      
      console.log(`   ✅ RAP mis à jour via fonction: ${rapFonction.toFixed(2)}€`);
      
    } catch (functionError) {
      console.log(`   ⚠️ Fonction RAP non disponible, utilisation du calcul manuel`);
      
      // Utiliser le calcul manuel
      await pool.query(
        `UPDATE cout_par_salaire
         SET rap = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [rapManuel, record.id]
      );
      
      console.log(`   ✅ RAP mis à jour manuellement: ${rapManuel.toFixed(2)}€`);
    }
    
    // 4. Vérification finale
    console.log('\n📊 4. Vérification finale:');
    const finalResult = await pool.query(`
      SELECT total_genere, salaire_net, charge, taxe, penalite, rap
      FROM cout_par_salaire
      WHERE id = $1
    `, [record.id]);
    
    const finalRecord = finalResult.rows[0];
    console.log(`   ✅ Total généré: ${finalRecord.total_genere}€`);
    console.log(`   ✅ Salaire net: ${finalRecord.salaire_net}€`);
    console.log(`   ✅ Charge: ${finalRecord.charge}€`);
    console.log(`   ✅ Taxe: ${finalRecord.taxe}€`);
    console.log(`   ✅ Pénalité: ${finalRecord.penalite}€`);
    console.log(`   ✅ RAP final: ${finalRecord.rap}€`);
    
    // 5. Vérification de la cohérence
    const totalDepenses = parseFloat(finalRecord.salaire_net) + parseFloat(finalRecord.charge) + parseFloat(finalRecord.taxe) + parseFloat(finalRecord.penalite);
    const rapAttendu = parseFloat(finalRecord.total_genere) - totalDepenses;
    const difference = Math.abs(parseFloat(finalRecord.rap) - rapAttendu);
    
    console.log('\n📊 5. Vérification de la cohérence:');
    console.log(`   📊 Total dépenses: ${totalDepenses.toFixed(2)}€`);
    console.log(`   📊 RAP attendu: ${rapAttendu.toFixed(2)}€`);
    console.log(`   📊 Différence: ${difference.toFixed(2)}€`);
    
    if (difference < 0.01) {
      console.log(`   ✅ RAP cohérent !`);
    } else {
      console.log(`   ⚠️ RAP incohérent, correction nécessaire`);
    }
    
    console.log('\n🎯 RAP corrigé avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

fixBenabdallahRap().catch(console.error);

