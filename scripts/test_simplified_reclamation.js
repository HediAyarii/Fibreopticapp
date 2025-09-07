// Script de test pour vérifier le formulaire de réclamation simplifié
const BASE_URL = 'http://localhost:3000';

async function testSimplifiedReclamationForm() {
  console.log('🔍 Test du formulaire de réclamation simplifié...\n');
  
  try {
    // Test d'ajout d'une réclamation avec les champs simplifiés
    console.log('1. Test d\'ajout d\'une réclamation simplifiée...');
    const testReclamation = {
      numero_reclamation: 'TEST-SIMPLE-' + Date.now(),
      type_reclamation: 'technique',
      priorite: 'normale',
      statut: 'ouverte',
      nom_client: 'Client Test Simple',
      telephone_client: '0123456789',
      email_client: 'client@test.com',
      adresse_client: '123 Rue Test, 75001 Paris',
      description_probleme: 'Problème de connexion internet',
      description_solution: 'Remplacement du modem',
      deadline: '2025-01-15', // Utilise le nouveau nom de champ
      commentaires_client: 'Service rapide et efficace',
      commentaires_internes: 'Intervention standard',
      materiel_defectueux: 'Modem défaillant'
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
      console.log(`   Deadline: ${result.reclamation.date_resolution}`);
      
      const reclamationId = result.reclamation.id;
      
      // Test de modification avec le nouveau champ deadline
      console.log('\n2. Test de modification avec deadline...');
      const updateData = {
        statut: 'en_cours',
        deadline: '2025-01-20', // Utilise le nouveau nom de champ
        description_solution: 'Diagnostic en cours, remplacement prévu'
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
        console.log(`   Nouvelle deadline: ${updateResult.reclamation.date_resolution}`);
      } else {
        const error = await updateResponse.json();
        console.log('❌ Erreur lors de la modification:', error.error);
      }
      
      // Test de récupération pour vérifier les données
      console.log('\n3. Test de récupération des données...');
      const getResponse = await fetch(`${BASE_URL}/api/reclamations`);
      
      if (getResponse.ok) {
        const getResult = await getResponse.json();
        const ourReclamation = getResult.reclamations.find(r => r.id === reclamationId);
        if (ourReclamation) {
          console.log('✅ Données récupérées avec succès');
          console.log(`   Réclamation trouvée: ${ourReclamation.numero_reclamation}`);
          console.log(`   Statut: ${ourReclamation.statut}`);
          console.log(`   Deadline: ${ourReclamation.date_resolution}`);
          console.log(`   Client: ${ourReclamation.nom_client}`);
        }
      }
      
      // Nettoyage - suppression de la réclamation de test
      console.log('\n4. Nettoyage - suppression de la réclamation...');
      const deleteResponse = await fetch(`${BASE_URL}/api/reclamations?id=${reclamationId}`, {
        method: 'DELETE'
      });
      
      if (deleteResponse.ok) {
        console.log('✅ Réclamation de test supprimée');
      }
      
    } else {
      const error = await addResponse.json();
      console.log('❌ Erreur lors de la création:', error.error);
    }
    
    console.log('\n🎯 Test du formulaire simplifié terminé!');
    
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
  await testSimplifiedReclamationForm();
}

main();
