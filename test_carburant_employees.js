const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testCarburantEmployees() {
  console.log('🔍 Analyse des données carburant par employé...\n');

  try {
    // Récupérer les données carburant
    const response1 = await fetch('http://localhost:3000/api/carburant');
    const data1 = await response1.json();
    
    console.log('Données carburant:');
    console.log('Total enregistrements:', data1.total || 0);
    
    if(data1.carburant && data1.carburant.length > 0) {
      const total = data1.carburant.reduce((sum, c) => sum + parseFloat(c.ca_ttc || 0), 0);
      console.log('Total carburant:', total.toFixed(2) + '€');
      
      console.log('\nPremiers enregistrements:');
      data1.carburant.slice(0, 5).forEach((c, i) => {
        console.log(`  ${i+1}. ${c.ca_ttc}€ - ${c.date_livraison} - ${c.immat_vehicule}`);
      });
    }
    
    // Récupérer les employés
    const response2 = await fetch('http://localhost:3000/api/recap-calcul');
    const data2 = await response2.json();
    
    console.log('\nEmployés dans récap-calcul:');
    if(data2.recapData && data2.recapData.length > 0) {
      data2.recapData.forEach(emp => {
        console.log(`  - ${emp.employe_nom} ${emp.employe_prenom}: Carburant ${emp.cout_carburant}€`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testCarburantEmployees();
