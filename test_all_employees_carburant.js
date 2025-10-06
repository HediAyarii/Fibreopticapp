const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAllEmployeesCarburant() {
  console.log('🔍 Test des données carburant pour tous les employés...\n');

  try {
    const response = await fetch('http://localhost:3000/api/recap-calcul');
    const data = await response.json();
    
    console.log('Employés avec carburant:');
    if(data.recapData && data.recapData.length > 0) {
      data.recapData.forEach(emp => {
        if(emp.cout_carburant > 0) {
          console.log(`  - ${emp.employe_nom} ${emp.employe_prenom}: ${emp.cout_carburant}€`);
        }
      });
      
      const total = data.recapData.reduce((sum, emp) => sum + emp.cout_carburant, 0);
      console.log(`\nTotal carburant: ${total.toFixed(2)}€`);
      
      // Vérifier spécifiquement Mehrez Trabelsi
      const mehrez = data.recapData.find(emp => emp.employe_nom === 'TRABELSI' && emp.employe_prenom === 'Mehrez');
      if(mehrez) {
        console.log(`\nMehrez Trabelsi: ${mehrez.cout_carburant}€ (devrait être 382.89€)`);
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testAllEmployeesCarburant();
