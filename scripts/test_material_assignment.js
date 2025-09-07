// Script de test pour vérifier les fonctionnalités de matériel et d'affectation
// Utilise l'API fetch intégrée de Node.js (disponible depuis Node 18)

const BASE_URL = 'http://localhost:3000';

async function testMaterialAndAssignment() {
  console.log('🔍 Test des fonctionnalités de matériel et d\'affectation...\n');
  
  try {
    // 1. Tester la récupération des matériels
    console.log('1. Test de récupération des matériels...');
    const materialsResponse = await fetch(`${BASE_URL}/api/materiel`);
    if (materialsResponse.ok) {
      const materialsData = await materialsResponse.json();
      console.log(`✅ ${materialsData.materiel?.length || 0} matériels trouvés`);
    } else {
      console.log('❌ Erreur lors de la récupération des matériels');
    }
    
    // 2. Tester la récupération des employés
    console.log('\n2. Test de récupération des employés...');
    const employeesResponse = await fetch(`${BASE_URL}/api/employes`);
    if (employeesResponse.ok) {
      const employeesData = await employeesResponse.json();
      console.log(`✅ ${employeesData.employees?.length || 0} employés trouvés`);
    } else {
      console.log('❌ Erreur lors de la récupération des employés');
    }
    
    // 3. Tester la récupération des affectations
    console.log('\n3. Test de récupération des affectations...');
    const assignmentsResponse = await fetch(`${BASE_URL}/api/affectations-materiel`);
    if (assignmentsResponse.ok) {
      const assignmentsData = await assignmentsResponse.json();
      console.log(`✅ ${assignmentsData.affectations?.length || 0} affectations trouvées`);
    } else {
      console.log('❌ Erreur lors de la récupération des affectations');
    }
    
    // 4. Test d'ajout d'un matériel de test
    console.log('\n4. Test d\'ajout d\'un matériel de test...');
    const testMaterial = {
      numero_serie: 'TEST-' + Date.now(),
      nom_equipement: 'Matériel de Test',
      type_materiel: 'Équipement',
      marque: 'TestBrand',
      modele: 'TestModel',
      statut: 'disponible',
      localisation: 'Entrepôt Test',
      quantite: 10,
      prix_unitaire: 100.50
    };
    
    const addMaterialResponse = await fetch(`${BASE_URL}/api/materiel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testMaterial)
    });
    
    if (addMaterialResponse.ok) {
      const addedMaterial = await addMaterialResponse.json();
      console.log('✅ Matériel de test ajouté avec succès');
      console.log(`   ID: ${addedMaterial.materiel?.id}`);
      
      // 5. Test d'affectation du matériel à un employé
      console.log('\n5. Test d\'affectation du matériel...');
      
      // Récupérer le premier employé disponible
      const employeesResponse2 = await fetch(`${BASE_URL}/api/employes`);
      if (employeesResponse2.ok) {
        const employeesData2 = await employeesResponse2.json();
        if (employeesData2.employees && employeesData2.employees.length > 0) {
          const firstEmployee = employeesData2.employees[0];
          
          const testAssignment = {
            materiel_id: addedMaterial.materiel.id,
            employe_id: firstEmployee.id,
            quantite_assignee: 2,
            commentaires: 'Test d\'affectation automatique'
          };
          
          const addAssignmentResponse = await fetch(`${BASE_URL}/api/affectations-materiel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testAssignment)
          });
          
          if (addAssignmentResponse.ok) {
            const addedAssignment = await addAssignmentResponse.json();
            console.log('✅ Affectation créée avec succès');
            console.log(`   Matériel: ${testMaterial.nom_equipement}`);
            console.log(`   Employé: ${firstEmployee.prenom} ${firstEmployee.nom}`);
            console.log(`   Quantité: ${testAssignment.quantite_assignee}`);
          } else {
            const error = await addAssignmentResponse.json();
            console.log('❌ Erreur lors de l\'affectation:', error.error);
          }
        } else {
          console.log('⚠️ Aucun employé trouvé pour le test d\'affectation');
        }
      }
    } else {
      const error = await addMaterialResponse.json();
      console.log('❌ Erreur lors de l\'ajout du matériel:', error.error);
    }
    
    console.log('\n🎯 Tests terminés!');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
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
  
  console.log('✅ Serveur détecté, lancement des tests...\n');
  await testMaterialAndAssignment();
}

main();
