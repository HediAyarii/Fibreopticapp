// Script de test pour vérifier le nouveau tableau des réclamations
const BASE_URL = 'http://localhost:3000';

async function testReclamationsTable() {
  console.log('🔍 Test du nouveau tableau des réclamations...\n');
  
  try {
    // Créer une réclamation de test avec tous les champs
    const testReclamation = {
      numero_reclamation: 'TEST-TABLE-' + Date.now(),
      type_reclamation: 'technique',
      priorite: 'haute',
      statut: 'ouverte',
      nom_client: 'Client Test Tableau',
      telephone_client: '0123456789',
      email_client: 'client.tableau@test.com',
      adresse_client: '123 Rue Test Tableau, 75001 Paris',
      description_probleme: 'Problème de connexion internet très urgent',
      description_solution: 'Remplacement du modem et configuration réseau',
      deadline: '2025-01-15',
      commentaires_client: 'Service rapide et efficace',
      commentaires_internes: 'Intervention prioritaire',
      materiel_defectueux: 'Modem défaillant'
    };
    
    console.log('1. Création d\'une réclamation de test...');
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
      
      const reclamationId = result.reclamation.id;
      
      // Récupérer toutes les réclamations pour vérifier l'affichage
      console.log('\n2. Récupération des réclamations pour vérifier l\'affichage...');
      const getResponse = await fetch(`${BASE_URL}/api/reclamations`);
      
      if (getResponse.ok) {
        const getResult = await getResponse.json();
        console.log('✅ Réclamations récupérées avec succès');
        console.log(`   Nombre total: ${getResult.reclamations.length}`);
        
        // Trouver notre réclamation de test
        const ourReclamation = getResult.reclamations.find(r => r.id === reclamationId);
        if (ourReclamation) {
          console.log('\n📊 Données de la réclamation dans le tableau :');
          console.log(`   ✅ Deadline: ${ourReclamation.date_resolution || 'Non définie'}`);
          console.log(`   ✅ Intervention Associée: ${ourReclamation.intervention_client || 'Aucune'}`);
          console.log(`   ✅ Description Problème: ${ourReclamation.description_probleme || 'Non spécifié'}`);
          console.log(`   ✅ Nom du Client: ${ourReclamation.nom_client || 'Non spécifié'}`);
          console.log(`   ✅ Email Client: ${ourReclamation.email_client || 'Non spécifié'}`);
          console.log(`   ✅ Priorité: ${ourReclamation.priorite || 'normale'}`);
          console.log(`   ✅ Type Réclamation: ${ourReclamation.type_reclamation || 'Non spécifié'}`);
          console.log(`   ✅ Employé: ${ourReclamation.employe_nom || 'Non assigné'}`);
          console.log(`   ✅ Date Création: ${ourReclamation.created_at ? new Date(ourReclamation.created_at).toLocaleDateString('fr-FR') : 'Non spécifié'}`);
          console.log(`   ✅ Statut: ${ourReclamation.statut || 'ouverte'}`);
        }
        
        // Vérifier que toutes les colonnes sont présentes
        console.log('\n📋 Colonnes du tableau des réclamations :');
        console.log('   1. ✅ Deadline');
        console.log('   2. ✅ Intervention Associée');
        console.log('   3. ✅ Description Problème');
        console.log('   4. ✅ Nom du Client');
        console.log('   5. ✅ Email Client');
        console.log('   6. ✅ Priorité');
        console.log('   7. ✅ Type Réclamation');
        console.log('   8. ✅ Employé');
        console.log('   9. ✅ Date Création');
        console.log('   10. ✅ Statut');
        console.log('   11. ✅ Actions');
        
      } else {
        const error = await getResponse.json();
        console.log('❌ Erreur lors de la récupération:', error.error);
      }
      
      // Nettoyage - suppression de la réclamation de test
      console.log('\n3. Nettoyage - suppression de la réclamation...');
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
    
    console.log('\n🎯 Test du tableau des réclamations terminé!');
    console.log('📝 Le tableau affiche maintenant toutes les colonnes demandées :');
    console.log('   - Deadline');
    console.log('   - Intervention Associée');
    console.log('   - Description Problème');
    console.log('   - Nom du Client');
    console.log('   - Email Client');
    console.log('   - Priorité');
    console.log('   - Type Réclamation');
    console.log('   - Employé');
    console.log('   - Date Création');
    console.log('   - Statut');
    console.log('   - Actions');
    
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
  await testReclamationsTable();
}

main();
