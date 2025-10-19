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

async function debugPaymentIssue() {
  console.log('🔍 Diagnostic du problème de paiement...');
  
  try {
    // 1. Vérifier les données dans cout_par_salaire pour MOULAHI
    console.log('\n📊 1. Données dans cout_par_salaire pour MOULAHI:');
    const coutParSalaireResult = await pool.query(`
      SELECT id, nom, prenom, matricule, mois, annee, rap
      FROM cout_par_salaire
      WHERE LOWER(nom) LIKE '%moulahi%' OR LOWER(prenom) LIKE '%moulahi%'
         OR LOWER(nom) LIKE '%bechir%' OR LOWER(prenom) LIKE '%bechir%'
    `);
    
    console.log(`   📊 Résultats: ${coutParSalaireResult.rows.length} enregistrements`);
    coutParSalaireResult.rows.forEach((row, index) => {
      console.log(`      ${index + 1}. ID: ${row.id}, Nom: ${row.nom}, Prénom: ${row.prenom}, Matricule: ${row.matricule}, Mois: ${row.mois}, Année: ${row.annee}, RAP: ${row.rap}€`);
    });
    
    // 2. Vérifier les données dans employes pour MOULAHI
    console.log('\n📊 2. Données dans employes pour MOULAHI:');
    const employesResult = await pool.query(`
      SELECT id, nom, prenom, matricule, statut
      FROM employes
      WHERE LOWER(nom) LIKE '%moulahi%' OR LOWER(prenom) LIKE '%moulahi%'
         OR LOWER(nom) LIKE '%bechir%' OR LOWER(prenom) LIKE '%bechir%'
    `);
    
    console.log(`   📊 Résultats: ${employesResult.rows.length} enregistrements`);
    employesResult.rows.forEach((row, index) => {
      console.log(`      ${index + 1}. ID: ${row.id}, Nom: ${row.nom}, Prénom: ${row.prenom}, Matricule: ${row.matricule}, Statut: ${row.statut}`);
    });
    
    // 3. Vérifier la correspondance des matricules
    console.log('\n📊 3. Correspondance des matricules:');
    if (coutParSalaireResult.rows.length > 0 && employesResult.rows.length > 0) {
      const coutMatricule = coutParSalaireResult.rows[0].matricule;
      const employeMatricule = employesResult.rows[0].matricule;
      
      console.log(`   📊 Matricule dans cout_par_salaire: ${coutMatricule}`);
      console.log(`   📊 Matricule dans employes: ${employeMatricule}`);
      console.log(`   📊 Correspondance: ${coutMatricule === employeMatricule ? '✅ Oui' : '❌ Non'}`);
    }
    
    // 4. Vérifier tous les employés actifs
    console.log('\n📊 4. Tous les employés actifs:');
    const allEmployesResult = await pool.query(`
      SELECT id, nom, prenom, matricule, statut
      FROM employes
      WHERE statut = 'actif'
      ORDER BY nom, prenom
    `);
    
    console.log(`   📊 Total employés actifs: ${allEmployesResult.rows.length}`);
    allEmployesResult.rows.forEach((row, index) => {
      console.log(`      ${index + 1}. ID: ${row.id}, Nom: ${row.nom}, Prénom: ${row.prenom}, Matricule: ${row.matricule}`);
    });
    
    // 5. Rechercher spécifiquement "TECH_MOUMO"
    console.log('\n📊 5. Recherche du matricule TECH_MOUMO:');
    const techMoumoResult = await pool.query(`
      SELECT id, nom, prenom, matricule, statut
      FROM employes
      WHERE matricule = 'TECH_MOUMO'
    `);
    
    console.log(`   📊 Résultats pour TECH_MOUMO: ${techMoumoResult.rows.length} enregistrements`);
    techMoumoResult.rows.forEach((row, index) => {
      console.log(`      ${index + 1}. ID: ${row.id}, Nom: ${row.nom}, Prénom: ${row.prenom}, Matricule: ${row.matricule}, Statut: ${row.statut}`);
    });
    
    // 6. Vérifier les paiements existants
    console.log('\n📊 6. Paiements existants pour MOULAHI:');
    const paiementsResult = await pool.query(`
      SELECT pe.*, e.nom as employe_nom, e.prenom as employe_prenom, e.matricule as employe_matricule
      FROM paiements_employes pe
      LEFT JOIN employes e ON pe.employe_id = e.id
      WHERE e.nom LIKE '%MOULAHI%' OR e.prenom LIKE '%MOULAHI%'
         OR e.nom LIKE '%BECHIR%' OR e.prenom LIKE '%BECHIR%'
    `);
    
    console.log(`   📊 Paiements existants: ${paiementsResult.rows.length}`);
    paiementsResult.rows.forEach((row, index) => {
      console.log(`      ${index + 1}. ID: ${row.id}, Employé: ${row.employe_nom} ${row.employe_prenom}, Matricule: ${row.employe_matricule}, Montant: ${row.montant_verse}€`);
    });
    
    console.log('\n🎯 Diagnostic terminé !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

debugPaymentIssue().catch(console.error);
