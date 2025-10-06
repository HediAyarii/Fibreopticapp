const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testCarburantData() {
  console.log('🔍 Test des données carburant...\n');

  try {
    // Test API carburant
    const response1 = await fetch('http://localhost:3000/api/carburant');
    const data1 = await response1.json();
    
    console.log('1. API /api/carburant:');
    console.log('   Total:', data1.total || 0);
    if(data1.carburant && data1.carburant.length > 0) {
      console.log('   Premier enregistrement:', data1.carburant[0]);
      const hamdi = data1.carburant.find(c => c.employe_assigné && c.employe_assigné.toString() === '8');
      if(hamdi) {
        console.log('   HAMDI trouvé (ID 8):', hamdi);
      } else {
        console.log('   HAMDI (ID 8) non trouvé');
      }
    }
    
    // Test API consommation-carburant
    const response2 = await fetch('http://localhost:3000/api/consommation-carburant');
    const data2 = await response2.json();
    
    console.log('\n2. API /api/consommation-carburant:');
    console.log('   Total employés:', data2.consommationParEmploye?.length || 0);
    if(data2.consommationParEmploye && data2.consommationParEmploye.length > 0) {
      console.log('   Premier employé:', data2.consommationParEmploye[0]);
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testCarburantData();
