// Script pour vérifier la structure de la table penalites
const BASE_URL = 'http://localhost:3000';

async function checkPenaltiesTable() {
  console.log('🔍 Vérification de la structure de la table penalites...\n');
  
  try {
    // 1. Récupérer toutes les pénalités pour voir la structure
    const getResponse = await fetch(`${BASE_URL}/api/penalites`);
    
    if (getResponse.ok) {
      const result = await getResponse.json();
      console.log('✅ Structure de la table penalites:');
      
      if (result.penalites && result.penalites.length > 0) {
        const firstPenalty = result.penalites[0];
        console.log('Champs disponibles:');
        Object.keys(firstPenalty).forEach(key => {
          console.log(`  - ${key}: ${typeof firstPenalty[key]} = ${firstPenalty[key]}`);
        });
      } else {
        console.log('Aucune pénalité trouvée');
      }
    } else {
      console.log('❌ Erreur lors de la récupération des pénalités');
    }
    
    // 2. Créer une pénalité de test pour voir la structure complète
    console.log('\n2. Création d\'une pénalité de test...');
    const testEmployee = {
      nom: 'Test',
      prenom: 'Structure',
      matricule: 'EMP-STRUCT-' + Date.now(),
      poste: 'Technicien',
      departement: 'Technique',
      email: 'test.structure@example.com',
      telephone: '0123456789'
    };
    
    const addEmployeeResponse = await fetch(`${BASE_URL}/api/employes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testEmployee)
    });
    
    if (addEmployeeResponse.ok) {
      const employeeResult = await addEmployeeResponse.json();
      const employeeId = employeeResult.employe.id;
      
      const testPenalty = {
        employe_id: employeeId,
        type_penalite: 'retard',
        montant: 100.00,
        statut: 'active',
        motif: 'Test structure'
      };
      
      const addPenaltyResponse = await fetch(`${BASE_URL}/api/penalites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPenalty)
      });
      
      if (addPenaltyResponse.ok) {
        const penaltyResult = await addPenaltyResponse.json();
        console.log('✅ Pénalité créée avec structure complète:');
        console.log(JSON.stringify(penaltyResult.penalite, null, 2));
        
        // Nettoyage
        await fetch(`${BASE_URL}/api/penalites?id=${penaltyResult.penalite.id}`, { method: 'DELETE' });
        await fetch(`${BASE_URL}/api/employes?id=${employeeId}`, { method: 'DELETE' });
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  }
}

checkPenaltiesTable();
