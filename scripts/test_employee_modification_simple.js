// Test simple pour isoler le problème de modification des employés
const BASE_URL = 'http://localhost:3000';

async function testEmployeeModification() {
  console.log('🔍 Test de modification des employés...\n');
  
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
      telephone: '0123456789',
      adresse: '123 Rue Test',
      date_embauche: '2025-01-01',
      salaire: 2500.00,
      pourcentage_taxe: 20.0,
      statut: 'actif'
    };
    
    const addResponse = await fetch(`${BASE_URL}/api/employes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testEmployee)
    });
    
    if (!addResponse.ok) {
      const error = await addResponse.json();
      console.log('❌ Erreur lors de la création:', error.error);
      return;
    }
    
    const result = await addResponse.json();
    const employeeId = result.employe.id;
    console.log(`✅ Employé créé avec l'ID: ${employeeId}`);
    
    // 2. Tester la modification avec des données simples
    console.log('\n2. Test de modification simple...');
    const updateData = {
      poste: 'Technicien Senior'
    };
    
    console.log('Données à envoyer:', JSON.stringify({ id: employeeId, ...updateData }));
    
    const updateResponse = await fetch(`${BASE_URL}/api/employes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: employeeId, ...updateData })
    });
    
    console.log('Status de la réponse:', updateResponse.status);
    
    if (updateResponse.ok) {
      const updateResult = await updateResponse.json();
      console.log('✅ Modification réussie');
      console.log('Résultat:', JSON.stringify(updateResult, null, 2));
    } else {
      const error = await updateResponse.json();
      console.log('❌ Erreur lors de la modification:', error.error);
      console.log('Détails de l\'erreur:', JSON.stringify(error, null, 2));
    }
    
    // 3. Nettoyer - supprimer l'employé de test
    console.log('\n3. Nettoyage...');
    const deleteResponse = await fetch(`${BASE_URL}/api/employes?id=${employeeId}`, {
      method: 'DELETE'
    });
    
    if (deleteResponse.ok) {
      console.log('✅ Employé de test supprimé');
    } else {
      console.log('⚠️ Erreur lors de la suppression (non critique)');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

async function main() {
  await testEmployeeModification();
}

main();
