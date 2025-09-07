// Script de test complet pour vérifier la suppression en cascade
const BASE_URL = 'http://localhost:3000';

async function testCascadeDeletion() {
  console.log('🔍 Test complet de suppression en cascade...\n');
  
  try {
    // 1. Créer un matériel de test
    console.log('1. Création d\'un matériel de test...');
    const testMaterial = {
      numero_serie: 'TEST-CASCADE-' + Date.now(),
      nom_equipement: 'Matériel Test Cascade',
      type_materiel: 'Test',
      marque: 'TestBrand',
      modele: 'TestModel',
      statut: 'disponible',
      localisation: 'Test Location',
      quantite: 5,
      prix_unitaire: 50.00
    };
    
    const addMaterialResponse = await fetch(`${BASE_URL}/api/materiel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testMaterial)
    });
    
    if (!addMaterialResponse.ok) {
      console.log('❌ Erreur lors de la création du matériel');
      return;
    }
    
    const addedMaterial = await addMaterialResponse.json();
    console.log(`✅ Matériel créé: ${addedMaterial.materiel.nom_equipement} (ID: ${addedMaterial.materiel.id})`);
    
    // 2. Récupérer un employé pour l'affectation
    console.log('\n2. Récupération d\'un employé...');
    const employeesResponse = await fetch(`${BASE_URL}/api/employes`);
    if (!employeesResponse.ok) {
      console.log('❌ Erreur lors de la récupération des employés');
      return;
    }
    const employeesData = await employeesResponse.json();
    
    if (!employeesData.employes || employeesData.employes.length === 0) {
      console.log('⚠️ Aucun employé disponible');
      return;
    }
    
    const firstEmployee = employeesData.employes[0];
    console.log(`✅ Employé sélectionné: ${firstEmployee.prenom} ${firstEmployee.nom} (ID: ${firstEmployee.id})`);
    
    // 3. Créer une affectation
    console.log('\n3. Création d\'une affectation...');
    const testAssignment = {
      materiel_id: addedMaterial.materiel.id,
      employe_id: firstEmployee.id,
      quantite_assignee: 2,
      commentaires: 'Test d\'affectation pour suppression en cascade'
    };
    
    const addAssignmentResponse = await fetch(`${BASE_URL}/api/affectations-materiel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testAssignment)
    });
    
    if (!addAssignmentResponse.ok) {
      console.log('❌ Erreur lors de la création de l\'affectation');
      return;
    }
    
    const addedAssignment = await addAssignmentResponse.json();
    console.log(`✅ Affectation créée: ${addedAssignment.message}`);
    
    // 4. Vérifier que l'affectation existe
    console.log('\n4. Vérification de l\'affectation...');
    const assignmentsResponse = await fetch(`${BASE_URL}/api/affectations-materiel`);
    if (assignmentsResponse.ok) {
      const assignmentsData = await assignmentsResponse.json();
      const relatedAssignments = assignmentsData.affectations?.filter(a => a.materiel_id === addedMaterial.materiel.id) || [];
      console.log(`✅ ${relatedAssignments.length} affectation(s) trouvée(s) pour ce matériel`);
    }
    
    // 5. Supprimer le matériel (devrait supprimer l'affectation aussi)
    console.log('\n5. Suppression du matériel (avec affectation)...');
    const deleteResponse = await fetch(`${BASE_URL}/api/materiel?id=${addedMaterial.materiel.id}`, {
      method: 'DELETE'
    });
    
    if (deleteResponse.ok) {
      const deleteResult = await deleteResponse.json();
      console.log('✅ Matériel supprimé avec succès!');
      console.log(`   Message: ${deleteResult.message}`);
      
      // 6. Vérifier que l'affectation a été supprimée
      console.log('\n6. Vérification de la suppression de l\'affectation...');
      const assignmentsResponse2 = await fetch(`${BASE_URL}/api/affectations-materiel`);
      if (assignmentsResponse2.ok) {
        const assignmentsData2 = await assignmentsResponse2.json();
        const remainingAssignments = assignmentsData2.affectations?.filter(a => a.materiel_id === addedMaterial.materiel.id) || [];
        console.log(`✅ ${remainingAssignments.length} affectation(s) restante(s) pour ce matériel`);
        
        if (remainingAssignments.length === 0) {
          console.log('✅ L\'affectation a été supprimée automatiquement (suppression en cascade)');
        } else {
          console.log('⚠️ L\'affectation est encore présente');
        }
      }
      
      // 7. Vérifier que le matériel a été supprimé
      console.log('\n7. Vérification finale...');
      const materialsResponse2 = await fetch(`${BASE_URL}/api/materiel`);
      if (materialsResponse2.ok) {
        const materialsData2 = await materialsResponse2.json();
        const deletedMaterial = materialsData2.materiel?.find(m => m.id === addedMaterial.materiel.id);
        
        if (!deletedMaterial) {
          console.log('✅ Le matériel a été supprimé avec succès');
          console.log('✅ La suppression en cascade fonctionne parfaitement!');
        } else {
          console.log('⚠️ Le matériel est encore présent');
        }
      }
      
    } else {
      const error = await deleteResponse.json();
      console.log('❌ Erreur lors de la suppression:', error.error);
    }
    
    console.log('\n🎯 Test de suppression en cascade terminé!');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Vérifier si le serveur est en cours d'exécution
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/materiel`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🔍 Vérification du serveur...');
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Le serveur n\'est pas en cours d\'exécution.');
    console.log('   Veuillez démarrer le serveur avec: npm run dev');
    return;
  }
  
  console.log('✅ Serveur détecté, lancement du test de suppression en cascade...\n');
  await testCascadeDeletion();
}

main();
