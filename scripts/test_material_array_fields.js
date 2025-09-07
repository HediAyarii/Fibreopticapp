// Script de test pour vérifier l'ajout de matériel avec champs de tableau
const BASE_URL = 'http://localhost:3000';

async function testMaterialAddition() {
  console.log('🔍 Test d\'ajout de matériel avec champs de tableau...\n');
  
  try {
    // 1. Test avec des champs de tableau vides
    console.log('1. Test avec des champs de tableau vides...');
    const testMaterial1 = {
      numero_serie: 'TEST-ARRAY-' + Date.now(),
      nom_equipement: 'Matériel Test Array',
      type_materiel: 'Test',
      marque: 'TestBrand',
      modele: 'TestModel',
      statut: 'disponible',
      localisation: 'Test Location',
      quantite: 3,
      prix_unitaire: 75.50,
      accessoires_inclus: '', // Chaîne vide
      certificats_conformite: '', // Chaîne vide
      photos: '' // Chaîne vide
    };
    
    const addMaterialResponse1 = await fetch(`${BASE_URL}/api/materiel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testMaterial1)
    });
    
    if (addMaterialResponse1.ok) {
      const result1 = await addMaterialResponse1.json();
      console.log('✅ Matériel créé avec succès (champs vides)');
      console.log(`   ID: ${result1.materiel.id}`);
      console.log(`   Nom: ${result1.materiel.nom_equipement}`);
    } else {
      const error1 = await addMaterialResponse1.json();
      console.log('❌ Erreur lors de la création:', error1.error);
    }
    
    // 2. Test avec des champs de tableau null
    console.log('\n2. Test avec des champs de tableau null...');
    const testMaterial2 = {
      numero_serie: 'TEST-NULL-' + Date.now(),
      nom_equipement: 'Matériel Test Null',
      type_materiel: 'Test',
      marque: 'TestBrand',
      modele: 'TestModel',
      statut: 'disponible',
      localisation: 'Test Location',
      quantite: 2,
      prix_unitaire: 100.00,
      accessoires_inclus: null,
      certificats_conformite: null,
      photos: null
    };
    
    const addMaterialResponse2 = await fetch(`${BASE_URL}/api/materiel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testMaterial2)
    });
    
    if (addMaterialResponse2.ok) {
      const result2 = await addMaterialResponse2.json();
      console.log('✅ Matériel créé avec succès (champs null)');
      console.log(`   ID: ${result2.materiel.id}`);
      console.log(`   Nom: ${result2.materiel.nom_equipement}`);
    } else {
      const error2 = await addMaterialResponse2.json();
      console.log('❌ Erreur lors de la création:', error2.error);
    }
    
    // 3. Test avec des champs de tableau avec des valeurs
    console.log('\n3. Test avec des champs de tableau avec des valeurs...');
    const testMaterial3 = {
      numero_serie: 'TEST-VALUES-' + Date.now(),
      nom_equipement: 'Matériel Test Values',
      type_materiel: 'Test',
      marque: 'TestBrand',
      modele: 'TestModel',
      statut: 'disponible',
      localisation: 'Test Location',
      quantite: 1,
      prix_unitaire: 150.00,
      accessoires_inclus: 'Câble, Adaptateur',
      certificats_conformite: 'CE, FCC',
      photos: 'photo1.jpg, photo2.jpg'
    };
    
    const addMaterialResponse3 = await fetch(`${BASE_URL}/api/materiel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testMaterial3)
    });
    
    if (addMaterialResponse3.ok) {
      const result3 = await addMaterialResponse3.json();
      console.log('✅ Matériel créé avec succès (champs avec valeurs)');
      console.log(`   ID: ${result3.materiel.id}`);
      console.log(`   Nom: ${result3.materiel.nom_equipement}`);
    } else {
      const error3 = await addMaterialResponse3.json();
      console.log('❌ Erreur lors de la création:', error3.error);
    }
    
    console.log('\n🎯 Test terminé!');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Vérifier si le serveur est en cours d'exécution
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/materiel`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🔍 Vérification du serveur...');
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Le serveur n\'est pas en cours d\'exécution.');
    console.log('   Veuillez démarrer le serveur avec: npm run dev');
    return;
  }
  
  console.log('✅ Serveur détecté, lancement du test...\n');
  await testMaterialAddition();
}

main();
