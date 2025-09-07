// Test simple pour vérifier l'ajout de matériel
const BASE_URL = 'http://localhost:3000';

async function testSimpleMaterialAddition() {
  console.log('🔍 Test simple d\'ajout de matériel...\n');
  
  try {
    const testMaterial = {
      numero_serie: 'TEST-SIMPLE-' + Date.now(),
      nom_equipement: 'Matériel Test Simple',
      type_materiel: 'Test',
      marque: 'TestBrand',
      modele: 'TestModel',
      statut: 'disponible',
      localisation: 'Test Location',
      quantite: 1,
      prix_unitaire: 50.00
    };
    
    console.log('Ajout du matériel:', testMaterial.nom_equipement);
    
    const response = await fetch(`${BASE_URL}/api/materiel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testMaterial)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Matériel créé avec succès!');
      console.log(`   ID: ${result.materiel.id}`);
      console.log(`   Nom: ${result.materiel.nom_equipement}`);
      console.log(`   Quantité: ${result.materiel.quantite}`);
    } else {
      const error = await response.json();
      console.log('❌ Erreur:', error.error);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testSimpleMaterialAddition();
