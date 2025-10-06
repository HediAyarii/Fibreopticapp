const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function checkSpecificEmployees() {
  console.log('🔍 Vérification des employés spécifiques...\n');

  try {
    const response = await fetch('http://localhost:3000/api/recap-calcul');
    const data = await response.json();
    
    console.log('Employés disponibles:');
    data.recapData.forEach(emp => {
      if(emp.employe_nom === 'HAMDI' || emp.employe_nom === 'RIAHI') {
        console.log(`  - ${emp.employe_nom} ${emp.employe_prenom} (ID: ${emp.employe_id})`);
      }
    });
    
    // Chercher HAMDI BEN CHEDLI
    const hamdi = data.recapData.find(emp => emp.employe_nom === 'HAMDI' && emp.employe_prenom === 'BEN CHEDLI');
    if(hamdi) {
      console.log('\nHAMDI BEN CHEDLI trouvé:');
      console.log('  - ID:', hamdi.employe_id);
      console.log('  - Recettes:', hamdi.recettes_generes + '€');
      console.log('  - Carburant:', hamdi.cout_carburant + '€');
    }
    
    // Chercher RIAHI Mehrez
    const riahi = data.recapData.find(emp => emp.employe_nom === 'RIAHI' && emp.employe_prenom === 'Mehrez');
    if(riahi) {
      console.log('\nRIAHI Mehrez trouvé:');
      console.log('  - ID:', riahi.employe_id);
      console.log('  - Recettes:', riahi.recettes_generes + '€');
      console.log('  - Carburant:', riahi.cout_carburant + '€');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkSpecificEmployees();
