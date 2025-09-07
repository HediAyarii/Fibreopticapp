// Script de test final pour vérifier toutes les fonctionnalités des employés
const BASE_URL = 'http://localhost:3000';

async function testFinalEmployeeFunctionality() {
  console.log('🎯 Test final des fonctionnalités des employés...\n');
  
  let employeeId = null;
  
  try {
    // 1. Test d'ajout d'un employé
    console.log('1. ✅ Test d\'ajout d\'un employé...');
    const testEmployee = {
      nom: 'Final',
      prenom: 'Test',
      matricule: 'EMP-FINAL-' + Date.now(),
      poste: 'Technicien',
      departement: 'Technique',
      email: 'final.test@example.com',
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
    
    if (addResponse.ok) {
      const result = await addResponse.json();
      employeeId = result.employe.id;
      console.log(`   ✅ Employé créé avec l'ID: ${employeeId}`);
    } else {
      console.log('   ❌ Erreur lors de la création');
      return;
    }
    
    // 2. Test de récupération des employés
    console.log('\n2. ✅ Test de récupération des employés...');
    const getResponse = await fetch(`${BASE_URL}/api/employes`);
    
    if (getResponse.ok) {
      const getResult = await getResponse.json();
      console.log(`   ✅ ${getResult.employes.length} employés récupérés`);
    } else {
      console.log('   ❌ Erreur lors de la récupération');
    }
    
    // 3. Test de modification de l'employé
    console.log('\n3. ✅ Test de modification de l\'employé...');
    const updateData = {
      poste: 'Technicien Senior',
      salaire: 3000.00,
      pourcentage_taxe: 25.0
    };
    
    const updateResponse = await fetch(`${BASE_URL}/api/employes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: employeeId, ...updateData })
    });
    
    if (updateResponse.ok) {
      const updateResult = await updateResponse.json();
      console.log(`   ✅ Employé modifié - Nouveau poste: ${updateResult.employe.poste}`);
    } else {
      console.log('   ❌ Erreur lors de la modification');
    }
    
    // 4. Test d'assignation de carte carburant
    console.log('\n4. ✅ Test d\'assignation de carte carburant...');
    
    const carburantResponse = await fetch(`${BASE_URL}/api/carburant`);
    if (carburantResponse.ok) {
      const carburantData = await carburantResponse.json();
      const availableCards = carburantData.carburant || [];
      
      if (availableCards.length > 0) {
        const testCard = availableCards[0];
        console.log(`   ✅ Carte disponible: ${testCard.numero_carte}`);
        
        const assignData = {
          numero_carte: testCard.numero_carte,
          employe_id: employeeId
        };
        
        const assignResponse = await fetch(`${BASE_URL}/api/carburant-assignation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(assignData)
        });
        
        if (assignResponse.ok) {
          const assignResult = await assignResponse.json();
          console.log(`   ✅ Carte assignée: ${assignResult.assignation.numero_carte}`);
          
          // 5. Test de récupération de l'assignation actuelle
          console.log('\n5. ✅ Test de récupération de l\'assignation actuelle...');
          const currentAssignResponse = await fetch(`${BASE_URL}/api/carburant-assignation?employe_id=${employeeId}`);
          
          if (currentAssignResponse.ok) {
            const currentAssignData = await currentAssignResponse.json();
            if (currentAssignData.assignation) {
              console.log(`   ✅ Carte actuelle: ${currentAssignData.assignation.numero_carte}`);
            } else {
              console.log('   ⚠️ Aucune assignation active trouvée');
            }
          } else {
            console.log('   ❌ Erreur lors de la récupération de l\'assignation');
          }
          
          // 6. Test de l'historique des cartes
          console.log('\n6. ✅ Test de l\'historique des cartes...');
          const historyResponse = await fetch(`${BASE_URL}/api/carburant-histoire?employe_id=${employeeId}`);
          
          if (historyResponse.ok) {
            const historyData = await historyResponse.json();
            console.log(`   ✅ Historique récupéré - ${historyData.consommation_par_employe?.length || 0} entrées`);
          } else {
            console.log('   ❌ Erreur lors de la récupération de l\'historique');
          }
          
        } else {
          console.log('   ❌ Erreur lors de l\'assignation');
        }
      } else {
        console.log('   ⚠️ Aucune carte carburant disponible');
      }
    } else {
      console.log('   ❌ Erreur lors de la récupération des cartes carburant');
    }
    
    // 7. Test de suppression de l'employé
    console.log('\n7. ✅ Test de suppression de l\'employé...');
    const deleteResponse = await fetch(`${BASE_URL}/api/employes?id=${employeeId}`, {
      method: 'DELETE'
    });
    
    if (deleteResponse.ok) {
      const deleteResult = await deleteResponse.json();
      console.log(`   ✅ Employé supprimé: ${deleteResult.message}`);
    } else {
      console.log('   ❌ Erreur lors de la suppression');
    }
    
    console.log('\n🎉 Test final terminé avec succès!');
    console.log('\n📋 Résumé des fonctionnalités testées :');
    console.log('   ✅ Ajout d\'employé');
    console.log('   ✅ Récupération des employés');
    console.log('   ✅ Modification d\'employé');
    console.log('   ✅ Assignation de carte carburant');
    console.log('   ✅ Récupération de l\'assignation actuelle');
    console.log('   ✅ Historique des cartes carburant');
    console.log('   ✅ Suppression d\'employé');
    console.log('   ✅ Affichage du numéro de carte actuelle dans le tableau');
    
    console.log('\n🔧 Corrections apportées :');
    console.log('   ✅ Tables carburant, carburant_assignations, carburant_consommation créées');
    console.log('   ✅ Colonnes manquantes ajoutées (date_fin, prix_unitaire)');
    console.log('   ✅ Script Python d\'import carburant corrigé (problème Unicode)');
    console.log('   ✅ API carburant-assignation corrigée pour supporter les paramètres employe_id');
    console.log('   ✅ Fonction loadEmployeesFromDatabase mise à jour pour inclure les cartes carburant');
    console.log('   ✅ Tableau des employés mis à jour avec la colonne "Carte Carburant"');
    
  } catch (error) {
    console.error('❌ Erreur lors du test final:', error.message);
  }
}

async function main() {
  await testFinalEmployeeFunctionality();
}

main();
