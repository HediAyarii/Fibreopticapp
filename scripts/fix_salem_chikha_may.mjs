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

async function fixSalemChikhaMay() {
  console.log('🔧 Correction de Salem Chikha pour mai 2025...');
  
  try {
    // 1. Récupérer l'entrée actuelle
    const currentQuery = `
      SELECT id, total_genere, rap
      FROM cout_par_salaire
      WHERE LOWER(nom) = LOWER('CHIKHA')
        AND LOWER(prenom) = LOWER('SALEM')
        AND mois = 5
        AND annee = 2025
    `;
    
    const currentResult = await pool.query(currentQuery);
    if (currentResult.rows.length === 0) {
      console.log('❌ Aucune entrée trouvée pour Salem Chikha en mai 2025');
      return;
    }
    
    const currentCout = currentResult.rows[0];
    const currentTotalGenere = parseFloat(currentCout.total_genere || 0);
    const correctTotalGenere = 3770.00; // Valeur correcte du Bénéfice Brut
    
    console.log(`📊 Valeur actuelle: ${currentTotalGenere.toFixed(2)}€`);
    console.log(`📊 Valeur correcte: ${correctTotalGenere.toFixed(2)}€`);
    console.log(`📊 Différence: ${(correctTotalGenere - currentTotalGenere).toFixed(2)}€`);
    
    if (Math.abs(currentTotalGenere - correctTotalGenere) < 0.01) {
      console.log('✅ Déjà correct, aucune modification nécessaire');
      return;
    }
    
    // 2. Mettre à jour total_genere
    console.log('\n🔄 Mise à jour du Total Généré...');
    await pool.query(
      `UPDATE cout_par_salaire SET total_genere = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [correctTotalGenere, currentCout.id]
    );
    console.log('✅ Total Généré mis à jour');
    
    // 3. Recalculer le RAP
    console.log('\n🔄 Recalcul du RAP...');
    const rapResult = await pool.query(
      `SELECT calculer_rap_avec_paiements($1) as rap_actuel`,
      [currentCout.id]
    );
    const newRap = parseFloat(rapResult.rows[0].rap_actuel || 0);
    
    await pool.query(
      `UPDATE cout_par_salaire SET rap = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [newRap, currentCout.id]
    );
    console.log(`✅ RAP recalculé: ${newRap.toFixed(2)}€`);
    
    // 4. Vérification finale
    console.log('\n📊 Vérification finale:');
    const finalResult = await pool.query(`
      SELECT 
        nom,
        prenom,
        total_genere,
        salaire_net,
        charge,
        cout_total,
        taxe,
        penalite,
        rap,
        mois,
        annee
      FROM cout_par_salaire
      WHERE id = $1
    `, [currentCout.id]);
    
    const finalData = finalResult.rows[0];
    console.log(`✅ Salem Chikha - Mai 2025 (après correction):`);
    console.log(`   - Total Généré: ${parseFloat(finalData.total_genere || 0).toFixed(2)}€`);
    console.log(`   - Salaire Net: ${parseFloat(finalData.salaire_net || 0).toFixed(2)}€`);
    console.log(`   - Charge: ${parseFloat(finalData.charge || 0).toFixed(2)}€`);
    console.log(`   - Coût Total: ${parseFloat(finalData.cout_total || 0).toFixed(2)}€`);
    console.log(`   - Taxe: ${parseFloat(finalData.taxe || 0).toFixed(2)}%`);
    console.log(`   - Pénalité: ${parseFloat(finalData.penalite || 0).toFixed(2)}€`);
    console.log(`   - RAP: ${parseFloat(finalData.rap || 0).toFixed(2)}€`);
    
    console.log('\n🎯 CORRECTION TERMINÉE !');
    console.log('✅ Le Total Généré de Salem Chikha est maintenant cohérent avec le Bénéfice Brut');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

fixSalemChikhaMay().catch(console.error);

