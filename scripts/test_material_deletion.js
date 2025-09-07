// Script de test pour vérifier la suppression de matériel avec contraintes de clé étrangère
const BASE_URL = 'http://localhost:3000';

async function testMaterialDeletion() {
  console.log('🔍 Test de suppression de matériel avec contraintes de clé étrangère...\n');
  
  try {
    // 1. Récupérer les matériels existants
    console.log('1. Récupération des matériels...');
    const materialsResponse = await fetch(`${BASE_URL}/api/materiel`);
    if (!materialsResponse.ok) {
      console.log('❌ Erreur lors de la récupération des matériels');
      return;
    }
    const materialsData = await materialsResponse.json();
    console.log(`✅ ${materialsData.materiel?.length || 0} matériels trouvés`);
    
    if (materialsData.materiel && materialsData.materiel.length > 0) {
      const firstMaterial = materialsData.materiel[0];
      console.log(`   Premier matériel: ${firstMaterial.nom_equipement} (ID: ${firstMaterial.id})`);
      
      // 2. Récupérer les affectations liées à ce matériel
      console.log('\n2. Vérification des affectations liées...');
      const assignmentsResponse = await fetch(`${BASE_URL}/api/affectations-materiel`);
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        const relatedAssignments = assignmentsData.affectations?.filter(a => a.materiel_id === firstMaterial.id) || [];
        console.log(`✅ ${relatedAssignments.length} affectation(s) liée(s) à ce matériel`);
        
        if (relatedAssignments.length > 0) {
          console.log('   Affectations liées:');
          relatedAssignments.forEach(assignment => {
            console.log(`     - ID: ${assignment.id}, Employé: ${assignment.employe_nom} ${assignment.employe_prenom}, Quantité: ${assignment.quantite_assignee}`);
          });
        }
        
        // 3. Tester la suppression du matériel
        console.log('\n3. Test de suppression du matériel...');
        console.log(`   Suppression du matériel: ${firstMaterial.nom_equipement} (ID: ${firstMaterial.id})`);
        
        const deleteResponse = await fetch(`${BASE_URL}/api/materiel?id=${firstMaterial.id}`, {
          method: 'DELETE'
        });
        
        if (deleteResponse.ok) {
          const deleteResult = await deleteResponse.json();
          console.log('✅ Matériel supprimé avec succès!');
          console.log(`   Message: ${deleteResult.message}`);
          
          // 4. Vérifier que les affectations ont été supprimées
          console.log('\n4. Vérification de la suppression des affectations...');
          const assignmentsResponse2 = await fetch(`${BASE_URL}/api/affectations-materiel`);
          if (assignmentsResponse2.ok) {
            const assignmentsData2 = await assignmentsResponse2.json();
            const remainingAssignments = assignmentsData2.affectations?.filter(a => a.materiel_id === firstMaterial.id) || [];
            console.log(`✅ ${remainingAssignments.length} affectation(s) restante(s) pour ce matériel`);
            
            if (remainingAssignments.length === 0) {
              console.log('✅ Toutes les affectations liées ont été supprimées automatiquement');
            } else {
              console.log('⚠️ Des affectations sont encore présentes');
            }
          }
          
          // 5. Vérifier que le matériel a été supprimé
          console.log('\n5. Vérification de la suppression du matériel...');
          const materialsResponse2 = await fetch(`${BASE_URL}/api/materiel`);
          if (materialsResponse2.ok) {
            const materialsData2 = await materialsResponse2.json();
            const deletedMaterial = materialsData2.materiel?.find(m => m.id === firstMaterial.id);
            
            if (!deletedMaterial) {
              console.log('✅ Le matériel a été supprimé avec succès');
            } else {
              console.log('⚠️ Le matériel est encore présent');
            }
          }
          
        } else {
          const error = await deleteResponse.json();
          console.log('❌ Erreur lors de la suppression:', error.error);
        }
      }
    } else {
      console.log('⚠️ Aucun matériel disponible pour le test');
    }
    
    console.log('\n🎯 Test terminé!');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
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
  
  console.log('✅ Serveur détecté, lancement du test...\n');
  await testMaterialDeletion();
}

main();
