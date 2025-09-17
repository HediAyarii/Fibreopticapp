// Script de test pour les nouvelles APIs de tarifs d'entreprise
import fetch from 'node-fetch'

const BASE_URL = 'http://localhost:3000'

async function testCompanyPricingAPI() {
  console.log('🧪 Test des APIs de tarifs d\'entreprise...\n')
  
  try {
    // Test 1: Récupérer tous les tarifs
    console.log('1️⃣ Test GET /api/company-pricing')
    const response1 = await fetch(`${BASE_URL}/api/company-pricing`)
    const data1 = await response1.json()
    
    if (data1.success) {
      console.log(`✅ ${data1.count} tarifs récupérés avec succès`)
      console.log(`   - AXECOM: ${data1.pricing.filter(p => p.company_name === 'AXECOM').length} services`)
      console.log(`   - ERT OUEST: ${data1.pricing.filter(p => p.company_name === 'ERT OUEST').length} services`)
    } else {
      console.log('❌ Erreur lors de la récupération des tarifs')
    }
    
    // Test 2: Récupérer les tarifs AXECOM uniquement
    console.log('\n2️⃣ Test GET /api/company-pricing?company=AXECOM')
    const response2 = await fetch(`${BASE_URL}/api/company-pricing?company=AXECOM`)
    const data2 = await response2.json()
    
    if (data2.success) {
      console.log(`✅ ${data2.count} tarifs AXECOM récupérés`)
    } else {
      console.log('❌ Erreur lors de la récupération des tarifs AXECOM')
    }
    
    // Test 3: Récupérer les services SAV uniquement
    console.log('\n3️⃣ Test GET /api/company-pricing?category=SAV')
    const response3 = await fetch(`${BASE_URL}/api/company-pricing?category=SAV`)
    const data3 = await response3.json()
    
    if (data3.success) {
      console.log(`✅ ${data3.count} services SAV récupérés`)
    } else {
      console.log('❌ Erreur lors de la récupération des services SAV')
    }
    
    // Test 4: Rechercher un service spécifique
    console.log('\n4️⃣ Test GET /api/company-pricing?service=RACPRO')
    const response4 = await fetch(`${BASE_URL}/api/company-pricing?service=RACPRO`)
    const data4 = await response4.json()
    
    if (data4.success) {
      console.log(`✅ ${data4.count} services RACPRO trouvés`)
      data4.pricing.forEach(p => {
        console.log(`   - ${p.company_name} ${p.service_code} ${p.category}: ${p.prix_base}€ + ${p.prix_tech}€ = ${p.total_price}€`)
      })
    } else {
      console.log('❌ Erreur lors de la recherche de services RACPRO')
    }
    
    // Test 5: Récupérer les frais d'entreprise
    console.log('\n5️⃣ Test GET /api/frais-entreprise')
    const response5 = await fetch(`${BASE_URL}/api/frais-entreprise`)
    const data5 = await response5.json()
    
    if (data5.success) {
      console.log(`✅ ${data5.count} frais d'entreprise récupérés`)
    } else {
      console.log('❌ Erreur lors de la récupération des frais d\'entreprise')
    }
    
    console.log('\n🎉 Tests terminés avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message)
    console.log('\n💡 Assurez-vous que l\'application est démarrée avec: npm run dev')
  }
}

// Fonction pour tester la création d'un frais d'entreprise
async function testCreateFraisEntreprise() {
  console.log('\n🧪 Test de création d\'un frais d\'entreprise...\n')
  
  try {
    const fraisData = {
      company_name: 'AXECOM',
      service_code: 'RACPRO_S',
      category: 'SAV',
      numero_facture: 'TEST-001',
      date_facture: '2025-01-15',
      fournisseur: 'Fournisseur Test',
      type_frais: 'materiel',
      montant_ht: 150.00,
      montant_ttc: 180.00,
      tva: 20.00,
      description: 'Test de création de frais',
      statut: 'en_attente',
      commentaires: 'Frais de test'
    }
    
    const response = await fetch(`${BASE_URL}/api/frais-entreprise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fraisData)
    })
    
    const data = await response.json()
    
    if (data.success) {
      console.log('✅ Frais d\'entreprise créé avec succès!')
      console.log(`   - ID: ${data.frais.id}`)
      console.log(`   - Entreprise: ${data.frais.company_name}`)
      console.log(`   - Service: ${data.frais.service_code}`)
      console.log(`   - Montant TTC: ${data.frais.montant_ttc}€`)
    } else {
      console.log('❌ Erreur lors de la création du frais:', data.error)
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test de création:', error.message)
  }
}

// Exécuter les tests
async function runTests() {
  await testCompanyPricingAPI()
  await testCreateFraisEntreprise()
}

runTests()
