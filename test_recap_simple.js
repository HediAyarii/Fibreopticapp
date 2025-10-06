const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAPI() {
  try {
    console.log('🧪 Test simple de l\'API récap calcul...');
    
    const response = await fetch('http://localhost:3000/api/recap-calcul');
    console.log('Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Erreur:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ API fonctionne !');
    console.log('Nombre d\'employés:', data.recapData?.length || 0);
    
    if (data.recapData && data.recapData.length > 0) {
      const firstEmp = data.recapData[0];
      console.log('Premier employé:', firstEmp.employe_nom, firstEmp.employe_prenom);
      console.log('Recettes:', firstEmp.recettes_generes);
      console.log('Charges fixes:', firstEmp.charges_fixes);
      console.log('Charges variables:', firstEmp.charges_variables);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testAPI();
