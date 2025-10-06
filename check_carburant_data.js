const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function checkCarburantData() {
  console.log('🔍 Vérification des données de carburant...\n');

  try {
    // Test 1: Vérifier l'API carburant de base
    console.log('1. Test API carburant de base:');
    const response1 = await fetch('http://localhost:3000/api/carburant');
    const data1 = await response1.json();
    console.log('   Cartes carburant:', data1.cartes?.length || 0);

    // Test 2: Vérifier l'API assignations
    console.log('\n2. Test API assignations carburant:');
    const response2 = await fetch('http://localhost:3000/api/carburant-assignation');
    const data2 = await response2.json();
    console.log('   Assignations:', data2.assignations?.length || 0);

    // Test 3: Vérifier les employés avec cartes carburant
    console.log('\n3. Test employés avec cartes carburant:');
    const response3 = await fetch('http://localhost:3000/api/employes');
    const data3 = await response3.json();
    const employesAvecCartes = data3.employes?.filter(emp => emp.numero_carte_carburant) || [];
    console.log('   Employés avec cartes:', employesAvecCartes.length);
    employesAvecCartes.forEach(emp => {
      console.log(`   - ${emp.nom} ${emp.prenom}: Carte ${emp.numero_carte_carburant}`);
    });

    // Test 4: Vérifier HAMDI BEN CHEDLI spécifiquement
    console.log('\n4. Test HAMDI BEN CHEDLI:');
    const hamdi = data3.employes?.find(emp => emp.nom === 'HAMDI' && emp.prenom === 'BEN CHEDLI');
    if (hamdi) {
      console.log('   Trouvé:', hamdi.nom, hamdi.prenom);
      console.log('   ID:', hamdi.id);
      console.log('   Carte carburant:', hamdi.numero_carte_carburant);
      console.log('   Matricule:', hamdi.matricule);
    } else {
      console.log('   HAMDI BEN CHEDLI non trouvé');
    }

    // Test 5: Vérifier les consommations par carte
    console.log('\n5. Test consommations par carte:');
    if (hamdi && hamdi.numero_carte_carburant) {
      const response5 = await fetch(`http://localhost:3000/api/carburant-consumption-by-employee?employe_id=${hamdi.id}`);
      const data5 = await response5.json();
      console.log('   Consommations pour HAMDI:', data5.consumptionData?.length || 0);
      if (data5.consumptionData && data5.consumptionData.length > 0) {
        data5.consumptionData.forEach(cons => {
          console.log(`   - ${cons.date_livraison}: ${cons.ca_ttc}€`);
        });
      }
    }

    console.log('\n📊 Résumé:');
    console.log('   ✅ APIs de carburant accessibles');
    console.log('   ✅ Employés avec cartes identifiés');
    console.log('   ⚠️  Vérification des données de consommation');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkCarburantData();
