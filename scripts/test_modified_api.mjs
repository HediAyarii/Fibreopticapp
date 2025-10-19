import fetch from 'node-fetch';

async function testModifiedApi() {
  console.log('🧪 Test de l\'API modifiée...');
  
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
    
    // 2. Vérifier les RAP calculés
    console.log('\n📊 2. Vérification des RAP calculés:');
    if (data.couts && data.couts.length > 0) {
      data.couts.forEach((cout, index) => {
        if (index < 5) { // Afficher seulement les 5 premiers
          console.log(`   📊 ${cout.nom} ${cout.prenom}:`);
          console.log(`      Total Généré: ${cout.total_genere}€`);
          console.log(`      Salaire Net: ${cout.salaire_net}€`);
          console.log(`      Charge: ${cout.charge}€`);
          console.log(`      Taxe (Impôt): ${cout.taxe}€`);
          console.log(`      RAP: ${cout.rap}€`);
          console.log(`      Paiements: ${cout.total_paiements}€`);
          
          // Vérifier la cohérence
          const rapCalcule = parseFloat(cout.total_genere) - parseFloat(cout.salaire_net) - parseFloat(cout.taxe) - parseFloat(cout.total_paiements);
          const difference = Math.abs(parseFloat(cout.rap) - rapCalcule);
          
          if (difference < 0.01) {
            console.log(`      ✅ RAP cohérent`);
          } else {
            console.log(`      ❌ RAP incohérent (diff: ${difference}€)`);
          }
        }
      });
    }
    
    // 3. Vérifier BECHIRMOULAHI MOHAMED spécifiquement
    console.log('\n📊 3. Vérification de BECHIRMOULAHI MOHAMED:');
    const moulahi = data.couts.find(cout => 
      cout.nom.includes('BECHIRMOULAHI') && cout.prenom.includes('MOHAMED')
    );
    
    if (moulahi) {
      console.log(`   📊 BECHIRMOULAHI MOHAMED trouvé:`);
      console.log(`      Total Généré: ${moulahi.total_genere}€`);
      console.log(`      Salaire Net: ${moulahi.salaire_net}€`);
      console.log(`      Charge: ${moulahi.charge}€`);
      console.log(`      Taxe (Impôt): ${moulahi.taxe}€`);
      console.log(`      RAP: ${moulahi.rap}€`);
      console.log(`      Paiements: ${moulahi.total_paiements}€`);
      
      // Vérifier si le RAP correspond au RAP attendu (825.36€)
      const rapAttendu = 825.36;
      const differenceAttendu = Math.abs(parseFloat(moulahi.rap) - rapAttendu);
      console.log(`      RAP Attendu: ${rapAttendu}€`);
      console.log(`      Différence: ${differenceAttendu}€`);
      
      if (differenceAttendu < 0.01) {
        console.log(`      ✅ RAP correspond au RAP attendu !`);
      } else {
        console.log(`      ❌ RAP ne correspond pas au RAP attendu`);
      }
    } else {
      console.log(`   ❌ BECHIRMOULAHI MOHAMED non trouvé`);
    }
    
    console.log('\n🎯 Test terminé !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  }
}

testModifiedApi().catch(console.error);
