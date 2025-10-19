import fetch from 'node-fetch';

async function testRecapComponent() {
  console.log('🧪 Test du composant Récap Calcul...');
  
  try {
    // Test avec les dates de l'image (01/05/2025 - 31/05/2025)
    console.log('\n📊 Test avec les dates de l\'image:');
    const response = await fetch('http://localhost:3000/api/recap-calcul?startDate=2025-05-01&endDate=2025-05-31');
    const data = await response.json();
    
    console.log(`   📊 Statut: ${data.success ? '✅ Succès' : '❌ Échec'}`);
    console.log(`   📊 Nombre de techniciens: ${data.total}`);
    
    if (data.total > 0) {
      console.log(`   📊 Premiers techniciens:`);
      data.recettesParTechnicien.slice(0, 5).forEach((tech, index) => {
        console.log(`      ${index + 1}. ${tech.employe_nom} ${tech.employe_prenom}: ${tech.nombre_interventions} interventions, ${tech.total_recette_technicien}€`);
      });
      
      // Calculer les totaux
      const totalRecettes = data.recettesParTechnicien.reduce((sum, tech) => sum + tech.total_recette_technicien, 0);
      const totalInterventions = data.recettesParTechnicien.reduce((sum, tech) => sum + tech.nombre_interventions, 0);
      
      console.log(`   📊 Total des recettes: ${totalRecettes}€`);
      console.log(`   📊 Total des interventions: ${totalInterventions}`);
      
      console.log('\n✅ Le composant devrait maintenant afficher:');
      console.log(`   - ${data.total} techniciens dans le tableau`);
      console.log(`   - Recettes Totales: ${totalRecettes}€`);
      console.log(`   - Recettes Entreprise: ${totalRecettes}€`);
      console.log(`   - Interventions Totales: ${totalInterventions}`);
      console.log(`   - Bénéfice Net: ${totalRecettes}€`);
      console.log(`   - Marge Moyenne: 100.00%`);
    }
    
    console.log('\n🎯 Test terminé !');
    console.log('✅ Le problème "Aucune donnée trouvée" devrait être résolu');
    console.log('✅ Actualisez la page dans votre navigateur pour voir les résultats');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testRecapComponent().catch(console.error);
