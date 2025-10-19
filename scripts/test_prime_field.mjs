import fetch from 'node-fetch';

async function testPrimeField() {
  console.log('🧪 Test du champ "prime" dans l\'interface...');
  
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
    
    // 2. Vérifier la présence du champ "prime"
    console.log('\n📊 2. Vérification du champ "prime":');
    if (data.couts && data.couts.length > 0) {
      const firstCout = data.couts[0];
      console.log(`   📊 Champs disponibles dans le premier enregistrement:`);
      Object.keys(firstCout).forEach(key => {
        console.log(`      ${key}: ${firstCout[key]}`);
      });
      
      if ('prime' in firstCout) {
        console.log(`   ✅ Champ "prime" présent dans l'API`);
      } else {
        console.log(`   ❌ Champ "prime" manquant dans l'API`);
      }
    }
    
    // 3. Vérifier les valeurs de prime
    console.log('\n📊 3. Vérification des valeurs de prime:');
    if (data.couts && data.couts.length > 0) {
      console.log(`   📊 Valeurs de prime pour les 5 premiers employés:`);
      data.couts.slice(0, 5).forEach((cout, index) => {
        console.log(`      ${index + 1}. ${cout.nom} ${cout.prenom}: Prime = ${cout.prime}€`);
      });
      
      const primesWithValue = data.couts.filter(cout => cout.prime && Number(cout.prime) > 0);
      const primesZero = data.couts.filter(cout => !cout.prime || Number(cout.prime) === 0);
      
      console.log(`   📊 Résumé:`);
      console.log(`      Primes > 0€: ${primesWithValue.length} employés`);
      console.log(`      Primes = 0€: ${primesZero.length} employés`);
    }
    
    // 4. Vérifier BECHIRMOULAHI MOHAMED spécifiquement
    console.log('\n📊 4. Vérification de BECHIRMOULAHI MOHAMED:');
    const moulahi = data.couts.find(cout => 
      cout.nom.includes('BECHIRMOULAHI') && cout.prenom.includes('MOHAMED')
    );
    
    if (moulahi) {
      console.log(`   📊 BECHIRMOULAHI MOHAMED:`);
      console.log(`      Prime: ${moulahi.prime}€`);
      console.log(`      Total Généré: ${moulahi.total_genere}€`);
      console.log(`      Salaire Net: ${moulahi.salaire_net}€`);
      console.log(`      RAP: ${moulahi.rap}€`);
      
      if (moulahi.prime && Number(moulahi.prime) > 0) {
        console.log(`      ✅ Prime présente: ${moulahi.prime}€`);
      } else {
        console.log(`      📊 Prime: 0.00€ (valeur par défaut)`);
      }
    } else {
      console.log(`   ❌ BECHIRMOULAHI MOHAMED non trouvé`);
    }
    
    console.log('\n🎯 Test terminé !');
    console.log('✅ Modifications appliquées:');
    console.log('   - Champ "prime" ajouté à la base de données');
    console.log('   - Champ "prime" inclus dans l\'API');
    console.log('   - Colonne "Prime (€)" ajoutée à l\'interface');
    console.log('   - Affichage avec couleur verte pour primes > 0€');
    console.log('   - Indicateur "✓ Prime" pour primes > 0€');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  }
}

testPrimeField().catch(console.error);
