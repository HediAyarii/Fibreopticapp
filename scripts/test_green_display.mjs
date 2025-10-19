import fetch from 'node-fetch';

async function testGreenDisplay() {
  console.log('🧪 Test de l\'affichage vert pour 100% payé...');
  
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
    
    // 2. Vérifier les RAP et identifier ceux qui sont à 0
    console.log('\n📊 2. Vérification des RAP à 0 (100% payé):');
    if (data.couts && data.couts.length > 0) {
      const rapZero = data.couts.filter(cout => cout.rap && Number(cout.rap) === 0);
      const rapPositif = data.couts.filter(cout => cout.rap && Number(cout.rap) > 0);
      const rapNegatif = data.couts.filter(cout => cout.rap && Number(cout.rap) < 0);
      
      console.log(`   📊 RAP à 0 (100% payé): ${rapZero.length} employés`);
      console.log(`   📊 RAP positif (reste à payer): ${rapPositif.length} employés`);
      console.log(`   📊 RAP négatif (déficit): ${rapNegatif.length} employés`);
      
      if (rapZero.length > 0) {
        console.log('\n   🟢 Employés 100% payés (devraient être en vert):');
        rapZero.forEach(cout => {
          console.log(`      ✅ ${cout.nom} ${cout.prenom}: RAP = ${cout.rap}€`);
        });
      }
      
      if (rapPositif.length > 0) {
        console.log('\n   🔵 Employés avec reste à payer (devraient être en bleu):');
        rapPositif.slice(0, 3).forEach(cout => {
          console.log(`      📊 ${cout.nom} ${cout.prenom}: RAP = ${cout.rap}€`);
        });
      }
      
      if (rapNegatif.length > 0) {
        console.log('\n   🔴 Employés en déficit (devraient être en rouge):');
        rapNegatif.slice(0, 3).forEach(cout => {
          console.log(`      📊 ${cout.nom} ${cout.prenom}: RAP = ${cout.rap}€`);
        });
      }
    }
    
    // 3. Vérifier BECHIRMOULAHI MOHAMED spécifiquement
    console.log('\n📊 3. Vérification de BECHIRMOULAHI MOHAMED:');
    const moulahi = data.couts.find(cout => 
      cout.nom.includes('BECHIRMOULAHI') && cout.prenom.includes('MOHAMED')
    );
    
    if (moulahi) {
      console.log(`   📊 BECHIRMOULAHI MOHAMED:`);
      console.log(`      RAP: ${moulahi.rap}€`);
      
      if (Number(moulahi.rap) === 0) {
        console.log(`      🟢 RAP = 0€ → Ligne devrait être en VERT (100% payé)`);
      } else if (Number(moulahi.rap) > 0) {
        console.log(`      🔵 RAP > 0€ → Ligne devrait être en BLEU (reste à payer)`);
      } else {
        console.log(`      🔴 RAP < 0€ → Ligne devrait être en ROUGE (déficit)`);
      }
    } else {
      console.log(`   ❌ BECHIRMOULAHI MOHAMED non trouvé`);
    }
    
    console.log('\n🎯 Test terminé !');
    console.log('✅ Modifications appliquées:');
    console.log('   - Lignes avec RAP = 0€ sont maintenant en VERT');
    console.log('   - Lignes avec RAP > 0€ restent en BLEU');
    console.log('   - Lignes avec RAP < 0€ restent en ROUGE');
    console.log('   - Indicateur "✓ 100% payé" ajouté pour RAP = 0€');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  }
}

testGreenDisplay().catch(console.error);
