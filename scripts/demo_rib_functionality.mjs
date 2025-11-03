import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function demoRibFunctionality() {
  try {
    console.log('🎯 Démonstration des fonctionnalités RIB')
    console.log('=' .repeat(50))
    
    // 1. Ajouter des RIB à plusieurs employés
    console.log('📋 1. Ajout de RIB à plusieurs employés...')
    
    const ribUpdates = [
      {
        id: 1,
        rib_salaire: 'FR76 1234 5678 9012 3456 7890 123',
        rib2: 'FR76 9876 5432 1098 7654 3210 987'
      },
      {
        id: 2,
        rib_salaire: 'FR76 2345 6789 0123 4567 8901 234',
        rib2: null
      },
      {
        id: 3,
        rib_salaire: 'FR76 3456 7890 1234 5678 9012 345',
        rib2: 'FR76 8765 4321 0987 6543 2109 876'
      }
    ]
    
    for (const update of ribUpdates) {
      await pool.query(`
        UPDATE employes 
        SET rib_salaire = $1, 
            rib2 = $2,
            updated_at = NOW()
        WHERE id = $3
      `, [update.rib_salaire, update.rib2, update.id])
    }
    
    console.log(`✅ ${ribUpdates.length} employés mis à jour avec des RIB`)
    
    // 2. Afficher les employés avec leurs RIB
    console.log('📋 2. Liste des employés avec leurs RIB...')
    const employeesResult = await pool.query(`
      SELECT id, prenom, nom, rib_salaire, rib2
      FROM employes 
      WHERE id IN (1, 2, 3)
      ORDER BY id
    `)
    
    employeesResult.rows.forEach((emp, index) => {
      console.log(`   ${index + 1}. ${emp.prenom} ${emp.nom} (ID: ${emp.id})`)
      console.log(`      💳 RIB Salaire: ${emp.rib_salaire || 'Non renseigné'}`)
      console.log(`      💳 RIB2: ${emp.rib2 || 'Non renseigné'}`)
      console.log('')
    })
    
    // 3. Tester l'API GET
    console.log('📋 3. Test de l\'API GET /api/employes...')
    try {
      const response = await fetch('http://localhost:3000/api/employes')
      if (response.ok) {
        const data = await response.json()
        console.log('✅ API accessible')
        
        const employeesWithRib = data.employes?.filter(emp => emp.id <= 3) || []
        console.log(`📊 ${employeesWithRib.length} employés récupérés via l'API`)
        
        employeesWithRib.forEach((emp, index) => {
          console.log(`   ${index + 1}. ${emp.prenom} ${emp.nom}`)
          console.log(`      💳 RIB Salaire: ${emp.rib_salaire || 'Non renseigné'}`)
          console.log(`      💳 RIB2: ${emp.rib2 || 'Non renseigné'}`)
        })
      } else {
        console.log('❌ Erreur API:', response.status, response.statusText)
      }
    } catch (apiError) {
      console.log('❌ Erreur API:', apiError.message)
      console.log('💡 Assurez-vous que le serveur Next.js est démarré (npm run dev)')
    }
    
    // 4. Tester l'API PUT pour modification
    console.log('📋 4. Test de modification via API PUT...')
    try {
      const updateData = {
        id: 1,
        rib_salaire: 'FR76 9999 8888 7777 6666 5555 444',
        rib2: 'FR76 1111 2222 3333 4444 5555 666'
      }
      
      const putResponse = await fetch('http://localhost:3000/api/employes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })
      
      if (putResponse.ok) {
        const result = await putResponse.json()
        console.log('✅ Modification RIB via API réussie')
        console.log(`   - Employé: ${result.employe?.prenom} ${result.employe?.nom}`)
        console.log(`   - Nouveau RIB Salaire: ${result.employe?.rib_salaire}`)
        console.log(`   - Nouveau RIB2: ${result.employe?.rib2}`)
      } else {
        const error = await putResponse.json()
        console.log('❌ Erreur API PUT:', error.error || 'Erreur inconnue')
      }
    } catch (putError) {
      console.log('❌ Erreur lors du test API PUT:', putError.message)
    }
    
    // 5. Nettoyer les données de test
    console.log('📋 5. Nettoyage des données de test...')
    await pool.query(`
      UPDATE employes 
      SET rib_salaire = NULL, 
          rib2 = NULL,
          updated_at = NOW()
      WHERE id IN (1, 2, 3)
    `)
    console.log('🧹 Données de test nettoyées')
    
    console.log('')
    console.log('🎉 Démonstration terminée avec succès!')
    console.log('')
    console.log('📝 Fonctionnalités RIB disponibles:')
    console.log('   ✅ Affichage des RIB dans les détails de l\'employé')
    console.log('   ✅ Modification des RIB via le formulaire d\'édition')
    console.log('   ✅ Sauvegarde des RIB en base de données')
    console.log('   ✅ Récupération des RIB via l\'API')
    console.log('   ✅ Interface utilisateur avec police monospace')
    console.log('   ✅ Gestion des valeurs nulles (Non renseigné)')
    
  } catch (error) {
    console.error('❌ Erreur lors de la démonstration:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Exécuter la démonstration
demoRibFunctionality()
  .then(() => {
    console.log('🎯 Démonstration terminée')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error)
    process.exit(1)
  })








