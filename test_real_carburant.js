const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testRealCarburant() {
  console.log('🔍 Test des vraies données carburant...\n');

  try {
    const response = await fetch('http://localhost:3000/api/recap-calcul');
    const data = await response.json();
    
    console.log('Vraies données carburant:');
    if(data.recapData && data.recapData.length > 0) {
      const withCarburant = data.recapData.filter(emp => emp.cout_carburant > 0);
      console.log('Employés avec carburant:', withCarburant.length);
      
      if(withCarburant.length > 0) {
        withCarburant.forEach(emp => {
          console.log(`  - ${emp.employe_nom} ${emp.employe_prenom}: ${emp.cout_carburant}€`);
        });
      } else {
        console.log('  Aucun employé avec des données carburant trouvées');
      }
      
      const total = data.recapData.reduce((sum, emp) => sum + emp.cout_carburant, 0);
      console.log(`\nTotal carburant: ${total.toFixed(2)}€`);
      
      if(total === 0) {
        console.log('\n⚠️  Aucune donnée carburant trouvée - les données ne sont pas liées aux employés');
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testRealCarburant();
