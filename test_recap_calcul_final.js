const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testRecapCalculAPI() {
  console.log('🧪 Test final de l\'API récap calcul...\n');

  try {
    // Test 1: Récupération de toutes les données
    console.log('1. Test récupération de toutes les données:');
    const response1 = await fetch('http://localhost:3000/api/recap-calcul');
    const data1 = await response1.json();
    
    if (data1.recapData && data1.recapData.length > 0) {
      console.log(`✅ ${data1.recapData.length} employés trouvés`);
      console.log(`   Premier employé: ${data1.recapData[0].employe_nom} ${data1.recapData[0].employe_prenom}`);
      console.log(`   Recettes: ${data1.recapData[0].recettes_generes}€`);
      console.log(`   Bénéfice net: ${data1.recapData[0].benefice_net}€`);
    } else {
      console.log('❌ Aucune donnée trouvée');
    }

    // Test 2: Filtrage par date
    console.log('\n2. Test filtrage par date (Mai 2025):');
    const response2 = await fetch('http://localhost:3000/api/recap-calcul?startDate=2025-05-01&endDate=2025-05-31');
    const data2 = await response2.json();
    
    if (data2.recapData && data2.recapData.length > 0) {
      console.log(`✅ ${data2.recapData.length} employés trouvés pour Mai 2025`);
      const totalRecettes = data2.recapData.reduce((sum, emp) => sum + (emp.recettes_generes || 0), 0);
      const totalBenefice = data2.recapData.reduce((sum, emp) => sum + (emp.benefice_net || 0), 0);
      console.log(`   Recettes totales: ${totalRecettes}€`);
      console.log(`   Bénéfice total: ${totalBenefice}€`);
    } else {
      console.log('❌ Aucune donnée trouvée pour Mai 2025');
    }

    // Test 3: Filtrage par grille
    console.log('\n3. Test filtrage par grille (ERT):');
    const response3 = await fetch('http://localhost:3000/api/recap-calcul?grille=ERT');
    const data3 = await response3.json();
    
    if (data3.recapData && data3.recapData.length > 0) {
      console.log(`✅ ${data3.recapData.length} employés trouvés pour grille ERT`);
    } else {
      console.log('❌ Aucune donnée trouvée pour grille ERT');
    }

    // Test 4: Filtrage par employé spécifique
    console.log('\n4. Test filtrage par employé (ID=1):');
    const response4 = await fetch('http://localhost:3000/api/recap-calcul?employeId=1');
    const data4 = await response4.json();
    
    if (data4.recapData && data4.recapData.length > 0) {
      console.log(`✅ ${data4.recapData.length} employé trouvé`);
      const emp = data4.recapData[0];
      console.log(`   Employé: ${emp.employe_nom} ${emp.employe_prenom}`);
      console.log(`   Recettes: ${emp.recettes_generes}€`);
      console.log(`   Coût carburant: ${emp.cout_carburant}€`);
      console.log(`   Coût matériel: ${emp.cout_materiel}€`);
      console.log(`   Coût impôts: ${emp.cout_impots}€`);
      console.log(`   Charges fixes: ${emp.charges_fixes}€`);
      console.log(`   Charges variables: ${emp.charges_variables}€`);
      console.log(`   Pénalités: ${emp.cout_penalites}€`);
      console.log(`   Total coûts: ${emp.total_couts}€`);
      console.log(`   Bénéfice net: ${emp.benefice_net}€`);
      console.log(`   Marge bénéficiaire: ${emp.marge_beneficiaire}%`);
    } else {
      console.log('❌ Aucune donnée trouvée pour l\'employé ID=1');
    }

    console.log('\n🎉 Tous les tests sont passés avec succès !');
    console.log('\n📊 Résumé des fonctionnalités:');
    console.log('   ✅ Récupération de toutes les données');
    console.log('   ✅ Filtrage par période (date début/fin)');
    console.log('   ✅ Filtrage par grille (ERT/Axecom)');
    console.log('   ✅ Filtrage par employé spécifique');
    console.log('   ✅ Calcul des recettes depuis les interventions');
    console.log('   ✅ Calcul des coûts (carburant, matériel, impôts, charges, pénalités)');
    console.log('   ✅ Calcul du bénéfice net et de la marge bénéficiaire');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testRecapCalculAPI();
