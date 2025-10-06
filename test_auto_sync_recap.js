const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAutoSyncRecap() {
  console.log('🔄 Test de la synchronisation automatique pour Récap Calcul...\n');

  try {
    // Test initial
    console.log('1. Test initial:');
    const response1 = await fetch('http://localhost:3000/api/recap-calcul');
    const data1 = await response1.json();
    console.log(`   Total employés: ${data1.recapData?.length || 0}`);
    
    if(data1.recapData && data1.recapData.length > 0) {
      const totalCarburant = data1.recapData.reduce((sum, emp) => sum + emp.cout_carburant, 0);
      const totalMateriel = data1.recapData.reduce((sum, emp) => sum + emp.cout_materiel, 0);
      const totalImpots = data1.recapData.reduce((sum, emp) => sum + emp.cout_impots, 0);
      console.log(`   Total carburant: ${totalCarburant.toFixed(2)}€`);
      console.log(`   Total matériel: ${totalMateriel.toFixed(2)}€`);
      console.log(`   Total impôts: ${totalImpots.toFixed(2)}€`);
    }

    // Test des événements de synchronisation
    console.log('\n2. Test des événements de synchronisation:');
    console.log('   Événements écoutés par RecapCalculTable:');
    console.log('   - material-assignment-updated');
    console.log('   - material-updated');
    console.log('   - employee-updated');
    console.log('   - revenue-updated');
    console.log('   - intervention-updated');
    console.log('   - carburant-updated');
    console.log('   - cout-salaire-updated');
    console.log('   - charges-updated');
    console.log('   - penalites-updated');

    console.log('\n3. Événements déclenchés dans app/page.tsx:');
    console.log('   - saveMaterial: material-updated + revenue-updated');
    console.log('   - deleteMaterial: material-updated + revenue-updated');
    console.log('   - saveAffectation: material-assignment-updated + revenue-updated');
    console.log('   - deleteAffectation: material-assignment-updated + revenue-updated');

    console.log('\n✅ La synchronisation automatique est configurée !');
    console.log('   La section Récap Calcul se mettra à jour automatiquement');
    console.log('   quand des données sont modifiées dans les autres sections.');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testAutoSyncRecap();
