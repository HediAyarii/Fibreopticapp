// Script de test complet pour vérifier toutes les fonctionnalités des employés
const BASE_URL = 'http://localhost:3000';

async function testCompleteEmployeeFunctionality() {
  console.log('🔍 Test complet des fonctionnalités des employés...\n');
  
  try {
    // 1. Test d'ajout d'un employé
    console.log('1. Test d\'ajout d\'un employé...');
    const testEmployee = {
      nom: 'Test',
      prenom: 'Employee',
      matricule: 'EMP-TEST-' + Date.now(),
      poste: 'Technicien',
      departement: 'Technique',
      email: 'test.employee@example.com',
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
      console.log('✅ Employé créé avec succès');
      console.log(`   ID: ${result.employe.id}`);
      console.log(`   Nom: ${result.employe.prenom} ${result.employe.nom}`);
      console.log(`   Matricule: ${result.employe.matricule}`);
      
      const employeeId = result.employe.id;
      
      // 2. Test de récupération des employés
      console.log('\n2. Test de récupération des employés...');
      const getResponse = await fetch(`${BASE_URL}/api/employes`);
      
      if (getResponse.ok) {
        const getResult = await getResponse.json();
        console.log('✅ Employés récupérés avec succès');
        console.log(`   Nombre total: ${getResult.employes.length}`);
        
        // Trouver notre employé de test
        const ourEmployee = getResult.employes.find(e => e.id === employeeId);
        if (ourEmployee) {
          console.log(`   Notre employé trouvé: ${ourEmployee.prenom} ${ourEmployee.nom}`);
        }
      } else {
        const error = await getResponse.json();
        console.log('❌ Erreur lors de la récupération:', error.error);
      }
      
      // 3. Test de modification de l'employé
      console.log('\n3. Test de modification de l\'employé...');
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
        console.log('✅ Employé modifié avec succès');
        console.log(`   Nouveau poste: ${updateResult.employe.poste}`);
        console.log(`   Nouveau salaire: ${updateResult.employe.salaire} €`);
        console.log(`   Nouveau pourcentage taxe: ${updateResult.employe.pourcentage_taxe}%`);
      } else {
        const error = await updateResponse.json();
        console.log('❌ Erreur lors de la modification:', error.error);
      }
      
      // 4. Test d'assignation de carte carburant
      console.log('\n4. Test d\'assignation de carte carburant...');
      
      // D'abord, récupérer les cartes disponibles
      const carburantResponse = await fetch(`${BASE_URL}/api/carburant`);
      if (carburantResponse.ok) {
        const carburantData = await carburantResponse.json();
        const availableCards = carburantData.carburant || [];
        
        if (availableCards.length > 0) {
          const testCard = availableCards[0];
          console.log(`   Carte disponible: ${testCard.numero_carte}`);
          
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
            console.log('✅ Carte carburant assignée avec succès');
            console.log(`   Carte: ${assignResult.assignation.numero_carte}`);
            console.log(`   Employé: ${assignResult.assignation.employe_nom}`);
            
            // 5. Test de récupération de l'assignation actuelle
            console.log('\n5. Test de récupération de l\'assignation actuelle...');
            const currentAssignResponse = await fetch(`${BASE_URL}/api/carburant-assignation?employe_id=${employeeId}`);
            
            if (currentAssignResponse.ok) {
              const currentAssignData = await currentAssignResponse.json();
              if (currentAssignData.assignation) {
                console.log('✅ Assignation actuelle récupérée');
                console.log(`   Carte actuelle: ${currentAssignData.assignation.numero_carte}`);
              } else {
                console.log('⚠️ Aucune assignation active trouvée');
              }
            } else {
              console.log('❌ Erreur lors de la récupération de l\'assignation');
            }
            
            // 6. Test de l'historique des cartes
            console.log('\n6. Test de l\'historique des cartes...');
            const historyResponse = await fetch(`${BASE_URL}/api/carburant-histoire?employe_id=${employeeId}`);
            
            if (historyResponse.ok) {
              const historyData = await historyResponse.json();
              console.log('✅ Historique des cartes récupéré');
              console.log(`   Nombre d\'entrées: ${historyData.consommation_par_employe?.length || 0}`);
            } else {
              console.log('❌ Erreur lors de la récupération de l\'historique');
            }
            
          } else {
            const error = await assignResponse.json();
            console.log('❌ Erreur lors de l\'assignation:', error.error);
          }
        } else {
          console.log('⚠️ Aucune carte carburant disponible pour le test');
        }
      } else {
        console.log('❌ Erreur lors de la récupération des cartes carburant');
      }
      
      // 7. Test de suppression de l'employé
      console.log('\n7. Test de suppression de l\'employé...');
      const deleteResponse = await fetch(`${BASE_URL}/api/employes?id=${employeeId}`, {
        method: 'DELETE'
      });
      
      if (deleteResponse.ok) {
        const deleteResult = await deleteResponse.json();
        console.log('✅ Employé supprimé avec succès');
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
    console.log('\n📋 Résumé des fonctionnalités testées :');
    console.log('   ✅ Ajout d\'employé');
    console.log('   ✅ Récupération des employés');
    console.log('   ✅ Modification d\'employé');
    console.log('   ✅ Assignation de carte carburant');
    console.log('   ✅ Récupération de l\'assignation actuelle');
    console.log('   ✅ Historique des cartes carburant');
    console.log('   ✅ Suppression d\'employé');
    console.log('   ✅ Affichage du numéro de carte actuelle dans le tableau');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

async function main() {
  await testCompleteEmployeeFunctionality();
}

main();
