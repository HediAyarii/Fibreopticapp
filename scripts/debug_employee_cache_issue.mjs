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

async function debugEmployeeCacheIssue() {
  console.log('🔍 Diagnostic du problème de cache des employés...');
  
  try {
    // 1. Vérifier BECHIRMOULAHI MOHAMED dans cout_par_salaire
    console.log('\n📊 1. Données dans cout_par_salaire:');
    const coutResult = await pool.query(`
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
    
    console.log(`   📊 Résultats: ${coutResult.rows.length} enregistrements`);
    coutResult.rows.forEach((row, index) => {
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
    
    // 3. Vérifier la correspondance par matricule TECH_MOUMO
    console.log('\n📊 3. Correspondance par matricule TECH_MOUMO:');
    const matriculeResult = await pool.query(`
      SELECT 
        id,
        nom,
        prenom,
        matricule,
        statut
      FROM employes
      WHERE matricule = 'TECH_MOUMO'
    `);
    
    console.log(`   📊 Résultats: ${matriculeResult.rows.length} enregistrements`);
    matriculeResult.rows.forEach((row, index) => {
      console.log(`      ${index + 1}. ${row.nom} ${row.prenom} (ID: ${row.id})`);
      console.log(`         Matricule: ${row.matricule}`);
      console.log(`         Statut: ${row.statut}`);
    });
    
    // 4. Vérifier tous les employés actifs
    console.log('\n📊 4. Tous les employés actifs:');
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
      console.log(`      ${index + 1}. ${row.nom} ${row.prenom} (ID: ${row.id}) - ${row.matricule}`);
    });
    
    // 5. Simuler la logique du composant
    console.log('\n📊 5. Simulation de la logique du composant:');
    if (coutResult.rows.length > 0) {
      const coutRow = coutResult.rows[0];
      console.log(`   📊 Coût: ${coutRow.nom} ${coutRow.prenom} (Matricule: ${coutRow.matricule})`);
      
      // Simuler la recherche dans le cache
      const matchingEmploye = allEmployesResult.rows.find(emp => 
        emp.matricule === coutRow.matricule
      );
      
      if (matchingEmploye) {
        console.log(`   ✅ Employé trouvé: ${matchingEmploye.nom} ${matchingEmploye.prenom} (ID: ${matchingEmploye.id})`);
        console.log(`   📊 Correspondance parfaite: ${coutRow.matricule} = ${matchingEmploye.matricule}`);
      } else {
        console.log(`   ❌ Aucun employé trouvé avec le matricule ${coutRow.matricule}`);
        console.log(`   📊 Matricules disponibles:`);
        allEmployesResult.rows.forEach(emp => {
          console.log(`      - ${emp.matricule} (${emp.nom} ${emp.prenom})`);
        });
      }
    }
    
    // 6. Vérifier les variations de noms
    console.log('\n📊 6. Recherche par variations de noms:');
    const variationsResult = await pool.query(`
      SELECT 
        id,
        nom,
        prenom,
        matricule,
        statut
      FROM employes
      WHERE (
        LOWER(nom) LIKE '%moulahi%' OR 
        LOWER(nom) LIKE '%mohamed%' OR
        LOWER(prenom) LIKE '%mohamed%' OR
        LOWER(prenom) LIKE '%bechir%'
      )
      ORDER BY nom, prenom
    `);
    
    console.log(`   📊 Résultats: ${variationsResult.rows.length} enregistrements`);
    variationsResult.rows.forEach((row, index) => {
      console.log(`      ${index + 1}. ${row.nom} ${row.prenom} (ID: ${row.id})`);
      console.log(`         Matricule: ${row.matricule}`);
      console.log(`         Statut: ${row.statut}`);
    });
    
    // 7. Recommandations
    console.log('\n📊 7. Recommandations:');
    if (coutResult.rows.length > 0 && allEmployesResult.rows.length > 0) {
      const coutRow = coutResult.rows[0];
      const employeRow = allEmployesResult.rows.find(emp => emp.matricule === coutRow.matricule);
      
      if (employeRow) {
        console.log(`   ✅ Correspondance trouvée:`);
        console.log(`      - cout_par_salaire: ${coutRow.nom} ${coutRow.prenom} (${coutRow.matricule})`);
        console.log(`      - employes: ${employeRow.nom} ${employeRow.prenom} (${employeRow.matricule})`);
        console.log(`   🔧 Le problème est dans le cache du composant React`);
        console.log(`   🔧 Solution: Vérifier que loadEmployees() est appelé au montage`);
      } else {
        console.log(`   ❌ Aucune correspondance trouvée`);
        console.log(`   🔧 Solution: Vérifier les matricules ou créer la correspondance`);
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

debugEmployeeCacheIssue().catch(console.error);
