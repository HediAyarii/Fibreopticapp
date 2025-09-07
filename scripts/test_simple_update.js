// Test simple pour identifier le problème de modification
const BASE_URL = 'http://localhost:3000';

async function testSimpleUpdate() {
  console.log('🔍 Test simple de modification...\n');
  
  try {
    // Créer une réclamation simple
    const testReclamation = {
      numero_reclamation: 'TEST-UPDATE-' + Date.now(),
      type_reclamation: 'technique',
      priorite: 'normale',
      statut: 'ouverte',
      nom_client: 'Client Test Update',
      description_probleme: 'Problème de test'
    };
    
    console.log('1. Création de la réclamation...');
    const addResponse = await fetch(`${BASE_URL}/api/reclamations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testReclamation)
    });
    
    if (addResponse.ok) {
      const result = await addResponse.json();
      console.log('✅ Réclamation créée');
      console.log(`   ID: ${result.reclamation.id}`);
      
      const reclamationId = result.reclamation.id;
      
      // Test de modification simple
      console.log('\n2. Test de modification simple...');
      const updateData = {
        statut: 'en_cours'
      };
      
      console.log('Données envoyées:', JSON.stringify({ id: reclamationId, ...updateData }, null, 2));
      
      const updateResponse = await fetch(`${BASE_URL}/api/reclamations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reclamationId, ...updateData })
      });
      
      if (updateResponse.ok) {
        const updateResult = await updateResponse.json();
        console.log('✅ Modification réussie');
        console.log(`   Nouveau statut: ${updateResult.reclamation.statut}`);
      } else {
        const error = await updateResponse.json();
        console.log('❌ Erreur lors de la modification:', error.error);
        console.log('Status:', updateResponse.status);
      }
      
      // Nettoyage
      console.log('\n3. Nettoyage...');
      await fetch(`${BASE_URL}/api/reclamations?id=${reclamationId}`, {
        method: 'DELETE'
      });
      console.log('✅ Réclamation supprimée');
      
    } else {
      const error = await addResponse.json();
      console.log('❌ Erreur lors de la création:', error.error);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testSimpleUpdate();
