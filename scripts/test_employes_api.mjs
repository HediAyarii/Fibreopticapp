import fetch from 'node-fetch';

async function testEmployesApi() {
  console.log('🧪 Test de l\'API /api/employes...');
  
  try {
    const response = await fetch('http://localhost:3000/api/employes')
    const data = await response.json()
    
    console.log(`📊 Status: ${response.status}`)
    console.log(`📊 Success: ${data.success}`)
    console.log(`📊 Nombre d'employés: ${data.employes ? data.employes.length : 0}`)
    
    if (data.employes && data.employes.length > 0) {
      console.log('\n📊 Premiers employés:')
      data.employes.slice(0, 5).forEach((emp, index) => {
        console.log(`   ${index + 1}. ${emp.nom} ${emp.prenom} (ID: ${emp.id}) - ${emp.matricule}`)
      })
      
      // Chercher MOULAHI Mohamed-Bechir
      const moulahi = data.employes.find(emp => 
        emp.matricule === 'TECH_MOUMO'
      )
      
      if (moulahi) {
        console.log(`\n✅ MOULAHI Mohamed-Bechir trouvé:`)
        console.log(`   📊 ID: ${moulahi.id}`)
        console.log(`   📊 Nom: ${moulahi.nom}`)
        console.log(`   📊 Prénom: ${moulahi.prenom}`)
        console.log(`   📊 Matricule: ${moulahi.matricule}`)
        console.log(`   📊 Statut: ${moulahi.statut}`)
      } else {
        console.log(`\n❌ MOULAHI Mohamed-Bechir non trouvé`)
        console.log(`📊 Matricules disponibles:`)
        data.employes.forEach(emp => {
          console.log(`   - ${emp.matricule} (${emp.nom} ${emp.prenom})`)
        })
      }
    } else {
      console.log('❌ Aucun employé trouvé dans la réponse')
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
  }
}

testEmployesApi().catch(console.error);
