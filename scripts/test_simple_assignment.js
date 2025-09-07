// Script simple pour tester l'affectation avec les employés existants
const BASE_URL = 'http://localhost:3000';

async function testAssignmentWithExistingData() {
  console.log('🔍 Test d\'affectation avec les données existantes...\n');
  
  try {
    // 1. Récupérer les employés
    console.log('1. Récupération des employés...');
    const employeesResponse = await fetch(`${BASE_URL}/api/employes`);
    if (!employeesResponse.ok) {
      console.log('❌ Erreur lors de la récupération des employés');
      return;
    }
    const employeesData = await employeesResponse.json();
    console.log(`✅ ${employeesData.employes?.length || 0} employés trouvés`);
    
    if (employeesData.employes && employeesData.employes.length > 0) {
      console.log('   Premier employé:', employeesData.employes[0].prenom, employeesData.employes[0].nom);
    }
    
    // 2. Récupérer les matériels
    console.log('\n2. Récupération des matériels...');
    const materialsResponse = await fetch(`${BASE_URL}/api/materiel`);
    if (!materialsResponse.ok) {
      console.log('❌ Erreur lors de la récupération des matériels');
      return;
    }
    const materialsData = await materialsResponse.json();
    console.log(`✅ ${materialsData.materiel?.length || 0} matériels trouvés`);
    
    if (materialsData.materiel && materialsData.materiel.length > 0) {
      console.log('   Premier matériel:', materialsData.materiel[0].nom_equipement);
    }
    
    // 3. Récupérer les affectations existantes
    console.log('\n3. Récupération des affectations existantes...');
    const assignmentsResponse = await fetch(`${BASE_URL}/api/affectations-materiel`);
    if (!assignmentsResponse.ok) {
      console.log('❌ Erreur lors de la récupération des affectations');
      return;
    }
    const assignmentsData = await assignmentsResponse.json();
    console.log(`✅ ${assignmentsData.affectations?.length || 0} affectations trouvées`);
    
    // 4. Tester une nouvelle affectation si on a des employés et des matériels
    if (employeesData.employes && employeesData.employes.length > 0 && 
        materialsData.materiel && materialsData.materiel.length > 0) {
      
      console.log('\n4. Test d\'une nouvelle affectation...');
      
      const testAssignment = {
        materiel_id: materialsData.materiel[0].id,
        employe_id: employeesData.employes[0].id,
        quantite_assignee: 1,
        commentaires: 'Test d\'affectation automatique'
      };
      
      console.log(`   Matériel: ${materialsData.materiel[0].nom_equipement} (ID: ${materialsData.materiel[0].id})`);
      console.log(`   Employé: ${employeesData.employes[0].prenom} ${employeesData.employes[0].nom} (ID: ${employeesData.employes[0].id})`);
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
    } else {
      console.log('⚠️ Impossible de tester l\'affectation: données insuffisantes');
    }
    
    console.log('\n🎯 Test terminé!');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testAssignmentWithExistingData();
