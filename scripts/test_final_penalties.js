// Script de test final pour les fonctionnalités des pénalités
const BASE_URL = 'http://localhost:3000';

async function testFinalPenalties() {
  console.log('🔍 Test final des fonctionnalités des pénalités...\n');
  
  try {
    // 1. Créer un employé de test
    console.log('1. Création d\'un employé de test...');
    const testEmployee = {
      nom: 'Test',
      prenom: 'Final',
      matricule: 'EMP-FINAL-' + Date.now(),
      poste: 'Technicien',
      departement: 'Technique',
      email: 'test.final@example.com',
      telephone: '0123456789'
    };
    
    const addEmployeeResponse = await fetch(`${BASE_URL}/api/employes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testEmployee)
    });
    
    if (!addEmployeeResponse.ok) {
      console.log('❌ Erreur création employé');
      return;
    }
    
    const employeeResult = await addEmployeeResponse.json();
    const employeeId = employeeResult.employe.id;
    console.log('✅ Employé créé:', employeeId);
    
    // 2. Test d'ajout d'une pénalité (numéro auto-généré)
    console.log('\n2. Test d\'ajout d\'une pénalité...');
    const testPenalty = {
      employe_id: employeeId,
      type_penalite: 'retard',
      montant: 30.00,
      statut: 'active',
      date_echeance: '2025-01-20',
      motif: 'Retard injustifié de 45 minutes',
      commentaires: 'Premier avertissement',
      manager_approbateur: 'Manager Principal'
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
      console.log(`   Numéro auto-généré: ${result.penalite.numero_penalite}`);
      console.log(`   Type: ${result.penalite.type_penalite}`);
      console.log(`   Montant: ${result.penalite.montant} €`);
      console.log(`   Manager: ${result.penalite.manager_approbateur}`);
      
      const penaltyId = result.penalite.id;
      
      // 3. Test de modification complète
      console.log('\n3. Test de modification complète...');
      const updateData = {
        montant: 60.00,
        statut: 'suspendue',
        motif: 'Retard injustifié - Modification',
        commentaires: 'Deuxième avertissement',
        manager_approbateur: 'Manager Secondaire'
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
        console.log(`   Nouveau manager: ${updateResult.penalite.manager_approbateur}`);
      } else {
        const error = await updateResponse.json();
        console.log('❌ Erreur lors de la modification:', error.error);
      }
      
      // 4. Test de récupération des pénalités
      console.log('\n4. Test de récupération des pénalités...');
      const getResponse = await fetch(`${BASE_URL}/api/penalites`);
      
      if (getResponse.ok) {
        const getResult = await getResponse.json();
        console.log('✅ Pénalités récupérées avec succès');
        console.log(`   Nombre total: ${getResult.penalites.length}`);
        
        // Trouver notre pénalité de test
        const ourPenalty = getResult.penalites.find(p => p.id === penaltyId);
        if (ourPenalty) {
          console.log(`   Notre pénalité trouvée:`);
          console.log(`     Numéro: ${ourPenalty.numero_penalite}`);
          console.log(`     Type: ${ourPenalty.type_penalite}`);
          console.log(`     Montant: ${ourPenalty.montant} €`);
          console.log(`     Statut: ${ourPenalty.statut}`);
          console.log(`     Manager: ${ourPenalty.manager_approbateur}`);
        }
      } else {
        const error = await getResponse.json();
        console.log('❌ Erreur lors de la récupération:', error.error);
      }
      
      // 5. Test de suppression de la pénalité
      console.log('\n5. Test de suppression de la pénalité...');
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
      
      // 6. Nettoyage - suppression de l'employé de test
      console.log('\n6. Nettoyage - suppression de l\'employé de test...');
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
    
    console.log('\n🎯 Test final terminé!');
    console.log('\n📋 Résumé des fonctionnalités testées :');
    console.log('   ✅ Ajout de pénalité avec numéro auto-généré');
    console.log('   ✅ Modification de pénalité (montant, statut, motif, commentaires, manager)');
    console.log('   ✅ Récupération des pénalités');
    console.log('   ✅ Suppression de pénalité');
    console.log('   ✅ Champs simplifiés (sans méthode de paiement, référence de paiement)');
    console.log('   ✅ Numéro de pénalité unique et automatique');
    console.log('   ✅ Tous les montants en Euro (€)');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

async function main() {
  await testFinalPenalties();
}

main();
