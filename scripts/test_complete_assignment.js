// Script pour ajouter des employés de test et tester l'affectation complète
const BASE_URL = 'http://localhost:3000';

async function addTestEmployees() {
  console.log('👥 Ajout d\'employés de test...\n');
  
  const testEmployees = [
    {
      matricule: 'EMP001',
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'jean.dupont@test.com',
      telephone: '0123456789',
      poste: 'Technicien',
      statut: 'actif',
      niveau_acces: 'technicien',
      region: 'Paris',
      pourcentage_taxe: 20.0
    },
    {
      matricule: 'EMP002',
      nom: 'Martin',
      prenom: 'Marie',
      email: 'marie.martin@test.com',
      telephone: '0987654321',
      poste: 'Chef d\'équipe',
      statut: 'actif',
      niveau_acces: 'chef_equipe',
      region: 'Lyon',
      pourcentage_taxe: 25.0
    },
    {
      matricule: 'EMP003',
      nom: 'Bernard',
      prenom: 'Pierre',
      email: 'pierre.bernard@test.com',
      telephone: '0555666777',
      poste: 'Technicien',
      statut: 'actif',
      niveau_acces: 'technicien',
      region: 'Marseille',
      pourcentage_taxe: 20.0
    }
  ];
  
  const addedEmployees = [];
  
  for (const employee of testEmployees) {
    try {
      const response = await fetch(`${BASE_URL}/api/employes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employee)
      });
      
      if (response.ok) {
        const result = await response.json();
        addedEmployees.push(result.employe);
        console.log(`✅ Employé ajouté: ${employee.prenom} ${employee.nom} (ID: ${result.employe.id})`);
      } else {
        const error = await response.json();
        console.log(`❌ Erreur pour ${employee.prenom} ${employee.nom}:`, error.error);
      }
    } catch (error) {
      console.log(`❌ Erreur lors de l'ajout de ${employee.prenom} ${employee.nom}:`, error.message);
    }
  }
  
  return addedEmployees;
}

async function testCompleteAssignment() {
  console.log('\n🔗 Test d\'affectation complète...\n');
  
  try {
    // 1. Récupérer les employés
    const employeesResponse = await fetch(`${BASE_URL}/api/employes`);
    if (!employeesResponse.ok) {
      console.log('❌ Impossible de récupérer les employés');
      return;
    }
    const employeesData = await employeesResponse.json();
    const employees = employeesData.employes || [];
    
    if (employees.length === 0) {
      console.log('⚠️ Aucun employé disponible pour le test');
      return;
    }
    
    // 2. Récupérer les matériels
    const materialsResponse = await fetch(`${BASE_URL}/api/materiel`);
    if (!materialsResponse.ok) {
      console.log('❌ Impossible de récupérer les matériels');
      return;
    }
    const materialsData = await materialsResponse.json();
    const materials = materialsData.materiel || [];
    
    if (materials.length === 0) {
      console.log('⚠️ Aucun matériel disponible pour le test');
      return;
    }
    
    // 3. Créer une affectation de test
    const testAssignment = {
      materiel_id: materials[0].id,
      employe_id: employees[0].id,
      quantite_assignee: 1,
      commentaires: 'Test d\'affectation automatique'
    };
    
    console.log(`📋 Affectation test:`);
    console.log(`   Matériel: ${materials[0].nom_equipement} (ID: ${materials[0].id})`);
    console.log(`   Employé: ${employees[0].prenom} ${employees[0].nom} (ID: ${employees[0].id})`);
    console.log(`   Quantité: ${testAssignment.quantite_assignee}`);
    
    const assignmentResponse = await fetch(`${BASE_URL}/api/affectations-materiel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testAssignment)
    });
    
    if (assignmentResponse.ok) {
      const result = await assignmentResponse.json();
      console.log('✅ Affectation créée avec succès!');
      console.log(`   ID affectation: ${result.affectation.id}`);
      console.log(`   Message: ${result.message}`);
    } else {
      const error = await assignmentResponse.json();
      console.log('❌ Erreur lors de l\'affectation:', error.error);
    }
    
    // 4. Vérifier les affectations
    console.log('\n📊 Vérification des affectations...');
    const assignmentsResponse = await fetch(`${BASE_URL}/api/affectations-materiel`);
    if (assignmentsResponse.ok) {
      const assignmentsData = await assignmentsResponse.json();
      console.log(`✅ Total des affectations: ${assignmentsData.affectations?.length || 0}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

async function main() {
  console.log('🚀 Démarrage des tests complets...\n');
  
  // Ajouter des employés de test
  const employees = await addTestEmployees();
  
  if (employees.length > 0) {
    // Tester l'affectation complète
    await testCompleteAssignment();
  } else {
    console.log('⚠️ Impossible de continuer sans employés');
  }
  
  console.log('\n🎯 Tests terminés!');
}

main();
