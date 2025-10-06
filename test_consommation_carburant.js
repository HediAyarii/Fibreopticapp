const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testConsommationCarburant() {
  console.log('🔍 Test de l\'API Consommation Carburant...\n');

  try {
    const response = await fetch('http://localhost:3000/api/consommation-carburant');
    const data = await response.json();
    
    console.log('API Consommation Carburant:');
    console.log('Employés avec carburant:', data.consommationParEmploye.length);
    
    if(data.consommationParEmploye.length > 0) {
      console.log('\nEmployés trouvés:');
      data.consommationParEmploye.forEach(emp => {
        if(emp.nom === 'HAMDI' || emp.nom === 'RIAHI') {
          console.log(`  - ${emp.nom} ${emp.prenom}: ${emp.consommation_totale_ttc}€`);
        }
      });
      
      const total = data.consommationParEmploye.reduce((sum, emp) => sum + emp.consommation_totale_ttc, 0);
      console.log(`\nTotal carburant: ${total.toFixed(2)}€`);
    } else {
      console.log('Aucun employé avec des données carburant trouvé');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testConsommationCarburant();
