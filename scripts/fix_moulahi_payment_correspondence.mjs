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

async function fixMoulahiPaymentCorrespondence() {
  console.log('🔧 Correction de la correspondance MOULAHI pour les paiements...');
  
  try {
    // 1. Vérifier la situation actuelle
    console.log('\n📊 1. Situation actuelle:');
    const coutParSalaireResult = await pool.query(`
      SELECT id, nom, prenom, matricule, mois, annee, rap
      FROM cout_par_salaire
      WHERE id = 1
    `);
    
    const employeResult = await pool.query(`
      SELECT id, nom, prenom, matricule, statut
      FROM employes
      WHERE matricule = 'TECH_MOUMO'
    `);
    
    console.log(`   📊 cout_par_salaire ID 1: ${coutParSalaireResult.rows[0].nom} ${coutParSalaireResult.rows[0].prenom} (${coutParSalaireResult.rows[0].matricule})`);
    console.log(`   📊 employes TECH_MOUMO: ${employeResult.rows[0].nom} ${employeResult.rows[0].prenom} (${employeResult.rows[0].matricule})`);
    
    // 2. Corriger le nom dans cout_par_salaire pour qu'il corresponde à l'employé
    console.log('\n📊 2. Correction du nom dans cout_par_salaire:');
    await pool.query(`
      UPDATE cout_par_salaire
      SET nom = $1,
          prenom = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `, [employeResult.rows[0].nom, employeResult.rows[0].prenom]);
    
    console.log(`   ✅ Nom corrigé: ${employeResult.rows[0].nom} ${employeResult.rows[0].prenom}`);
    
    // 3. Vérifier la correction
    console.log('\n📊 3. Vérification de la correction:');
    const verificationResult = await pool.query(`
      SELECT id, nom, prenom, matricule, mois, annee, rap
      FROM cout_par_salaire
      WHERE id = 1
    `);
    
    console.log(`   📊 Après correction: ${verificationResult.rows[0].nom} ${verificationResult.rows[0].prenom} (${verificationResult.rows[0].matricule})`);
    
    // 4. Tester la correspondance
    console.log('\n📊 4. Test de correspondance:');
    const testCorrespondence = await pool.query(`
      SELECT 
        cps.id as cout_id,
        cps.nom as cout_nom,
        cps.prenom as cout_prenom,
        cps.matricule as cout_matricule,
        e.id as employe_id,
        e.nom as employe_nom,
        e.prenom as employe_prenom,
        e.matricule as employe_matricule,
        CASE 
          WHEN cps.matricule = e.matricule THEN '✅ Correspondance parfaite'
          ELSE '❌ Pas de correspondance'
        END as correspondance
      FROM cout_par_salaire cps
      LEFT JOIN employes e ON cps.matricule = e.matricule
      WHERE cps.id = 1
    `);
    
    console.log(`   📊 Résultat: ${testCorrespondence.rows[0].correspondance}`);
    console.log(`   📊 cout_par_salaire: ${testCorrespondence.rows[0].cout_nom} ${testCorrespondence.rows[0].cout_prenom} (${testCorrespondence.rows[0].cout_matricule})`);
    console.log(`   📊 employes: ${testCorrespondence.rows[0].employe_nom} ${testCorrespondence.rows[0].employe_prenom} (${testCorrespondence.rows[0].employe_matricule})`);
    
    // 5. Vérifier que le paiement peut maintenant être enregistré
    console.log('\n📊 5. Test de l\'enregistrement de paiement:');
    const testPaymentResult = await pool.query(`
      SELECT 
        cps.id as cout_par_salaire_id,
        e.id as employe_id,
        cps.nom as cout_nom,
        cps.prenom as cout_prenom,
        cps.matricule as cout_matricule,
        e.nom as employe_nom,
        e.prenom as employe_prenom,
        e.matricule as employe_matricule,
        cps.rap as rap_actuel
      FROM cout_par_salaire cps
      JOIN employes e ON cps.matricule = e.matricule
      WHERE cps.id = 1
    `);
    
    if (testPaymentResult.rows.length > 0) {
      const row = testPaymentResult.rows[0];
      console.log(`   ✅ Correspondance trouvée !`);
      console.log(`   📊 cout_par_salaire_id: ${row.cout_par_salaire_id}`);
      console.log(`   📊 employe_id: ${row.employe_id}`);
      console.log(`   📊 RAP actuel: ${row.rap_actuel}€`);
      console.log(`   📊 Le paiement peut maintenant être enregistré !`);
    } else {
      console.log(`   ❌ Aucune correspondance trouvée`);
    }
    
    console.log('\n🎯 Correction terminée !');
    console.log('✅ Le problème "Employé non trouvé pour ce coût" devrait être résolu');
    console.log('✅ Vous pouvez maintenant enregistrer le paiement pour MOULAHI');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

fixMoulahiPaymentCorrespondence().catch(console.error);
