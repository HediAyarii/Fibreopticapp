// Test spécifique avec le champ deadline
const BASE_URL = 'http://localhost:3000';

async function testDeadlineField() {
  console.log('🔍 Test spécifique avec le champ deadline...\n');
  
  try {
    // Créer une réclamation simple
    const testReclamation = {
      numero_reclamation: 'TEST-DEADLINE-' + Date.now(),
      type_reclamation: 'technique',
      priorite: 'normale',
      statut: 'ouverte',
      nom_client: 'Client Test Deadline',
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
      
      // Test de modification avec deadline
      console.log('\n2. Test de modification avec deadline...');
      const updateData = {
        statut: 'en_cours',
        date_resolution: '2025-01-20' // Utiliser directement date_resolution
      };
      
      console.log('Données envoyées:', JSON.stringify({ id: reclamationId, ...updateData }, null, 2));
      
      const updateResponse = await fetch(`${BASE_URL}/api/reclamations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reclamationId, ...updateData })
      });
      
      if (updateResponse.ok) {
        const updateResult = await updateResponse.json();
        console.log('✅ Modification avec deadline réussie');
        console.log(`   Nouveau statut: ${updateResult.reclamation.statut}`);
        console.log(`   Date de résolution: ${updateResult.reclamation.date_resolution}`);
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

testDeadlineField();
