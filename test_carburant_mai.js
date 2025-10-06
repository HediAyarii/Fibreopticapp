const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testCarburantMai() {
  console.log('🔍 Vérification des données carburant mai 2025...\n');

  try {
    const response = await fetch('http://localhost:3000/api/carburant');
    const data = await response.json();
    
    console.log('Données carburant mai 2025:');
    const mai2025 = data.carburant.filter(c => c.date_livraison && c.date_livraison.includes('2025-05'));
    console.log('Enregistrements mai 2025:', mai2025.length);
    
    if(mai2025.length > 0) {
      const total = mai2025.reduce((sum, c) => sum + parseFloat(c.ca_ttc.replace(',', '.')), 0);
      console.log('Total mai 2025:', total.toFixed(2) + '€');
      console.log('Employé assigné (premier):', mai2025[0].employe_assigné);
      
      // Vérifier les employés assignés
      const assignes = mai2025.filter(c => c.employe_assigné !== null);
      console.log('Enregistrements avec employé assigné:', assignes.length);
      
      if(assignes.length > 0) {
        console.log('Premier employé assigné:', assignes[0].employe_assigné);
      }
    } else {
      console.log('Aucune donnée carburant pour mai 2025');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testCarburantMai();
