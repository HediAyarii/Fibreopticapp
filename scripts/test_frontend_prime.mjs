import fetch from 'node-fetch';

async function testFrontendPrime() {
  console.log('🧪 Test du frontend pour l\'ajout de prime...');
  
  try {
    // 1. Simuler la requête que fait le frontend
    console.log('\n📊 1. Simulation de la requête frontend:');
    
    // Récupérer un employé pour le test
    const getResponse = await fetch('http://localhost:3000/api/cout-par-salaire?mois=5&annee=2025');
    const getData = await getResponse.json();
    const testCout = getData.couts[0];
    
    console.log(`   📊 Employé test: ${testCout.nom} ${testCout.prenom}`);
    console.log(`   📊 ID: ${testCout.id}`);
    console.log(`   📊 Prime actuelle: ${testCout.prime}€`);
    
    // 2. Simuler exactement ce que fait handleSubmitPrime
    console.log('\n📊 2. Simulation de handleSubmitPrime:');
    
    const currentPrime = parseFloat(testCout.prime || '0');
    const amountToAdd = 50; // Montant à ajouter
    const newPrime = currentPrime + amountToAdd;
    
    console.log(`   📊 Prime actuelle: ${currentPrime}€`);
    console.log(`   📊 Montant à ajouter: ${amountToAdd}€`);
    console.log(`   📊 Nouvelle prime: ${newPrime}€`);
    
    // 3. Faire la requête PUT exactement comme le frontend
    console.log('\n📊 3. Requête PUT frontend:');
    const putResponse = await fetch('http://localhost:3000/api/cout-par-salaire', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: testCout.id,
        prime: newPrime
      }),
    });
    
    console.log(`   📊 Status: ${putResponse.status}`);
    console.log(`   📊 Headers:`, Object.fromEntries(putResponse.headers.entries()));
    
    if (putResponse.ok) {
      const putData = await putResponse.json();
      console.log(`   ✅ Succès: ${putData.success}`);
      console.log(`   📊 Prime mise à jour: ${putData.cout.prime}€`);
      console.log(`   📊 RAP mis à jour: ${putData.cout.rap}€`);
    } else {
      const errorText = await putResponse.text();
      console.log(`   ❌ Erreur: ${putResponse.status}`);
      console.log(`   📊 Détails: ${errorText}`);
    }
    
    // 4. Vérifier les logs du serveur
    console.log('\n📊 4. Vérification des logs serveur:');
    console.log(`   📊 Vérifiez les logs du serveur Next.js pour voir les erreurs`);
    console.log(`   📊 Recherchez "Erreur PUT cout-par-salaire" dans les logs`);
    
    // 5. Tester avec différents types de données
    console.log('\n📊 5. Test avec différents types de données:');
    
    const testCases = [
      { prime: 100 },
      { prime: 100.50 },
      { prime: "100" },
      { prime: 0 },
      { prime: -50 } // Valeur négative
    ];
    
    for (const testCase of testCases) {
      console.log(`   📊 Test avec prime: ${testCase.prime} (type: ${typeof testCase.prime})`);
      
      const testResponse = await fetch('http://localhost:3000/api/cout-par-salaire', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: testCout.id,
          prime: testCase.prime
        }),
      });
      
      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log(`      ✅ Succès: ${testData.cout.prime}€`);
      } else {
        const testError = await testResponse.text();
        console.log(`      ❌ Erreur: ${testError}`);
      }
    }
    
    console.log('\n🎯 Test frontend terminé !');
    console.log('✅ Si l\'API fonctionne, le problème est dans le frontend React');
    console.log('📊 Vérifiez:');
    console.log('   - Les logs de la console du navigateur');
    console.log('   - Les erreurs JavaScript dans le composant');
    console.log('   - La fonction handleSubmitPrime dans CoutParSalaireManager.tsx');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  }
}

testFrontendPrime().catch(console.error);
