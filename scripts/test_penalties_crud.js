// Script de test pour vérifier les fonctionnalités CRUD des pénalités
const BASE_URL = 'http://localhost:3000';

async function testPenaltiesCRUD() {
  console.log('🔍 Test des fonctionnalités CRUD des pénalités...\n');
  
  try {
    // 0. Créer un employé de test d'abord
    console.log('0. Création d\'un employé de test...');
    const testEmployee = {
      nom: 'Test',
      prenom: 'Employee',
      matricule: 'EMP-TEST-' + Date.now(),
      poste: 'Technicien',
      departement: 'Technique',
      email: 'test.employee@example.com',
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
      console.log(`   Nom: ${employeeResult.employe.prenom} ${employeeResult.employe.nom}`);
    } else {
      const error = await addEmployeeResponse.json();
      console.log('❌ Erreur lors de la création de l\'employé:', error.error);
      return;
    }
    
    // 1. Test d'ajout d'une pénalité
    console.log('\n1. Test d\'ajout d\'une pénalité...');
    const testPenalty = {
      employe_id: employeeId,
      type_penalite: 'retard',
      montant: 25.00,
      statut: 'active',
      date_echeance: '2025-01-06',
      motif: 'Retard injustifié',
      commentaires: 'Premier avertissement'
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
      console.log(`   Type: ${result.penalite.type_penalite}`);
      console.log(`   Montant: ${result.penalite.montant} €`);
      
      const penaltyId = result.penalite.id;
      
      // 2. Test de modification de la pénalité
      console.log('\n2. Test de modification de la pénalité...');
      const updateData = {
        montant: 50.00,
        statut: 'suspendue',
        motif: 'Retard injustifié - Modification',
        commentaires: 'Deuxième avertissement'
      };
      
      const updateResponse = await fetch(`${BASE_URL}/api/penalites`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: penaltyId, ...updateData })
      });
      
      if (updateResponse.ok) {
        const updateResult = await updateResponse.json();
        console.log('✅ Pénalité modifiée avec succès');
        console.log(`   Nouveau montant: ${updateResult.penalite.montant} €`);
        console.log(`   Nouveau statut: ${updateResult.penalite.statut}`);
      } else {
        const error = await updateResponse.json();
        console.log('❌ Erreur lors de la modification:', error.error);
      }
      
      // 3. Test de récupération des pénalités
      console.log('\n3. Test de récupération des pénalités...');
      const getResponse = await fetch(`${BASE_URL}/api/penalites`);
      
      if (getResponse.ok) {
        const getResult = await getResponse.json();
        console.log('✅ Pénalités récupérées avec succès');
        console.log(`   Nombre total: ${getResult.penalites.length}`);
        
        // Trouver notre pénalité de test
        const ourPenalty = getResult.penalites.find(p => p.id === penaltyId);
        if (ourPenalty) {
          console.log(`   Notre pénalité trouvée: ${ourPenalty.type_penalite}`);
          console.log(`   Montant: ${ourPenalty.montant} €`);
          console.log(`   Statut: ${ourPenalty.statut}`);
        }
      } else {
        const error = await getResponse.json();
        console.log('❌ Erreur lors de la récupération:', error.error);
      }
      
      // 4. Test de suppression de la pénalité
      console.log('\n4. Test de suppression de la pénalité...');
      const deleteResponse = await fetch(`${BASE_URL}/api/penalites?id=${penaltyId}`, {
        method: 'DELETE'
      });
      
      if (deleteResponse.ok) {
        const deleteResult = await deleteResponse.json();
        console.log('✅ Pénalité supprimée avec succès');
        console.log(`   Message: ${deleteResult.message}`);
      } else {
        const error = await deleteResponse.json();
        console.log('❌ Erreur lors de la suppression:', error.error);
      }
      
      // 5. Nettoyage - suppression de l'employé de test
      console.log('\n5. Nettoyage - suppression de l\'employé de test...');
      const deleteEmployeeResponse = await fetch(`${BASE_URL}/api/employes?id=${employeeId}`, {
        method: 'DELETE'
      });
      
      if (deleteEmployeeResponse.ok) {
        console.log('✅ Employé de test supprimé');
      } else {
        console.log('⚠️ Erreur lors de la suppression de l\'employé (peut être normal si des contraintes existent)');
      }
      
    } else {
      const error = await addResponse.json();
      console.log('❌ Erreur lors de la création:', error.error);
    }
    
    console.log('\n🎯 Test terminé!');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Vérifier si le serveur est en cours d'exécution
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/penalites`);
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
  
  console.log('✅ Serveur détecté, lancement du test...\n');
  await testPenaltiesCRUD();
}

main();
