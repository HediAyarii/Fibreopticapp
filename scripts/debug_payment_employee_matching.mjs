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

async function debugPaymentEmployeeMatching() {
  console.log('🔍 Diagnostic du matching employé pour paiement...');
  
  try {
    // 1. Vérifier BECHIRMOULAHI MOHAMED dans cout_par_salaire
    console.log('\n📊 1. Données dans cout_par_salaire:');
    const coutParSalaireResult = await pool.query(`
      SELECT 
        id,
        nom,
        prenom,
        matricule,
        total_genere,
        rap
      FROM cout_par_salaire
      WHERE LOWER(nom) LIKE '%moulahi%' OR LOWER(prenom) LIKE '%mohamed%'
      ORDER BY nom, prenom
    `);
    
    console.log(`   📊 Résultats: ${coutParSalaireResult.rows.length} enregistrements`);
    coutParSalaireResult.rows.forEach((row, index) => {
      console.log(`      ${index + 1}. ${row.nom} ${row.prenom} (ID: ${row.id})`);
      console.log(`         Matricule: ${row.matricule}`);
      console.log(`         Total Généré: ${row.total_genere}€`);
      console.log(`         RAP: ${row.rap}€`);
    });
    
    // 2. Vérifier les employés correspondants
    console.log('\n📊 2. Employés correspondants:');
    const employesResult = await pool.query(`
      SELECT 
        id,
        nom,
        prenom,
        matricule,
        statut
      FROM employes
      WHERE LOWER(nom) LIKE '%moulahi%' OR LOWER(prenom) LIKE '%mohamed%'
      ORDER BY nom, prenom
    `);
    
    console.log(`   📊 Résultats: ${employesResult.rows.length} enregistrements`);
    employesResult.rows.forEach((row, index) => {
      console.log(`      ${index + 1}. ${row.nom} ${row.prenom} (ID: ${row.id})`);
      console.log(`         Matricule: ${row.matricule}`);
      console.log(`         Statut: ${row.statut}`);
    });
    
    // 3. Vérifier la correspondance par matricule
    console.log('\n📊 3. Correspondance par matricule:');
    if (coutParSalaireResult.rows.length > 0) {
      const coutRow = coutParSalaireResult.rows[0];
      const matriculeMatch = await pool.query(`
        SELECT 
          id,
          nom,
          prenom,
          matricule,
          statut
        FROM employes
        WHERE matricule = $1
      `, [coutRow.matricule]);
      
      console.log(`   📊 Recherche par matricule ${coutRow.matricule}:`);
      if (matriculeMatch.rows.length > 0) {
        const employe = matriculeMatch.rows[0];
        console.log(`      ✅ Trouvé: ${employe.nom} ${employe.prenom} (ID: ${employe.id})`);
        console.log(`         Matricule: ${employe.matricule}`);
        console.log(`         Statut: ${employe.statut}`);
      } else {
        console.log(`      ❌ Aucun employé trouvé avec le matricule ${coutRow.matricule}`);
      }
    }
    
    // 4. Vérifier les paiements existants
    console.log('\n📊 4. Paiements existants:');
    const paiementsResult = await pool.query(`
      SELECT 
        pe.id,
        pe.montant_verse,
        pe.date_paiement,
        pe.methode_paiement,
        pe.reference_paiement,
        pe.commentaires,
        pe.statut,
        e.nom as employe_nom,
        e.prenom as employe_prenom,
        cps.nom as cout_nom,
        cps.prenom as cout_prenom
      FROM paiements_employes pe
      LEFT JOIN employes e ON pe.employe_id = e.id
      LEFT JOIN cout_par_salaire cps ON pe.cout_par_salaire_id = cps.id
      WHERE LOWER(cps.nom) LIKE '%moulahi%' OR LOWER(cps.prenom) LIKE '%mohamed%'
      ORDER BY pe.date_paiement DESC
    `);
    
    console.log(`   📊 Résultats: ${paiementsResult.rows.length} enregistrements`);
    paiementsResult.rows.forEach((row, index) => {
      console.log(`      ${index + 1}. ${row.montant_verse}€ le ${row.date_paiement}`);
      console.log(`         Employé: ${row.employe_nom} ${row.employe_prenom}`);
      console.log(`         Coût: ${row.cout_nom} ${row.cout_prenom}`);
      console.log(`         Méthode: ${row.methode_paiement}`);
    });
    
    // 5. Tester la logique de matching du composant
    console.log('\n📊 5. Test de la logique de matching:');
    if (coutParSalaireResult.rows.length > 0) {
      const coutRow = coutParSalaireResult.rows[0];
      console.log(`   📊 Coût: ${coutRow.nom} ${coutRow.prenom} (Matricule: ${coutRow.matricule})`);
      
      // Simuler la logique du composant
      const matchingEmploye = employesResult.rows.find(emp => 
        emp.matricule === coutRow.matricule
      );
      
      if (matchingEmploye) {
        console.log(`   ✅ Employé trouvé: ${matchingEmploye.nom} ${matchingEmploye.prenom} (ID: ${matchingEmploye.id})`);
      } else {
        console.log(`   ❌ Aucun employé trouvé avec le matricule ${coutRow.matricule}`);
        console.log(`   📊 Matricules disponibles:`);
        employesResult.rows.forEach(emp => {
          console.log(`      - ${emp.matricule} (${emp.nom} ${emp.prenom})`);
        });
      }
    }
    
    // 6. Vérifier tous les employés actifs
    console.log('\n📊 6. Tous les employés actifs:');
    const allEmployesResult = await pool.query(`
      SELECT 
        id,
        nom,
        prenom,
        matricule,
        statut
      FROM employes
      WHERE statut = 'actif'
      ORDER BY nom, prenom
    `);
    
    console.log(`   📊 Résultats: ${allEmployesResult.rows.length} enregistrements`);
    allEmployesResult.rows.forEach((row, index) => {
      console.log(`      ${index + 1}. ${row.nom} ${row.prenom} (ID: ${row.id})`);
      console.log(`         Matricule: ${row.matricule}`);
    });
    
    // 7. Recommandations
    console.log('\n📊 7. Recommandations:');
    if (coutParSalaireResult.rows.length > 0 && employesResult.rows.length > 0) {
      const coutRow = coutParSalaireResult.rows[0];
      const employeRow = employesResult.rows[0];
      
      console.log(`   🔧 Problème identifié:`);
      console.log(`      - cout_par_salaire: ${coutRow.nom} ${coutRow.prenom} (Matricule: ${coutRow.matricule})`);
      console.log(`      - employes: ${employeRow.nom} ${employeRow.prenom} (Matricule: ${employeRow.matricule})`);
      
      if (coutRow.matricule !== employeRow.matricule) {
        console.log(`   🔧 Solution: Corriger le matricule dans cout_par_salaire`);
        console.log(`      UPDATE cout_par_salaire SET matricule = '${employeRow.matricule}' WHERE id = ${coutRow.id};`);
      } else {
        console.log(`   🔧 Solution: Vérifier la logique de matching dans le composant`);
      }
    }
    
    console.log('\n🎯 Diagnostic terminé !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

debugPaymentEmployeeMatching().catch(console.error);
