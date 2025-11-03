import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function debugFunctionLogic() {
  console.log('🔍 Debug de la logique de détection de conflits...')
  
  try {
    // 1. Vérifier la logique manuellement
    console.log('\n📋 1. Test de la logique manuelle...')
    
    const testCard = 'TEST_DEBUG_001'
    const testEmployee = 11
    const testDate = '2024-01-01'
    
    // Vérifier si la carte est déjà assignée
    const cardConflict = await pool.query(`
      SELECT 
        ca.id,
        ca.carte_id,
        ca.employe_id,
        ca.date_assignation,
        ca.date_fin,
        ca.statut,
        e.nom,
        e.prenom
      FROM carburant_assignations ca
      LEFT JOIN employes e ON e.id = ca.employe_id
      WHERE ca.carte_id = $1
        AND ca.statut = 'active'
    `, [testCard])
    
    console.log(`   📊 Carte ${testCard} déjà assignée: ${cardConflict.rows.length > 0 ? 'OUI' : 'NON'}`)
    if (cardConflict.rows.length > 0) {
      cardConflict.rows.forEach(row => {
        console.log(`      - Employé: ${row.prenom} ${row.nom} (${row.employe_id})`)
        console.log(`      - Période: ${row.date_assignation} → ${row.date_fin || 'actuellement'}`)
      })
    }
    
    // Vérifier si l'employé a déjà une carte assignée
    const employeeConflict = await pool.query(`
      SELECT 
        ca.id,
        ca.carte_id,
        ca.employe_id,
        ca.date_assignation,
        ca.date_fin,
        ca.statut,
        e.nom,
        e.prenom
      FROM carburant_assignations ca
      LEFT JOIN employes e ON e.id = ca.employe_id
      WHERE ca.employe_id = $1
        AND ca.statut = 'active'
    `, [testEmployee])
    
    console.log(`   📊 Employé ${testEmployee} a déjà une carte: ${employeeConflict.rows.length > 0 ? 'OUI' : 'NON'}`)
    if (employeeConflict.rows.length > 0) {
      employeeConflict.rows.forEach(row => {
        console.log(`      - Carte: ${row.carte_id}`)
        console.log(`      - Période: ${row.date_assignation} → ${row.date_fin || 'actuellement'}`)
      })
    }
    
    // 2. Tester avec une carte existante
    console.log('\n📋 2. Test avec une carte existante...')
    const existingCard = '13'
    
    const existingCardConflict = await pool.query(`
      SELECT 
        ca.id,
        ca.carte_id,
        ca.employe_id,
        ca.date_assignation,
        ca.date_fin,
        ca.statut,
        e.nom,
        e.prenom
      FROM carburant_assignations ca
      LEFT JOIN employes e ON e.id = ca.employe_id
      WHERE ca.carte_id = $1
        AND ca.statut = 'active'
    `, [existingCard])
    
    console.log(`   📊 Carte ${existingCard} déjà assignée: ${existingCardConflict.rows.length > 0 ? 'OUI' : 'NON'}`)
    if (existingCardConflict.rows.length > 0) {
      existingCardConflict.rows.forEach(row => {
        console.log(`      - Employé: ${row.prenom} ${row.nom} (${row.employe_id})`)
        console.log(`      - Période: ${row.date_assignation} → ${row.date_fin || 'actuellement'}`)
      })
    }
    
    // 3. Tester la fonction avec la carte existante
    console.log('\n📋 3. Test de la fonction avec carte existante...')
    try {
      const conflictResult = await pool.query(`
        SELECT * FROM detecter_conflits_assignation($1, $2, $3)
      `, [testEmployee, existingCard, testDate])
      
      console.log(`   📊 Résultat: ${conflictResult.rows.length} conflit(s)`)
      conflictResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. Conflit: ${row.conflit_existe}, Message: ${row.message_conflit}`)
      })
    } catch (funcError) {
      console.log(`   ❌ Erreur fonction: ${funcError.message}`)
    }
    
    // 4. Vérifier la signature exacte de la fonction
    console.log('\n📋 4. Signature de la fonction...')
    const functionSignature = await pool.query(`
      SELECT 
        p.parameter_name,
        p.data_type,
        p.ordinal_position
      FROM information_schema.parameters p
      WHERE p.specific_name IN (
        SELECT specific_name 
        FROM information_schema.routines 
        WHERE routine_name = 'detecter_conflits_assignation'
      )
      ORDER BY p.ordinal_position
    `)
    
    console.log(`   📊 Paramètres de la fonction:`)
    functionSignature.rows.forEach(row => {
      console.log(`      ${row.ordinal_position}. ${row.parameter_name}: ${row.data_type}`)
    })
    
    // 5. Tester avec les bons paramètres
    console.log('\n📋 5. Test avec les bons paramètres...')
    try {
      // Essayer avec la signature: (employe_id, carte_id, date_debut)
      const conflictResult1 = await pool.query(`
        SELECT * FROM detecter_conflits_assignation($1, $2, $3)
      `, [testEmployee, existingCard, testDate])
      
      console.log(`   📊 Test 1 (employe_id, carte_id, date_debut): ${conflictResult1.rows.length} conflit(s)`)
      
      // Essayer avec la signature: (carte_id, date_debut, date_fin)
      const conflictResult2 = await pool.query(`
        SELECT * FROM detecter_conflits_assignation($1, $2, $3)
      `, [existingCard, testDate, '2024-12-31'])
      
      console.log(`   📊 Test 2 (carte_id, date_debut, date_fin): ${conflictResult2.rows.length} conflit(s)`)
      
    } catch (funcError) {
      console.log(`   ❌ Erreur fonction: ${funcError.message}`)
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du debug:', error)
  } finally {
    await pool.end()
  }
}

debugFunctionLogic()












