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

async function debugRapCalculationIssue() {
  console.log('🔍 Diagnostic du calcul RAP incorrect...');
  
  try {
    // 1. Vérifier les données pour BECHIRMOULAHI MOHAMED
    console.log('\n📊 1. Données pour BECHIRMOULAHI MOHAMED:');
    const moulahiResult = await pool.query(`
      SELECT 
        id,
        nom,
        prenom,
        matricule,
        mois,
        annee,
        total_genere,
        salaire_net,
        charge,
        taxe,
        penalite,
        rap,
        created_at,
        updated_at
      FROM cout_par_salaire
      WHERE LOWER(nom) LIKE '%moulahi%' AND LOWER(prenom) LIKE '%mohamed%'
      ORDER BY mois DESC, annee DESC
    `);
    
    console.log(`   📊 Résultats: ${moulahiResult.rows.length} enregistrements`);
    moulahiResult.rows.forEach((row, index) => {
      console.log(`      ${index + 1}. ID: ${row.id}, Mois: ${row.mois}/${row.annee}`);
      console.log(`         Total Généré: ${row.total_genere}€`);
      console.log(`         Salaire Net: ${row.salaire_net}€`);
      console.log(`         Charge: ${row.charge}€`);
      console.log(`         Taxe: ${row.taxe}€`);
      console.log(`         Pénalité: ${row.penalite}€`);
      console.log(`         RAP: ${row.rap}€`);
    });
    
    // 2. Calculer le RAP manuellement
    if (moulahiResult.rows.length > 0) {
      const row = moulahiResult.rows[0];
      console.log('\n📊 2. Calcul manuel du RAP:');
      
      const totalGenere = parseFloat(row.total_genere) || 0;
      const salaireNet = parseFloat(row.salaire_net) || 0;
      const charge = parseFloat(row.charge) || 0;
      const taxe = parseFloat(row.taxe) || 0;
      const penalite = parseFloat(row.penalite) || 0;
      const rapActuel = parseFloat(row.rap) || 0;
      
      console.log(`   📊 Total Généré: ${totalGenere}€`);
      console.log(`   📊 Salaire Net: ${salaireNet}€`);
      console.log(`   📊 Charge: ${charge}€`);
      console.log(`   📊 Taxe: ${taxe}€`);
      console.log(`   📊 Pénalité: ${penalite}€`);
      
      const totalCouts = salaireNet + charge + taxe + penalite;
      const rapCalcule = totalGenere - totalCouts;
      
      console.log(`   📊 Total Coûts: ${totalCouts}€`);
      console.log(`   📊 RAP Calculé: ${rapCalcule}€`);
      console.log(`   📊 RAP Actuel: ${rapActuel}€`);
      console.log(`   📊 Différence: ${rapActuel - rapCalcule}€`);
      
      if (Math.abs(rapActuel - rapCalcule) > 0.01) {
        console.log(`   ❌ INCOHÉRENCE DÉTECTÉE !`);
        console.log(`   📊 Le RAP devrait être ${rapCalcule}€ mais il est ${rapActuel}€`);
      } else {
        console.log(`   ✅ RAP cohérent`);
      }
      
      // 3. Vérifier les paiements existants
      console.log('\n📊 3. Paiements existants:');
      const paiementsResult = await pool.query(`
        SELECT 
          pe.id,
          pe.montant_verse,
          pe.date_paiement,
          pe.methode_paiement,
          pe.reference_paiement,
          pe.commentaires,
          pe.statut
        FROM paiements_employes pe
        WHERE pe.cout_par_salaire_id = $1
        ORDER BY pe.date_paiement DESC
      `, [row.id]);
      
      console.log(`   📊 Paiements trouvés: ${paiementsResult.rows.length}`);
      let totalPaiements = 0;
      paiementsResult.rows.forEach((paiement, index) => {
        console.log(`      ${index + 1}. ${paiement.montant_verse}€ le ${paiement.date_paiement} (${paiement.methode_paiement})`);
        totalPaiements += parseFloat(paiement.montant_verse);
      });
      
      if (totalPaiements > 0) {
        console.log(`   📊 Total des paiements: ${totalPaiements}€`);
        const rapAvecPaiements = rapCalcule - totalPaiements;
        console.log(`   📊 RAP avec paiements: ${rapAvecPaiements}€`);
      }
      
      // 4. Calculer le RAP correct avec paiements
      console.log('\n📊 4. Calcul du RAP correct:');
      const rapCorrect = totalGenere - totalCouts - totalPaiements;
      console.log(`   📊 RAP Correct: ${totalGenere}€ - (${totalCouts}€ + ${totalPaiements}€) = ${rapCorrect}€`);
      
      if (Math.abs(rapActuel - rapCorrect) > 0.01) {
        console.log(`   🔧 Correction nécessaire:`);
        console.log(`      UPDATE cout_par_salaire SET rap = ${rapCorrect} WHERE id = ${row.id};`);
      }
    }
    
    // 5. Vérifier la fonction calculer_rap_avec_paiements
    console.log('\n📊 5. Test de la fonction calculer_rap_avec_paiements:');
    try {
      if (moulahiResult.rows.length > 0) {
        const row = moulahiResult.rows[0];
        const functionResult = await pool.query(`
          SELECT calculer_rap_avec_paiements($1, $2, $3, $4, $5) as rap_fonction
        `, [
          row.total_genere,
          row.salaire_net,
          row.charge,
          row.taxe,
          row.penalite
        ]);
        
        const rapFonction = parseFloat(functionResult.rows[0].rap_fonction);
        console.log(`   📊 RAP par fonction: ${rapFonction}€`);
      }
    } catch (error) {
      console.log(`   ❌ Erreur avec la fonction: ${error.message}`);
    }
    
    console.log('\n🎯 Diagnostic terminé !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

debugRapCalculationIssue().catch(console.error);
