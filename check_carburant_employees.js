const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function checkCarburantEmployees() {
  console.log('🔍 Vérification des employés assignés au carburant...\n');

  try {
    const response = await fetch('http://localhost:3000/api/carburant');
    const data = await response.json();
    
    console.log('Analyse des données carburant:');
    console.log('Total enregistrements:', data.carburant.length);
    
    // Vérifier les employés assignés
    const withEmployee = data.carburant.filter(c => c.employe_assigné !== null);
    console.log('Enregistrements avec employé assigné:', withEmployee.length);
    
    if(withEmployee.length > 0) {
      console.log('Employés assignés:');
      const employees = [...new Set(withEmployee.map(c => c.employe_assigné))];
      employees.forEach(emp => console.log('  - ID:', emp));
    } else {
      console.log('⚠️  Aucun employé assigné - tous les employe_assigné sont null');
    }
    
    // Vérifier les données mai 2025
    const mai2025 = data.carburant.filter(c => c.date_livraison && c.date_livraison.includes('2025-05'));
    console.log('\nDonnées mai 2025:');
    console.log('Enregistrements mai 2025:', mai2025.length);
    
    if(mai2025.length > 0) {
      const total = mai2025.reduce((sum, c) => sum + parseFloat(c.ca_ttc.replace(',', '.')), 0);
      console.log('Total mai 2025:', total.toFixed(2) + '€');
      
      const maiWithEmployee = mai2025.filter(c => c.employe_assigné !== null);
      console.log('Mai 2025 avec employé assigné:', maiWithEmployee.length);
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkCarburantEmployees();
