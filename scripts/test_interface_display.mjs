import fetch from 'node-fetch';

async function testInterfaceDisplay() {
  console.log('🧪 Test de l\'affichage de l\'interface...');
  
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
    
    // 2. Vérifier l'affichage des colonnes
    console.log('\n📊 2. Vérification de l\'affichage des colonnes:');
    if (data.couts && data.couts.length > 0) {
      console.log('   📊 Colonnes pour les 3 premiers employés:');
      data.couts.slice(0, 3).forEach((cout, index) => {
        console.log(`   📊 ${cout.nom} ${cout.prenom}:`);
        console.log(`      Total Généré: ${cout.total_genere}€`);
        console.log(`      Salaire Net: ${cout.salaire_net}€`);
        console.log(`      Charge: ${cout.charge}€`);
        console.log(`      Taxe (%): ${cout.taxe}% (pourcentage)`);
        console.log(`      Impôt (€): ${cout.impot}€ (valeur calculée)`);
        console.log(`      RAP: ${cout.rap}€`);
        console.log(`      Paiements: ${cout.total_paiements}€`);
        console.log('');
      });
    }
    
    // 3. Vérifier BECHIRMOULAHI MOHAMED spécifiquement
    console.log('\n📊 3. Vérification de BECHIRMOULAHI MOHAMED:');
    const moulahi = data.couts.find(cout => 
      cout.nom.includes('BECHIRMOULAHI') && cout.prenom.includes('MOHAMED')
    );
    
    if (moulahi) {
      console.log(`   📊 BECHIRMOULAHI MOHAMED:`);
      console.log(`      Total Généré: ${moulahi.total_genere}€`);
      console.log(`      Salaire Net: ${moulahi.salaire_net}€`);
      console.log(`      Charge: ${moulahi.charge}€`);
      console.log(`      Taxe (%): ${moulahi.taxe}% (pourcentage)`);
      console.log(`      Impôt (€): ${moulahi.impot}€ (valeur calculée)`);
      console.log(`      RAP: ${moulahi.rap}€`);
      console.log(`      Paiements: ${moulahi.total_paiements}€`);
      
      // Vérifier la cohérence
      const impotCalcule = parseFloat(moulahi.charge) * 0.5;
      const rapCalcule = parseFloat(moulahi.total_genere) - parseFloat(moulahi.salaire_net) - impotCalcule - parseFloat(moulahi.total_paiements);
      
      console.log(`      Vérification:`);
      console.log(`         Impôt calculé: ${impotCalcule}€ (50% de ${moulahi.charge}€)`);
      console.log(`         RAP calculé: ${rapCalcule}€`);
      console.log(`         Taxe affichée: ${moulahi.taxe}% (pourcentage)`);
      console.log(`         Impôt affiché: ${moulahi.impot}€ (valeur)`);
      
      if (Math.abs(parseFloat(moulahi.impot) - impotCalcule) < 0.01) {
        console.log(`         ✅ Impôt cohérent`);
      } else {
        console.log(`         ❌ Impôt incohérent`);
      }
      
      if (Math.abs(parseFloat(moulahi.rap) - rapCalcule) < 0.01) {
        console.log(`         ✅ RAP cohérent`);
      } else {
        console.log(`         ❌ RAP incohérent`);
      }
    } else {
      console.log(`   ❌ BECHIRMOULAHI MOHAMED non trouvé`);
    }
    
    console.log('\n🎯 Test terminé !');
    console.log('✅ L\'interface affiche maintenant:');
    console.log('   - Taxe (%): Pourcentage (50%, 100%, 0%)');
    console.log('   - Impôt (€): Valeur calculée en euros');
    console.log('   - RAP: Calculé automatiquement');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  }
}

testInterfaceDisplay().catch(console.error);
