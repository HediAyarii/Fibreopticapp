// Script de test spécifique pour la modification des pénalités
const BASE_URL = 'http://localhost:3000';

async function testPenaltyModification() {
  console.log('🔍 Test spécifique de modification des pénalités...\n');
  
  try {
    // 1. Créer un employé de test
    console.log('1. Création d\'un employé de test...');
    const testEmployee = {
      nom: 'Test',
      prenom: 'Modification',
      matricule: 'EMP-MOD-' + Date.now(),
      poste: 'Technicien',
      departement: 'Technique',
      email: 'test.modification@example.com',
      telephone: '0123456789'
    };
    
    const addEmployeeResponse = await fetch(`${BASE_URL}/api/employes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testEmployee)
    });
    
    let employeeId = null;
    if (addEmployeeResponse.ok) {
      const employeeResult = await addEmployeeResponse.json();
      employeeId = employeeResult.employe.id;
      console.log('✅ Employé créé avec succès');
      console.log(`   ID: ${employeeId}`);
    } else {
      const error = await addEmployeeResponse.json();
      console.log('❌ Erreur lors de la création de l\'employé:', error.error);
      return;
    }
    
    // 2. Créer une pénalité
    console.log('\n2. Création d\'une pénalité...');
    const testPenalty = {
      employe_id: employeeId,
      type_penalite: 'absence',
      montant: 100.00,
      statut: 'active',
      motif: 'Absence injustifiée',
      commentaires: 'Test de modification'
    };
    
    const addResponse = await fetch(`${BASE_URL}/api/penalites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPenalty)
    });
    
    if (addResponse.ok) {
      const result = await addResponse.json();
      console.log('✅ Pénalité créée avec succès');
      console.log(`   ID: ${result.penalite.id}`);
      console.log(`   Numéro: ${result.penalite.numero_penalite}`);
      
      const penaltyId = result.penalite.id;
      
      // 3. Test de modification avec différents champs
      console.log('\n3. Test de modification - Montant seulement...');
      const updateData1 = {
        montant: 150.00
      };
      
      const updateResponse1 = await fetch(`${BASE_URL}/api/penalites`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: penaltyId, ...updateData1 })
      });
      
      if (updateResponse1.ok) {
        const updateResult1 = await updateResponse1.json();
        console.log('✅ Modification du montant réussie');
        console.log(`   Nouveau montant: ${updateResult1.penalite.montant} €`);
      } else {
        const error1 = await updateResponse1.json();
        console.log('❌ Erreur modification montant:', error1.error);
      }
      
      // 4. Test de modification avec statut seulement
      console.log('\n4. Test de modification - Statut seulement...');
      const updateData2 = {
        statut: 'annulee'
      };
      
      const updateResponse2 = await fetch(`${BASE_URL}/api/penalites`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: penaltyId, ...updateData2 })
      });
      
      if (updateResponse2.ok) {
        const updateResult2 = await updateResponse2.json();
        console.log('✅ Modification du statut réussie');
        console.log(`   Nouveau statut: ${updateResult2.penalite.statut}`);
      } else {
        const error2 = await updateResponse2.json();
        console.log('❌ Erreur modification statut:', error2.error);
      }
      
      // 5. Test de modification avec motif seulement
      console.log('\n5. Test de modification - Motif seulement...');
      const updateData3 = {
        motif: 'Absence injustifiée - Modifié'
      };
      
      const updateResponse3 = await fetch(`${BASE_URL}/api/penalites`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: penaltyId, ...updateData3 })
      });
      
      if (updateResponse3.ok) {
        const updateResult3 = await updateResponse3.json();
        console.log('✅ Modification du motif réussie');
        console.log(`   Nouveau motif: ${updateResult3.penalite.motif}`);
      } else {
        const error3 = await updateResponse3.json();
        console.log('❌ Erreur modification motif:', error3.error);
      }
      
      // 6. Nettoyage
      console.log('\n6. Nettoyage...');
      await fetch(`${BASE_URL}/api/penalites?id=${penaltyId}`, { method: 'DELETE' });
      await fetch(`${BASE_URL}/api/employes?id=${employeeId}`, { method: 'DELETE' });
      console.log('✅ Nettoyage terminé');
      
    } else {
      const error = await addResponse.json();
      console.log('❌ Erreur lors de la création:', error.error);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

async function main() {
  await testPenaltyModification();
}

main();
