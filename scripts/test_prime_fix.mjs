import fetch from 'node-fetch';

async function testPrimeFix() {
  console.log('🧪 Test de la correction de l\'ajout de prime...');
  
  try {
    // 1. Tester l'API PUT directement
    console.log('\n📊 1. Test direct de l\'API PUT:');
    
    const getResponse = await fetch('http://localhost:3000/api/cout-par-salaire?mois=5&annee=2025');
    const getData = await getResponse.json();
    const testCout = getData.couts[0];
    
    console.log(`   📊 Employé test: ${testCout.nom} ${testCout.prenom}`);
    console.log(`   📊 Prime actuelle: ${testCout.prime}€`);
    
    // Simuler l'ajout de 25€
    const currentPrime = parseFloat(testCout.prime || '0');
    const amountToAdd = 25;
    const newPrime = currentPrime + amountToAdd;
    
    console.log(`   📊 Montant à ajouter: ${amountToAdd}€`);
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
    
    if (putResponse.ok) {
      const putData = await putResponse.json();
      console.log(`   ✅ Succès: ${putData.success}`);
      console.log(`   📊 Prime mise à jour: ${putData.cout.prime}€`);
      console.log(`   📊 RAP mis à jour: ${putData.cout.rap}€`);
      
      // Vérifier que le RAP a bien été recalculé
      const expectedRap = parseFloat(putData.cout.total_genere) - parseFloat(putData.cout.salaire_net) - parseFloat(putData.cout.impot) + parseFloat(putData.cout.prime);
      console.log(`   📊 RAP attendu: ${expectedRap}€`);
      console.log(`   📊 RAP réel: ${putData.cout.rap}€`);
      
      if (Math.abs(parseFloat(putData.cout.rap) - expectedRap) < 0.01) {
        console.log(`   ✅ RAP correctement calculé`);
      } else {
        console.log(`   ❌ RAP incorrect`);
      }
    } else {
      const errorText = await putResponse.text();
      console.log(`   ❌ Erreur: ${putResponse.status}`);
      console.log(`   📊 Détails: ${errorText}`);
    }
    
    // 2. Vérifier que les données sont bien mises à jour
    console.log('\n📊 2. Vérification des données mises à jour:');
    const verifyResponse = await fetch('http://localhost:3000/api/cout-par-salaire?mois=5&annee=2025');
    const verifyData = await verifyResponse.json();
    const updatedCout = verifyData.couts.find(c => c.id === testCout.id);
    
    if (updatedCout) {
      console.log(`   📊 Prime après mise à jour: ${updatedCout.prime}€`);
      console.log(`   📊 RAP après mise à jour: ${updatedCout.rap}€`);
      
      if (Math.abs(parseFloat(updatedCout.prime) - newPrime) < 0.01) {
        console.log(`   ✅ Prime correctement mise à jour`);
      } else {
        console.log(`   ❌ Prime non mise à jour`);
      }
    } else {
      console.log(`   ❌ Employé non trouvé après mise à jour`);
    }
    
    console.log('\n🎯 Test de correction terminé !');
    console.log('✅ La correction devrait résoudre l\'erreur "Erreur lors de l\'ajout de la prime"');
    console.log('📊 Problème identifié: loadCouts() → loadData()');
    console.log('📊 Solution appliquée: Remplacement de la fonction inexistante');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  }
}

testPrimeFix().catch(console.error);
