// Script de test pour vérifier les fonctionnalités CRUD des réclamations
const BASE_URL = 'http://localhost:3000';

async function testReclamationsCRUD() {
  console.log('🔍 Test des fonctionnalités CRUD des réclamations...\n');
  
  try {
    // 1. Test d'ajout d'une réclamation
    console.log('1. Test d\'ajout d\'une réclamation...');
    const testReclamation = {
      numero_reclamation: 'TEST-REC-' + Date.now(),
      type_reclamation: 'technique',
      priorite: 'normale',
      statut: 'ouverte',
      nom_client: 'Client Test',
      telephone_client: '0123456789',
      email_client: 'client@test.com',
      adresse_client: '123 Rue Test, 75001 Paris',
      technicien_responsable: 'Technicien Test',
      description_probleme: 'Problème de connexion internet',
      description_solution: 'Remplacement du modem',
      cout_reclamation: 150.00,
      indemnisation: 0,
      satisfaction_client: 4,
      commentaires_client: 'Service rapide et efficace',
      commentaires_internes: 'Intervention standard',
      garantie_applicable: true,
      escalade_requise: false,
      manager_notifie: false
    };
    
    const addResponse = await fetch(`${BASE_URL}/api/reclamations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testReclamation)
    });
    
    if (addResponse.ok) {
      const result = await addResponse.json();
      console.log('✅ Réclamation créée avec succès');
      console.log(`   ID: ${result.reclamation.id}`);
      console.log(`   Numéro: ${result.reclamation.numero_reclamation}`);
      console.log(`   Client: ${result.reclamation.nom_client}`);
      
      const reclamationId = result.reclamation.id;
      
      // 2. Test de modification de la réclamation
      console.log('\n2. Test de modification de la réclamation...');
      const updateData = {
        statut: 'resolue',
        description_solution: 'Remplacement du modem et configuration réseau',
        satisfaction_client: 5,
        commentaires_client: 'Excellent service, problème résolu rapidement',
        date_resolution: '2025-01-06'
      };
      
      const updateResponse = await fetch(`${BASE_URL}/api/reclamations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reclamationId, ...updateData })
      });
      
      if (updateResponse.ok) {
        const updateResult = await updateResponse.json();
        console.log('✅ Réclamation modifiée avec succès');
        console.log(`   Nouveau statut: ${updateResult.reclamation.statut}`);
        console.log(`   Satisfaction: ${updateResult.reclamation.satisfaction_client}/5`);
      } else {
        const error = await updateResponse.json();
        console.log('❌ Erreur lors de la modification:', error.error);
      }
      
      // 3. Test de récupération des réclamations
      console.log('\n3. Test de récupération des réclamations...');
      const getResponse = await fetch(`${BASE_URL}/api/reclamations`);
      
      if (getResponse.ok) {
        const getResult = await getResponse.json();
        console.log('✅ Réclamations récupérées avec succès');
        console.log(`   Nombre total: ${getResult.reclamations.length}`);
        
        // Trouver notre réclamation de test
        const ourReclamation = getResult.reclamations.find(r => r.id === reclamationId);
        if (ourReclamation) {
          console.log(`   Notre réclamation trouvée: ${ourReclamation.numero_reclamation}`);
          console.log(`   Statut: ${ourReclamation.statut}`);
        }
      } else {
        const error = await getResponse.json();
        console.log('❌ Erreur lors de la récupération:', error.error);
      }
      
      // 4. Test de suppression de la réclamation
      console.log('\n4. Test de suppression de la réclamation...');
      const deleteResponse = await fetch(`${BASE_URL}/api/reclamations?id=${reclamationId}`, {
        method: 'DELETE'
      });
      
      if (deleteResponse.ok) {
        const deleteResult = await deleteResponse.json();
        console.log('✅ Réclamation supprimée avec succès');
        console.log(`   Message: ${deleteResult.message}`);
      } else {
        const error = await deleteResponse.json();
        console.log('❌ Erreur lors de la suppression:', error.error);
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
    const response = await fetch(`${BASE_URL}/api/reclamations`);
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
  await testReclamationsCRUD();
}

main();
