import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function debugHistoricalAssignment() {
  try {
    console.log('🔍 Debug de l\'assignation historique pour Karim BEN RABEH...')
    
    // Vérifier la date actuelle
    const currentDate = await pool.query('SELECT CURRENT_DATE as today')
    console.log(`📅 Date actuelle: ${currentDate.rows[0].today}`)
    
    // Vérifier les assignations actuelles pour la carte 34
    console.log('📋 1. Assignations actuelles pour la carte 34...')
    const currentAssignments = await pool.query(`
      SELECT ca.*, e.nom, e.prenom 
      FROM carburant_assignations ca
      LEFT JOIN employes e ON ca.employe_id = e.id
      WHERE ca.carte_id = '34'
        AND ca.statut = 'active'
      ORDER BY ca.date_assignation DESC
    `)
    
    console.log(`📊 Assignations actives pour la carte 34: ${currentAssignments.rows.length}`)
    currentAssignments.rows.forEach((assignment, index) => {
      console.log(`   ${index + 1}. Employé: ${assignment.prenom} ${assignment.nom} (ID: ${assignment.employe_id})`)
      console.log(`      Période: ${assignment.date_assignation} → ${assignment.date_fin || 'permanent'}`)
      console.log(`      Statut: ${assignment.statut}`)
    })
    
    // Vérifier les assignations historiques pour la carte 34
    console.log('📋 2. Assignations historiques pour la carte 34...')
    const historicalAssignments = await pool.query(`
      SELECT ca.*, e.nom, e.prenom 
      FROM carburant_assignations ca
      LEFT JOIN employes e ON ca.employe_id = e.id
      WHERE ca.carte_id = '34'
        AND ca.statut = 'expired'
      ORDER BY ca.date_assignation DESC
    `)
    
    console.log(`📊 Assignations expirées pour la carte 34: ${historicalAssignments.rows.length}`)
    historicalAssignments.rows.forEach((assignment, index) => {
      console.log(`   ${index + 1}. Employé: ${assignment.prenom} ${assignment.nom} (ID: ${assignment.employe_id})`)
      console.log(`      Période: ${assignment.date_assignation} → ${assignment.date_fin || 'permanent'}`)
      console.log(`      Statut: ${assignment.statut}`)
    })
    
    // Tester la fonction avec différents scénarios
    console.log('📋 3. Tests de la fonction detecter_conflits_assignation...')
    
    // Test 1: Assignation historique pour Karim (avant Radhouan)
    console.log('🧪 Test 1: Assignation historique pour Karim (01/09/2025 → 30/09/2025)...')
    const test1 = await pool.query(`
      SELECT * FROM detecter_conflits_assignation(
        5::INTEGER, -- Karim BEN RABEH
        '34'::VARCHAR(255), 
        '2025-09-01'::TIMESTAMP,
        '2025-09-30'::TIMESTAMP
      )
    `)
    
    console.log(`   - Conflit détecté: ${test1.rows[0]?.conflit_existe || false}`)
    console.log(`   - Message: ${test1.rows[0]?.message_conflit || 'N/A'}`)
    
    // Test 2: Assignation historique pour Karim (période plus ancienne)
    console.log('🧪 Test 2: Assignation historique pour Karim (01/08/2025 → 31/08/2025)...')
    const test2 = await pool.query(`
      SELECT * FROM detecter_conflits_assignation(
        5::INTEGER, -- Karim BEN RABEH
        '34'::VARCHAR(255), 
        '2025-08-01'::TIMESTAMP,
        '2025-08-31'::TIMESTAMP
      )
    `)
    
    console.log(`   - Conflit détecté: ${test2.rows[0]?.conflit_existe || false}`)
    console.log(`   - Message: ${test2.rows[0]?.message_conflit || 'N/A'}`)
    
    // Test 3: Assignation historique pour Karim (période très ancienne)
    console.log('🧪 Test 3: Assignation historique pour Karim (01/05/2025 → 31/05/2025)...')
    const test3 = await pool.query(`
      SELECT * FROM detecter_conflits_assignation(
        5::INTEGER, -- Karim BEN RABEH
        '34'::VARCHAR(255), 
        '2025-05-01'::TIMESTAMP,
        '2025-05-31'::TIMESTAMP
      )
    `)
    
    console.log(`   - Conflit détecté: ${test3.rows[0]?.conflit_existe || false}`)
    console.log(`   - Message: ${test3.rows[0]?.message_conflit || 'N/A'}`)
    
    // Vérifier la logique de la fonction
    console.log('📋 4. Analyse de la logique...')
    console.log('   - Assignation actuelle: Radhouan (01/10/2025 → permanent)')
    console.log('   - Nouvelle assignation: Karim (période avant 01/10/2025)')
    console.log('   - Logique: Les périodes ne se chevauchent pas, donc pas de conflit')
    
    await pool.end()
  } catch (error) {
    console.error('❌ Erreur:', error)
    await pool.end()
  }
}

debugHistoricalAssignment()





