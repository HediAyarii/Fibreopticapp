// Script de test simple pour identifier le problème de modification
const BASE_URL = 'http://localhost:3000';

async function testSimpleModification() {
  console.log('🔍 Test simple de modification...\n');
  
  try {
    // 1. Créer un employé
    const testEmployee = {
      nom: 'Test',
      prenom: 'Simple',
      matricule: 'EMP-SIMPLE-' + Date.now(),
      poste: 'Technicien',
      departement: 'Technique',
      email: 'test.simple@example.com',
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
      motif: 'Test simple'
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
    
    // 3. Test de modification simple
    console.log('\n3. Test de modification simple...');
    const updateData = {
      montant: 75.00
    };
    
    console.log('Données envoyées:', JSON.stringify({ id: penaltyId, ...updateData }));
    
    const updateResponse = await fetch(`${BASE_URL}/api/penalites`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: penaltyId, ...updateData })
    });
    
    console.log('Status de la réponse:', updateResponse.status);
    console.log('Headers de la réponse:', Object.fromEntries(updateResponse.headers.entries()));
    
    if (updateResponse.ok) {
      const updateResult = await updateResponse.json();
      console.log('✅ Modification réussie:', updateResult);
    } else {
      const errorText = await updateResponse.text();
      console.log('❌ Erreur modification:');
      console.log('Status:', updateResponse.status);
      console.log('Response:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.log('Error JSON:', errorJson);
      } catch (e) {
        console.log('Response is not JSON');
      }
    }
    
    // 4. Nettoyage
    await fetch(`${BASE_URL}/api/penalites?id=${penaltyId}`, { method: 'DELETE' });
    await fetch(`${BASE_URL}/api/employes?id=${employeeId}`, { method: 'DELETE' });
    console.log('✅ Nettoyage terminé');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('Stack:', error.stack);
  }
}

testSimpleModification();
