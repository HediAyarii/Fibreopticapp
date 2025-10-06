const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function checkEmployees() {
  console.log('🔍 Vérification des employés...\n');

  try {
    const response = await fetch('http://localhost:3000/api/employees');
    const data = await response.json();
    
    console.log('Employés disponibles:');
    data.employees.forEach(emp => {
      console.log(`  - ID: ${emp.id}, Nom: ${emp.nom}, Prénom: ${emp.prenom}, Carte: ${emp.numero_carte_carburant || 'Aucune'}`);
    });
    
    // Chercher HAMDI et RIAHI
    const hamdi = data.employees.find(emp => emp.nom === 'HAMDI' && emp.prenom === 'BEN CHEDLI');
    const riahi = data.employees.find(emp => emp.nom === 'RIAHI' && emp.prenom === 'Mehrez');
    
    console.log('\nEmployés spécifiques:');
    if(hamdi) {
      console.log('HAMDI BEN CHEDLI trouvé:', hamdi);
    } else {
      console.log('HAMDI BEN CHEDLI non trouvé');
    }
    
    if(riahi) {
      console.log('RIAHI Mehrez trouvé:', riahi);
    } else {
      console.log('RIAHI Mehrez non trouvé');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkEmployees();
