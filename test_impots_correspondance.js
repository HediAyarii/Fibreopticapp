const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testImpotCorrespondance() {
  console.log('🔍 Test de correspondance des impôts...\n');

  try {
    // Récupérer les données des employés
    const response1 = await fetch('http://localhost:3000/api/recap-calcul');
    const data1 = await response1.json();
    
    // Récupérer les données cout_par_salaire
    const response2 = await fetch('http://localhost:3000/api/cout-par-salaire');
    const data2 = await response2.json();
    
    console.log('1. Employés dans récap-calcul:');
    data1.recapData.forEach(emp => {
      if(emp.employe_nom.includes('HAMDI') || emp.employe_prenom.includes('HAMDI')) {
        console.log(`   - ${emp.employe_nom} ${emp.employe_prenom} (ID: ${emp.employe_id})`);
      }
    });
    
    console.log('\n2. Employés dans cout_par_salaire:');
    data2.couts.forEach(cout => {
      if(cout.nom.includes('HAMDI') || cout.prenom.includes('HAMDI') || 
         cout.nom.includes('CHEDLI') || cout.prenom.includes('CHEDLI')) {
        console.log(`   - ${cout.nom} ${cout.prenom} (Impôt: ${cout.impot}€)`);
      }
    });
    
    console.log('\n3. Test de correspondance:');
    const hamdiEmploye = data1.recapData.find(emp => emp.employe_nom.includes('HAMDI'));
    const hamdiCout = data2.couts.find(cout => cout.nom.includes('HAMDI') || cout.prenom.includes('HAMDI'));
    
    if (hamdiEmploye && hamdiCout) {
      console.log(`   Employé: ${hamdiEmploye.employe_nom} ${hamdiEmploye.employe_prenom}`);
      console.log(`   Cout: ${hamdiCout.nom} ${hamdiCout.prenom}`);
      console.log(`   Correspondance nom: ${hamdiEmploye.employe_nom.toLowerCase()} === ${hamdiCout.nom.toLowerCase()} ? ${hamdiEmploye.employe_nom.toLowerCase() === hamdiCout.nom.toLowerCase()}`);
      console.log(`   Correspondance prénom: ${hamdiEmploye.employe_prenom.toLowerCase()} === ${hamdiCout.prenom.toLowerCase()} ? ${hamdiEmploye.employe_prenom.toLowerCase() === hamdiCout.prenom.toLowerCase()}`);
      console.log(`   Correspondance inversée nom: ${hamdiEmploye.employe_nom.toLowerCase()} === ${hamdiCout.prenom.toLowerCase()} ? ${hamdiEmploye.employe_nom.toLowerCase() === hamdiCout.prenom.toLowerCase()}`);
      console.log(`   Correspondance inversée prénom: ${hamdiEmploye.employe_prenom.toLowerCase()} === ${hamdiCout.nom.toLowerCase()} ? ${hamdiEmploye.employe_prenom.toLowerCase() === hamdiCout.nom.toLowerCase()}`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testImpotCorrespondance();
