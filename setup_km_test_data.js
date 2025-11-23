const { Pool } = require('pg')

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024'
})

async function setupTestData() {
  const client = await pool.connect()
  
  try {
    console.log('🔧 Configuration des données de test pour alertes KM...\n')

    // 1. Récupérer une assignation active
    const assignationResult = await client.query(`
      SELECT av.*, e.nom, e.prenom, v.matricule, v.marque, v.modele
      FROM assignations_vehicules av
      JOIN employes e ON av.employe_id = e.id
      JOIN vehicules v ON av.vehicule_id = v.id
      WHERE av.statut = 'active'
      LIMIT 1
    `)

    if (assignationResult.rows.length === 0) {
      console.log('❌ Aucune assignation active trouvée')
      console.log('Créez d\'abord une assignation de véhicule dans l\'interface admin')
      return
    }

    const assignation = assignationResult.rows[0]
    console.log(`✅ Assignation trouvée:`)
    console.log(`   Technicien: ${assignation.prenom} ${assignation.nom}`)
    console.log(`   Véhicule: ${assignation.marque} ${assignation.modele} (${assignation.matricule})`)
    console.log(`   ID Assignation: ${assignation.id}`)
    console.log(`   ID Véhicule: ${assignation.vehicule_id}\n`)

    // 2. Calculer le dernier jour du mois actuel
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
    
    console.log(`📅 Dernier jour du mois: ${lastDayOfMonth.toLocaleDateString('fr-FR')}\n`)

    // 3. Mettre à jour la prochaine_echeance_km au dernier jour du mois
    await client.query(`
      UPDATE vehicules 
      SET prochaine_echeance_km = $1
      WHERE id = $2
    `, [lastDayOfMonth, assignation.vehicule_id])

    console.log(`✅ prochaine_echeance_km mise à jour: ${lastDayOfMonth.toLocaleDateString('fr-FR')}\n`)

    // 4. Définir le statut initial si nécessaire
    if (!assignation.statut_km || assignation.statut_km === '') {
      await client.query(`
        UPDATE assignations_vehicules
        SET statut_km = 'a_jour'
        WHERE id = $1
      `, [assignation.id])
      console.log('✅ Statut KM initialisé à "a_jour"\n')
    }

    // 5. Afficher les scénarios de test disponibles
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🧪 SCÉNARIOS DE TEST DISPONIBLES')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    const scenarios = [
      { 
        jour: -3, 
        label: 'J-3', 
        date: new Date(lastDayOfMonth.getTime() - 3 * 24 * 60 * 60 * 1000),
        description: '3 jours avant fin mois - Alerte préventive'
      },
      { 
        jour: -2, 
        label: 'J-2', 
        date: new Date(lastDayOfMonth.getTime() - 2 * 24 * 60 * 60 * 1000),
        description: '2 jours avant fin mois - Alerte modérée'
      },
      { 
        jour: -1, 
        label: 'J-1', 
        date: new Date(lastDayOfMonth.getTime() - 1 * 24 * 60 * 60 * 1000),
        description: '1 jour avant fin mois - Alerte importante'
      },
      { 
        jour: 0, 
        label: 'JOUR J', 
        date: lastDayOfMonth,
        description: 'Dernier jour du mois - ALERTE CRITIQUE'
      },
      { 
        jour: 1, 
        label: 'J+1', 
        date: new Date(lastDayOfMonth.getTime() + 1 * 24 * 60 * 60 * 1000),
        description: '1er jour de grâce - Retard modéré'
      },
      { 
        jour: 2, 
        label: 'J+2', 
        date: new Date(lastDayOfMonth.getTime() + 2 * 24 * 60 * 60 * 1000),
        description: '2ème jour de grâce - Retard important'
      },
      { 
        jour: 3, 
        label: 'J+3', 
        date: new Date(lastDayOfMonth.getTime() + 3 * 24 * 60 * 60 * 1000),
        description: 'Dernier jour de grâce - BLOCAGE IMMINENT'
      },
      { 
        jour: 4, 
        label: 'J+4', 
        date: new Date(lastDayOfMonth.getTime() + 4 * 24 * 60 * 60 * 1000),
        description: 'BLOCAGE - Accès suspendu'
      },
    ]

    scenarios.forEach(s => {
      const aujourdhui = new Date()
      const isToday = s.date.toDateString() === aujourdhui.toDateString()
      const prefix = isToday ? '👉' : '  '
      console.log(`${prefix} ${s.label.padEnd(10)} | ${s.date.toLocaleDateString('fr-FR')} | ${s.description}`)
    })

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📌 INSTRUCTIONS DE TEST')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('1. Ouvrez l\'application: http://localhost:3000')
    console.log('2. Connectez-vous en tant qu\'admin')
    console.log('3. Allez dans Véhicules → Assignations')
    console.log('4. Cliquez sur "Tester Alertes KM"')
    console.log('5. Testez chaque scénario pour voir les alertes\n')
    console.log(`📝 Assignation de test: ID ${assignation.id}`)
    console.log(`📝 Véhicule de test: ID ${assignation.vehicule_id}\n`)

  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    client.release()
    await pool.end()
  }
}

setupTestData()
