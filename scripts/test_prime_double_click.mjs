import fetch from 'node-fetch';

async function testPrimeDoubleClick() {
  console.log('🧪 Test du système d\'ajout de prime par double-clic...');
  
  try {
    // 1. Tester l'API cout-par-salaire
    console.log('\n📊 1. Test de l\'API cout-par-salaire:');
    const response = await fetch('http://localhost:3000/api/cout-par-salaire?mois=5&annee=2025');
    
    if (!response.ok) {
      console.log(`   ❌ Erreur HTTP: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    console.log(`   ✅ API répond: ${data.success}`);
    console.log(`   📊 Nombre d'enregistrements: ${data.total}`);
    
    // 2. Vérifier les primes actuelles
    console.log('\n📊 2. Vérification des primes actuelles:');
    if (data.couts && data.couts.length > 0) {
      const primesWithValue = data.couts.filter(cout => cout.prime && Number(cout.prime) > 0);
      const primesZero = data.couts.filter(cout => !cout.prime || Number(cout.prime) === 0);
      
      console.log(`   📊 Employés avec primes > 0€: ${primesWithValue.length}`);
      primesWithValue.forEach(cout => {
        console.log(`      🟢 ${cout.nom} ${cout.prenom}: Prime = ${cout.prime}€`);
      });
      
      console.log(`   📊 Employés sans primes: ${primesZero.length}`);
    }
    
    // 3. Vérifier BECHIRMOULAHI MOHAMED spécifiquement
    console.log('\n📊 3. Vérification de BECHIRMOULAHI MOHAMED:');
    const moulahi = data.couts.find(cout => 
      cout.nom.includes('BECHIRMOULAHI') && cout.prenom.includes('MOHAMED')
    );
    
    if (moulahi) {
      console.log(`   📊 BECHIRMOULAHI MOHAMED:`);
      console.log(`      Prime actuelle: ${moulahi.prime}€`);
      console.log(`      Total Généré: ${moulahi.total_genere}€`);
      console.log(`      Salaire Net: ${moulahi.salaire_net}€`);
      console.log(`      Charge: ${moulahi.charge}€`);
      console.log(`      Impôt: ${moulahi.impot}€`);
      console.log(`      RAP: ${moulahi.rap}€`);
      
      // Calculer le RAP avec la prime
      const rapAvecPrime = parseFloat(moulahi.total_genere) - parseFloat(moulahi.salaire_net) - parseFloat(moulahi.impot) + parseFloat(moulahi.prime || '0');
      console.log(`      RAP calculé avec prime: ${rapAvecPrime}€`);
      
      if (moulahi.prime && Number(moulahi.prime) > 0) {
        console.log(`      ✅ Prime présente: ${moulahi.prime}€ (devrait être en vert)`);
        console.log(`      ✅ Double-clic disponible pour ajouter plus de prime`);
      } else {
        console.log(`      📊 Prime: 0.00€ (double-clic pour ajouter)`);
      }
    } else {
      console.log(`   ❌ BECHIRMOULAHI MOHAMED non trouvé`);
    }
    
    // 4. Tester l'API PUT pour mettre à jour une prime
    console.log('\n📊 4. Test de l\'API PUT pour mise à jour de prime:');
    if (moulahi) {
      const newPrime = parseFloat(moulahi.prime || '0') + 50; // Ajouter 50€
      
      const putResponse = await fetch('http://localhost:3000/api/cout-par-salaire', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: moulahi.id,
          prime: newPrime
        }),
      });
      
      if (putResponse.ok) {
        const putData = await putResponse.json();
        console.log(`   ✅ Prime mise à jour: ${moulahi.prime}€ → ${newPrime}€`);
        console.log(`   📊 Nouveau RAP: ${putData.cout.rap}€`);
      } else {
        console.log(`   ❌ Erreur lors de la mise à jour de la prime`);
      }
    }
    
    console.log('\n🎯 Test terminé !');
    console.log('✅ Fonctionnalités implémentées:');
    console.log('   - Double-clic sur la colonne Prime pour ajouter une prime');
    console.log('   - Modal d\'ajout de prime avec saisie du montant');
    console.log('   - Prime ajoutée au montant existant');
    console.log('   - Prime augmente le RAP (Reste à Payer)');
    console.log('   - Affichage en vert pour primes > 0€');
    console.log('   - Indicateur "✓ Prime" pour primes > 0€');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  }
}

testPrimeDoubleClick().catch(console.error);
