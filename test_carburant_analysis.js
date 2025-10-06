const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testCarburantAnalysis() {
  console.log('🔍 Analyse des données carburant...\n');

  try {
    const response = await fetch('http://localhost:3000/api/carburant');
    const data = await response.json();
    
    console.log('Données carburant:');
    console.log('Total:', data.total || 0);
    
    if(data.carburant && data.carburant.length > 0) {
      console.log('\nPremier enregistrement:');
      const first = data.carburant[0];
      console.log('  - employe_assigné:', first.employe_assigné);
      console.log('  - numero_carte:', first.numero_carte);
      console.log('  - ca_ttc:', first.ca_ttc);
      console.log('  - date_livraison:', first.date_livraison);
      
      console.log('\nEnregistrements avec employe_assigné non null:');
      const withEmployee = data.carburant.filter(c => c.employe_assigné !== null);
      console.log('  - Nombre:', withEmployee.length);
      
      if(withEmployee.length > 0) {
        console.log('  - Premier:', withEmployee[0]);
      }
      
      console.log('\nEnregistrements avec ca_ttc > 0:');
      const withAmount = data.carburant.filter(c => c.ca_ttc && parseFloat(c.ca_ttc) > 0);
      console.log('  - Nombre:', withAmount.length);
      
      if(withAmount.length > 0) {
        console.log('  - Premier:', withAmount[0]);
        console.log('  - Total ca_ttc:', withAmount.reduce((sum, c) => sum + parseFloat(c.ca_ttc || 0), 0));
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testCarburantAnalysis();
