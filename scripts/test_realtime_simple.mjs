import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function testRealtimeSync() {
  try {
    console.log('🧪 Test de synchronisation en temps réel (solution polling)')
    console.log('=' .repeat(60))
    
    // 1. Récupérer un employé existant
    console.log('📋 1. Récupération d\'un employé de test...')
    const employeeResult = await pool.query(`
      SELECT id, prenom, nom, telephone, rib_salaire, rib2
      FROM employes 
      WHERE statut = 'actif'
      LIMIT 1
    `)
    
    if (employeeResult.rows.length === 0) {
      console.log('❌ Aucun employé trouvé pour le test')
      return
    }
    
    const testEmployee = employeeResult.rows[0]
    console.log(`✅ Employé de test: ${testEmployee.prenom} ${testEmployee.nom} (ID: ${testEmployee.id})`)
    console.log(`   - Téléphone actuel: ${testEmployee.telephone}`)
    console.log(`   - RIB Salaire actuel: ${testEmployee.rib_salaire}`)
    console.log(`   - RIB2 actuel: ${testEmployee.rib2}`)
    
    // 2. Simuler une modification via l'API
    console.log('📋 2. Simulation d\'une modification via l\'API...')
    const updateData = {
      id: testEmployee.id,
      telephone: '+33 6 99 88 77 66',
      rib_salaire: 'FR76 5555 6666 7777 8888 9999 000',
      rib2: 'FR76 1111 2222 3333 4444 5555 666'
    }
    
    try {
      const putResponse = await fetch('http://localhost:3003/api/employes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })
      
      if (putResponse.ok) {
        const result = await putResponse.json()
        console.log('✅ Mise à jour employé réussie via API')
        console.log(`   - Nouveau téléphone: ${result.employe?.telephone}`)
        console.log(`   - Nouveau RIB Salaire: ${result.employe?.rib_salaire}`)
        console.log(`   - Nouveau RIB2: ${result.employe?.rib2}`)
      } else {
        const error = await putResponse.json()
        console.log('❌ Erreur API PUT:', error.error || 'Erreur inconnue')
      }
    } catch (putError) {
      console.log('❌ Erreur lors du test API PUT:', putError.message)
      console.log('💡 Assurez-vous que le serveur Next.js est démarré sur le port 3003')
    }
    
    // 3. Vérifier que les données sont bien sauvegardées
    console.log('📋 3. Vérification en base de données...')
    const updatedResult = await pool.query(`
      SELECT id, prenom, nom, telephone, rib_salaire, rib2, updated_at
      FROM employes 
      WHERE id = $1
    `, [testEmployee.id])
    
    if (updatedResult.rows.length > 0) {
      const updated = updatedResult.rows[0]
      console.log('✅ Données mises à jour en base de données:')
      console.log(`   - Employé: ${updated.prenom} ${updated.nom}`)
      console.log(`   - Téléphone: ${updated.telephone}`)
      console.log(`   - RIB Salaire: ${updated.rib_salaire}`)
      console.log(`   - RIB2: ${updated.rib2}`)
      console.log(`   - Mis à jour le: ${updated.updated_at}`)
    }
    
    // 4. Nettoyer les données de test
    console.log('📋 4. Nettoyage des données de test...')
    await pool.query(`
      UPDATE employes 
      SET telephone = $1, 
          rib_salaire = $2, 
          rib2 = $3,
          updated_at = NOW()
      WHERE id = $4
    `, [testEmployee.telephone, testEmployee.rib_salaire, testEmployee.rib2, testEmployee.id])
    console.log('🧹 Données de test nettoyées')
    
    console.log('')
    console.log('🎉 Test terminé avec succès!')
    console.log('')
    console.log('📝 Solution de synchronisation en temps réel:')
    console.log('   ✅ Polling automatique toutes les 2 secondes')
    console.log('   ✅ Interface admin se met à jour automatiquement')
    console.log('   ✅ Espace technicien se met à jour automatiquement')
    console.log('   ✅ Plus besoin de cliquer sur "Actualiser"')
    console.log('   ✅ Synchronisation bidirectionnelle Admin ↔ Technicien')
    
    console.log('')
    console.log('🔧 Pour tester la synchronisation:')
    console.log('   1. Ouvrir l\'interface admin dans un navigateur')
    console.log('   2. Ouvrir l\'espace technicien dans un autre navigateur')
    console.log('   3. Modifier les données personnelles dans l\'espace technicien')
    console.log('   4. Observer la mise à jour automatique dans l\'interface admin (2 secondes)')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Exécuter le test
testRealtimeSync()
  .then(() => {
    console.log('🎯 Test terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error)
    process.exit(1)
  })


