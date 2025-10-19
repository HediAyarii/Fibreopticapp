import fetch from 'node-fetch';

async function testToleranceLogic() {
  console.log('🧪 Test de la logique de tolérance pour 100% payé...');
  
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
    
    // 2. Vérifier la logique de tolérance
    console.log('\n📊 2. Vérification de la logique de tolérance:');
    if (data.couts && data.couts.length > 0) {
      data.couts.forEach(cout => {
        const rap = Number(cout.rap);
        const absRap = Math.abs(rap);
        
        console.log(`   📊 ${cout.nom} ${cout.prenom}:`);
        console.log(`      RAP: ${rap}€`);
        console.log(`      |RAP|: ${absRap}€`);
        
        if (absRap <= 0.01) {
          console.log(`      🟢 Considéré comme 100% payé (|RAP| <= 0.01€)`);
        } else if (rap > 0.01) {
          console.log(`      🔵 Reste à payer (RAP > 0.01€)`);
        } else if (rap < -0.01) {
          console.log(`      🔴 Déficit (RAP < -0.01€)`);
        }
        console.log('');
      });
    }
    
    // 3. Vérifier BECHIRMOULAHI MOHAMED spécifiquement
    console.log('\n📊 3. Vérification de BECHIRMOULAHI MOHAMED:');
    const moulahi = data.couts.find(cout => 
      cout.nom.includes('BECHIRMOULAHI') && cout.prenom.includes('MOHAMED')
    );
    
    if (moulahi) {
      const rap = Number(moulahi.rap);
      const absRap = Math.abs(rap);
      
      console.log(`   📊 BECHIRMOULAHI MOHAMED:`);
      console.log(`      RAP: ${rap}€`);
      console.log(`      |RAP|: ${absRap}€`);
      
      if (absRap <= 0.01) {
        console.log(`      🟢 Ligne devrait être en VERT (100% payé)`);
        console.log(`      ✅ Indicateur "✓ 100% payé" devrait s'afficher`);
      } else if (rap > 0.01) {
        console.log(`      🔵 Ligne devrait être en BLEU (reste à payer)`);
      } else {
        console.log(`      🔴 Ligne devrait être en ROUGE (déficit)`);
      }
    }
    
    console.log('\n🎯 Test terminé !');
    console.log('✅ Logique de tolérance appliquée:');
    console.log('   - |RAP| <= 0.01€ → VERT (100% payé)');
    console.log('   - RAP > 0.01€ → BLEU (reste à payer)');
    console.log('   - RAP < -0.01€ → ROUGE (déficit)');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  }
}

testToleranceLogic().catch(console.error);
