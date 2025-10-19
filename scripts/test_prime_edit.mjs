import fetch from 'node-fetch';

async function testPrimeEdit() {
  console.log('🧪 Test de la modification de prime...');
  
  try {
    // 1. Récupérer les données actuelles
    console.log('\n📊 1. Récupération des données actuelles:');
    const getResponse = await fetch('http://localhost:3000/api/cout-par-salaire?mois=5&annee=2025');
    const getData = await getResponse.json();
    
    // Trouver un employé avec une prime
    const employeeWithPrime = getData.couts.find(cout => 
      cout.prime && Number(cout.prime) > 0
    );
    
    if (!employeeWithPrime) {
      console.log('   ❌ Aucun employé avec prime trouvé');
      return;
    }
    
    console.log(`   📊 Employé trouvé: ${employeeWithPrime.nom} ${employeeWithPrime.prenom}`);
    console.log(`   📊 Prime actuelle: ${employeeWithPrime.prime}€`);
    console.log(`   📊 RAP actuel: ${employeeWithPrime.rap}€`);
    
    // 2. Tester la modification de prime
    console.log('\n📊 2. Test de modification de prime:');
    const newPrimeAmount = 150.00; // Nouveau montant
    
    console.log(`   📊 Modification: ${employeeWithPrime.prime}€ → ${newPrimeAmount}€`);
    
    const putResponse = await fetch('http://localhost:3000/api/cout-par-salaire', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: employeeWithPrime.id,
        prime: newPrimeAmount
      }),
    });
    
    if (putResponse.ok) {
      const putData = await putResponse.json();
      console.log(`   ✅ Prime modifiée avec succès`);
      console.log(`   📊 Nouvelle prime: ${putData.cout.prime}€`);
      console.log(`   📊 Nouveau RAP: ${putData.cout.rap}€`);
      
      // Vérifier que le RAP a été recalculé
      const expectedRap = parseFloat(putData.cout.total_genere) - parseFloat(putData.cout.salaire_net) - (parseFloat(putData.cout.charge) * 0.5) + parseFloat(putData.cout.prime);
      console.log(`   📊 RAP attendu: ${expectedRap}€`);
      console.log(`   📊 RAP réel: ${putData.cout.rap}€`);
      
      if (Math.abs(parseFloat(putData.cout.rap) - expectedRap) < 0.01) {
        console.log(`   ✅ RAP correctement recalculé`);
      } else {
        console.log(`   ❌ RAP incorrect`);
      }
    } else {
      const errorText = await putResponse.text();
      console.log(`   ❌ Erreur lors de la modification: ${putResponse.status}`);
      console.log(`   📊 Détails: ${errorText}`);
    }
    
    // 3. Tester la suppression de prime (mettre à 0)
    console.log('\n📊 3. Test de suppression de prime (mise à 0):');
    const zeroPrimeResponse = await fetch('http://localhost:3000/api/cout-par-salaire', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: employeeWithPrime.id,
        prime: 0
      }),
    });
    
    if (zeroPrimeResponse.ok) {
      const zeroPrimeData = await zeroPrimeResponse.json();
      console.log(`   ✅ Prime supprimée (mise à 0)`);
      console.log(`   📊 Prime: ${zeroPrimeData.cout.prime}€`);
      console.log(`   📊 RAP: ${zeroPrimeData.cout.rap}€`);
    } else {
      console.log(`   ❌ Erreur lors de la suppression de prime`);
    }
    
    // 4. Restaurer la prime originale
    console.log('\n📊 4. Restauration de la prime originale:');
    const restoreResponse = await fetch('http://localhost:3000/api/cout-par-salaire', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: employeeWithPrime.id,
        prime: employeeWithPrime.prime
      }),
    });
    
    if (restoreResponse.ok) {
      console.log(`   ✅ Prime restaurée: ${employeeWithPrime.prime}€`);
    } else {
      console.log(`   ❌ Erreur lors de la restauration`);
    }
    
    console.log('\n🎯 Test de modification terminé !');
    console.log('✅ Fonctionnalités testées:');
    console.log('   - Modification de prime existante');
    console.log('   - Suppression de prime (mise à 0)');
    console.log('   - Recalcul automatique du RAP');
    console.log('   - Restauration de la prime originale');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  }
}

testPrimeEdit().catch(console.error);
