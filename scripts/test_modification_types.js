// Script de test pour la modification avec les bons types de données
const BASE_URL = 'http://localhost:3000';

async function testModificationWithCorrectTypes() {
  console.log('🔍 Test de modification avec les bons types de données...\n');
  
  try {
    // 1. Créer un employé
    const testEmployee = {
      nom: 'Test',
      prenom: 'Types',
      matricule: 'EMP-TYPES-' + Date.now(),
      poste: 'Technicien',
      departement: 'Technique',
      email: 'test.types@example.com',
      telephone: '0123456789'
    };
    
    const addEmployeeResponse = await fetch(`${BASE_URL}/api/employes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testEmployee)
    });
    
    if (!addEmployeeResponse.ok) {
      console.log('❌ Erreur création employé');
      return;
    }
    
    const employeeResult = await addEmployeeResponse.json();
    const employeeId = employeeResult.employe.id;
    console.log('✅ Employé créé:', employeeId);
    
    // 2. Créer une pénalité
    const testPenalty = {
      employe_id: employeeId,
      type_penalite: 'retard',
      montant: 50.00,
      statut: 'active',
      motif: 'Test types'
    };
    
    const addResponse = await fetch(`${BASE_URL}/api/penalites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPenalty)
    });
    
    if (!addResponse.ok) {
      console.log('❌ Erreur création pénalité');
      return;
    }
    
    const penaltyResult = await addResponse.json();
    const penaltyId = penaltyResult.penalite.id;
    console.log('✅ Pénalité créée:', penaltyId);
    console.log('   Montant original:', penaltyResult.penalite.montant, typeof penaltyResult.penalite.montant);
    
    // 3. Test de modification avec montant comme chaîne
    console.log('\n3. Test de modification - Montant comme chaîne...');
    const updateData1 = {
      montant: "75.00"  // Chaîne au lieu de nombre
    };
    
    const updateResponse1 = await fetch(`${BASE_URL}/api/penalites`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: penaltyId, ...updateData1 })
    });
    
    if (updateResponse1.ok) {
      const updateResult1 = await updateResponse1.json();
      console.log('✅ Modification réussie avec chaîne');
      console.log('   Nouveau montant:', updateResult1.penalite.montant, typeof updateResult1.penalite.montant);
    } else {
      const error1 = await updateResponse1.text();
      console.log('❌ Erreur modification avec chaîne:', error1);
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
      console.log('   Nouveau statut:', updateResult2.penalite.statut);
    } else {
      const error2 = await updateResponse2.text();
      console.log('❌ Erreur modification statut:', error2);
    }
    
    // 5. Test de modification avec motif seulement
    console.log('\n5. Test de modification - Motif seulement...');
    const updateData3 = {
      motif: 'Test types - Modifié'
    };
    
    const updateResponse3 = await fetch(`${BASE_URL}/api/penalites`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: penaltyId, ...updateData3 })
    });
    
    if (updateResponse3.ok) {
      const updateResult3 = await updateResponse3.json();
      console.log('✅ Modification du motif réussie');
      console.log('   Nouveau motif:', updateResult3.penalite.motif);
    } else {
      const error3 = await updateResponse3.text();
      console.log('❌ Erreur modification motif:', error3);
    }
    
    // 6. Nettoyage
    await fetch(`${BASE_URL}/api/penalites?id=${penaltyId}`, { method: 'DELETE' });
    await fetch(`${BASE_URL}/api/employes?id=${employeeId}`, { method: 'DELETE' });
    console.log('✅ Nettoyage terminé');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testModificationWithCorrectTypes();
