import fetch from 'node-fetch';

async function debugPrimeError() {
  console.log('🔍 Diagnostic de l\'erreur d\'ajout de prime...');
  
  try {
    // 1. Tester l'API GET d'abord
    console.log('\n📊 1. Test de l\'API GET:');
    const getResponse = await fetch('http://localhost:3000/api/cout-par-salaire?mois=5&annee=2025');
    
    if (!getResponse.ok) {
      console.log(`   ❌ Erreur GET: ${getResponse.status}`);
      const errorText = await getResponse.text();
      console.log(`   📊 Détails: ${errorText}`);
      return;
    }
    
    const getData = await getResponse.json();
    console.log(`   ✅ GET fonctionne: ${getData.success}`);
    
    // 2. Tester l'API PUT avec des données simples
    console.log('\n📊 2. Test de l\'API PUT:');
    const testCout = getData.couts[0];
    console.log(`   📊 Test avec: ${testCout.nom} ${testCout.prenom} (ID: ${testCout.id})`);
    console.log(`   📊 Prime actuelle: ${testCout.prime}€`);
    
    const newPrime = parseFloat(testCout.prime || '0') + 25; // Ajouter 25€
    console.log(`   📊 Nouvelle prime: ${newPrime}€`);
    
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
    
    console.log(`   📊 Status PUT: ${putResponse.status}`);
    
    if (putResponse.ok) {
      const putData = await putResponse.json();
      console.log(`   ✅ PUT réussi: ${putData.success}`);
      console.log(`   📊 Prime mise à jour: ${putData.cout.prime}€`);
      console.log(`   📊 RAP mis à jour: ${putData.cout.rap}€`);
    } else {
      const errorText = await putResponse.text();
      console.log(`   ❌ Erreur PUT: ${putResponse.status}`);
      console.log(`   📊 Détails: ${errorText}`);
      
      // Essayer de parser l'erreur JSON
      try {
        const errorJson = JSON.parse(errorText);
        console.log(`   📊 Erreur JSON:`, errorJson);
      } catch (e) {
        console.log(`   📊 Erreur non-JSON: ${errorText}`);
      }
    }
    
    // 3. Tester avec des données invalides
    console.log('\n📊 3. Test avec données invalides:');
    const invalidResponse = await fetch('http://localhost:3000/api/cout-par-salaire', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 999999, // ID inexistant
        prime: 100
      }),
    });
    
    console.log(`   📊 Status PUT invalide: ${invalidResponse.status}`);
    if (!invalidResponse.ok) {
      const invalidError = await invalidResponse.text();
      console.log(`   📊 Erreur attendue: ${invalidError}`);
    }
    
    // 4. Vérifier la structure de l'API
    console.log('\n📊 4. Vérification de la structure:');
    console.log(`   📊 URL: http://localhost:3000/api/cout-par-salaire`);
    console.log(`   📊 Méthode: PUT`);
    console.log(`   📊 Headers: Content-Type: application/json`);
    console.log(`   📊 Body: { id: number, prime: number }`);
    
    console.log('\n🎯 Diagnostic terminé !');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.error('🔍 Détails:', error);
  }
}

debugPrimeError().catch(console.error);
