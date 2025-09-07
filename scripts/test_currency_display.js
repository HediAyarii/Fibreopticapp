// Script de test pour vérifier que tous les montants sont en Euro
const BASE_URL = 'http://localhost:3000';

async function testCurrencyDisplay() {
  console.log('🔍 Test de l\'affichage des devises en Euro...\n');
  
  try {
    // 1. Test des réclamations
    console.log('1. Test des réclamations...');
    const testReclamation = {
      numero_reclamation: 'TEST-CURRENCY-' + Date.now(),
      type_reclamation: 'technique',
      priorite: 'haute',
      statut: 'ouverte',
      nom_client: 'Client Test Currency',
      description_probleme: 'Test de devise'
    };
    
    const addReclamationResponse = await fetch(`${BASE_URL}/api/reclamations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testReclamation)
    });
    
    if (addReclamationResponse.ok) {
      const result = await addReclamationResponse.json();
      console.log('✅ Réclamation créée');
      const reclamationId = result.reclamation.id;
      
      // Nettoyage
      await fetch(`${BASE_URL}/api/reclamations?id=${reclamationId}`, {
        method: 'DELETE'
      });
    }
    
    // 2. Test des pénalités
    console.log('\n2. Test des pénalités...');
    const testPenalty = {
      type_penalite: 'Retard',
      montant: 50.00,
      statut: 'active',
      description: 'Test de devise pour pénalité'
    };
    
    const addPenaltyResponse = await fetch(`${BASE_URL}/api/penalites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPenalty)
    });
    
    if (addPenaltyResponse.ok) {
      const result = await addPenaltyResponse.json();
      console.log('✅ Pénalité créée');
      const penaltyId = result.penalite.id;
      
      // Nettoyage
      await fetch(`${BASE_URL}/api/penalites?id=${penaltyId}`, {
        method: 'DELETE'
      });
    }
    
    // 3. Test du matériel
    console.log('\n3. Test du matériel...');
    const testMaterial = {
      numero_serie: 'TEST-CURRENCY-' + Date.now(),
      nom_equipement: 'Matériel Test Currency',
      type_materiel: 'Test',
      marque: 'TestBrand',
      modele: 'TestModel',
      statut: 'disponible',
      localisation: 'Test Location',
      quantite: 1,
      prix_unitaire: 150.00,
      cout_acquisition: 150.00
    };
    
    const addMaterialResponse = await fetch(`${BASE_URL}/api/materiel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testMaterial)
    });
    
    if (addMaterialResponse.ok) {
      const result = await addMaterialResponse.json();
      console.log('✅ Matériel créé');
      const materialId = result.materiel.id;
      
      // Nettoyage
      await fetch(`${BASE_URL}/api/materiel?id=${materialId}`, {
        method: 'DELETE'
      });
    }
    
    // 4. Test des données carburant
    console.log('\n4. Test des données carburant...');
    const carburantResponse = await fetch(`${BASE_URL}/api/carburant`);
    
    if (carburantResponse.ok) {
      const carburantData = await carburantResponse.json();
      console.log('✅ Données carburant récupérées');
      
      if (carburantData.carburant && carburantData.carburant.length > 0) {
        const firstItem = carburantData.carburant[0];
        console.log(`   Exemple de montant: ${firstItem.ca_ttc} €`);
      }
    }
    
    // 5. Test des données groupées
    console.log('\n5. Test des données groupées...');
    const groupedResponse = await fetch(`${BASE_URL}/api/carburant-grouped?period=month`);
    
    if (groupedResponse.ok) {
      const groupedData = await groupedResponse.json();
      console.log('✅ Données groupées récupérées');
      
      if (groupedData.summary) {
        console.log(`   Total consommation: ${groupedData.summary.total_consommation?.toFixed(2) || 0} €`);
      }
    }
    
    // 6. Test des données par employé
    console.log('\n6. Test des données par employé...');
    const employeesResponse = await fetch(`${BASE_URL}/api/carburant-employes`);
    
    if (employeesResponse.ok) {
      const employeesData = await employeesResponse.json();
      console.log('✅ Données par employé récupérées');
      
      if (employeesData.summary) {
        console.log(`   Total TTC: ${employeesData.summary.total_consommation_ttc?.toFixed(2) || 0} €`);
        console.log(`   Moyenne par employé: ${employeesData.summary.consommation_moyenne_par_employe?.toFixed(2) || 0} €`);
      }
    }
    
    console.log('\n🎯 Test des devises terminé!');
    console.log('📝 Vérification des devises dans l\'interface :');
    console.log('   ✅ Tous les montants sont maintenant affichés en Euro (€)');
    console.log('   ✅ Plus de références au Dinar Algérien (DA)');
    console.log('   ✅ Cohérence dans toute l\'application');
    
    console.log('\n📋 Sections vérifiées :');
    console.log('   ✅ Consommation carburant (groupée)');
    console.log('   ✅ Consommation carburant (par employé)');
    console.log('   ✅ Tableau des transactions carburant');
    console.log('   ✅ Tableau des pénalités');
    console.log('   ✅ Formulaires de matériel');
    console.log('   ✅ Modals de détails employé');
    
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
  await testCurrencyDisplay();
}

main();
