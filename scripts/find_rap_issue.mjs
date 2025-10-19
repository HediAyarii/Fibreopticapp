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

async function findRapIssue() {
  console.log('🔍 Recherche du problème RAP...');
  
  try {
    // 1. Chercher tous les enregistrements avec Total Généré = 2460.00
    console.log('\n📊 1. Recherche par Total Généré = 2460.00€:');
    const totalGenereResult = await pool.query(`
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
        rap
      FROM cout_par_salaire
      WHERE total_genere = 2460.00
      ORDER BY mois DESC, annee DESC
    `);
    
    console.log(`   📊 Résultats: ${totalGenereResult.rows.length} enregistrements`);
    totalGenereResult.rows.forEach((row, index) => {
      console.log(`      ${index + 1}. ${row.nom} ${row.prenom} (${row.mois}/${row.annee})`);
      console.log(`         Total Généré: ${row.total_genere}€`);
      console.log(`         Salaire Net: ${row.salaire_net}€`);
      console.log(`         Charge: ${row.charge}€`);
      console.log(`         Taxe: ${row.taxe}€`);
      console.log(`         Pénalité: ${row.penalite}€`);
      console.log(`         RAP: ${row.rap}€`);
    });
    
    // 2. Chercher par Salaire Net = 1406.34
    console.log('\n📊 2. Recherche par Salaire Net = 1406.34€:');
    const salaireNetResult = await pool.query(`
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
        rap
      FROM cout_par_salaire
      WHERE salaire_net = 1406.34
      ORDER BY mois DESC, annee DESC
    `);
    
    console.log(`   📊 Résultats: ${salaireNetResult.rows.length} enregistrements`);
    salaireNetResult.rows.forEach((row, index) => {
      console.log(`      ${index + 1}. ${row.nom} ${row.prenom} (${row.mois}/${row.annee})`);
      console.log(`         Total Généré: ${row.total_genere}€`);
      console.log(`         Salaire Net: ${row.salaire_net}€`);
      console.log(`         Charge: ${row.charge}€`);
      console.log(`         Taxe: ${row.taxe}€`);
      console.log(`         Pénalité: ${row.penalite}€`);
      console.log(`         RAP: ${row.rap}€`);
    });
    
    // 3. Chercher par Taxe = 228.3
    console.log('\n📊 3. Recherche par Taxe = 228.3€:');
    const taxeResult = await pool.query(`
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
        rap
      FROM cout_par_salaire
      WHERE taxe = 228.3
      ORDER BY mois DESC, annee DESC
    `);
    
    console.log(`   📊 Résultats: ${taxeResult.rows.length} enregistrements`);
    taxeResult.rows.forEach((row, index) => {
      console.log(`      ${index + 1}. ${row.nom} ${row.prenom} (${row.mois}/${row.annee})`);
      console.log(`         Total Généré: ${row.total_genere}€`);
      console.log(`         Salaire Net: ${row.salaire_net}€`);
      console.log(`         Charge: ${row.charge}€`);
      console.log(`         Taxe: ${row.taxe}€`);
      console.log(`         Pénalité: ${row.penalite}€`);
      console.log(`         RAP: ${row.rap}€`);
    });
    
    // 4. Chercher toutes les combinaisons possibles
    console.log('\n📊 4. Recherche par combinaison de critères:');
    const combinationResult = await pool.query(`
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
        rap
      FROM cout_par_salaire
      WHERE (total_genere = 2460.00 OR salaire_net = 1406.34 OR taxe = 228.3)
      ORDER BY mois DESC, annee DESC
    `);
    
    console.log(`   📊 Résultats: ${combinationResult.rows.length} enregistrements`);
    combinationResult.rows.forEach((row, index) => {
      console.log(`      ${index + 1}. ${row.nom} ${row.prenom} (${row.mois}/${row.annee})`);
      console.log(`         Total Généré: ${row.total_genere}€`);
      console.log(`         Salaire Net: ${row.salaire_net}€`);
      console.log(`         Charge: ${row.charge}€`);
      console.log(`         Taxe: ${row.taxe}€`);
      console.log(`         Pénalité: ${row.penalite}€`);
      console.log(`         RAP: ${row.rap}€`);
      
      // Calculer le RAP correct
      const totalGenere = parseFloat(row.total_genere) || 0;
      const salaireNet = parseFloat(row.salaire_net) || 0;
      const charge = parseFloat(row.charge) || 0;
      const taxe = parseFloat(row.taxe) || 0;
      const penalite = parseFloat(row.penalite) || 0;
      const rapActuel = parseFloat(row.rap) || 0;
      
      const totalCouts = salaireNet + charge + taxe + penalite;
      const rapCalcule = totalGenere - totalCouts;
      
      console.log(`         📊 Calcul: ${totalGenere}€ - (${salaireNet}€ + ${charge}€ + ${taxe}€ + ${penalite}€) = ${rapCalcule}€`);
      console.log(`         📊 RAP Actuel: ${rapActuel}€`);
      console.log(`         📊 Différence: ${rapActuel - rapCalcule}€`);
      
      if (Math.abs(rapActuel - rapCalcule) > 0.01) {
        console.log(`         ❌ INCOHÉRENCE DÉTECTÉE !`);
      } else {
        console.log(`         ✅ RAP cohérent`);
      }
    });
    
    // 5. Afficher tous les enregistrements récents pour comparaison
    console.log('\n📊 5. Tous les enregistrements récents:');
    const allRecentResult = await pool.query(`
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
        rap
      FROM cout_par_salaire
      WHERE mois = 5 AND annee = 2025
      ORDER BY total_genere DESC
      LIMIT 10
    `);
    
    console.log(`   📊 Enregistrements récents (Mai 2025): ${allRecentResult.rows.length}`);
    allRecentResult.rows.forEach((row, index) => {
      console.log(`      ${index + 1}. ${row.nom} ${row.prenom}`);
      console.log(`         Total Généré: ${row.total_genere}€, Salaire Net: ${row.salaire_net}€, Taxe: ${row.taxe}€, RAP: ${row.rap}€`);
    });
    
    console.log('\n🎯 Recherche terminée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

findRapIssue().catch(console.error);
