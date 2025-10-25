import fetch from 'node-fetch'
import { Pool } from 'pg'

const baseUrl = 'http://localhost:3000'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function debugAssignmentConflict() {
  console.log('🔍 Debug de la détection de conflits d\'assignation...')
  
  try {
    // 1. Vérifier les assignations existantes
    console.log('\n📋 1. Vérification des assignations existantes...')
    const existingAssignments = await pool.query(`
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
      ORDER BY ca.created_at DESC
      LIMIT 10
    `)
    
    console.log(`   📊 ${existingAssignments.rows.length} assignations trouvées:`)
    existingAssignments.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. Carte: ${row.carte_id}, Employé: ${row.prenom} ${row.nom} (${row.employe_id}), Statut: ${row.statut}, Période: ${row.date_assignation} → ${row.date_fin || 'actuellement'}`)
    })
    
    // 2. Tester la fonction detecter_conflits_assignation directement
    console.log('\n📋 2. Test de la fonction detecter_conflits_assignation...')
    
    // Test avec une carte qui n'existe pas
    const testCard = 'TEST_DEBUG_001'
    const testEmployee = 11
    const testDate = '2024-01-01'
    
    console.log(`   🧪 Test avec carte: ${testCard}, employé: ${testEmployee}, date: ${testDate}`)
    
    try {
      const conflictResult = await pool.query(`
        SELECT * FROM detecter_conflits_assignation($1, $2, $3)
      `, [testEmployee, testCard, testDate])
      
      console.log(`   📊 Résultat de la fonction: ${conflictResult.rows.length} conflit(s) détecté(s)`)
      conflictResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. Conflit: ${row.conflit_existe}, Message: ${row.message_conflit}`)
        if (row.conflit_existe) {
          console.log(`      - ID: ${row.assignation_existante_id}`)
          console.log(`      - Employé: ${row.assignation_existante_employe_id}`)
          console.log(`      - Carte: ${row.assignation_existante_carte_id}`)
          console.log(`      - Période: ${row.assignation_existante_date_debut} → ${row.assignation_existante_date_fin}`)
        }
      })
    } catch (funcError) {
      console.log(`   ❌ Erreur fonction: ${funcError.message}`)
    }
    
    // 3. Vérifier la signature de la fonction
    console.log('\n📋 3. Vérification de la signature de la fonction...')
    const functionInfo = await pool.query(`
      SELECT 
        routine_name,
        routine_definition,
        parameter_name,
        parameter_mode,
        data_type
      FROM information_schema.routines r
      LEFT JOIN information_schema.parameters p ON r.specific_name = p.specific_name
      WHERE routine_name = 'detecter_conflits_assignation'
      ORDER BY p.ordinal_position
    `)
    
    console.log(`   📊 Fonction trouvée: ${functionInfo.rows.length > 0 ? 'OUI' : 'NON'}`)
    if (functionInfo.rows.length > 0) {
      console.log(`   📊 Paramètres:`)
      functionInfo.rows.forEach(row => {
        console.log(`      - ${row.parameter_name}: ${row.data_type} (${row.parameter_mode})`)
      })
    }
    
    // 4. Test de l'API
    console.log('\n📋 4. Test de l\'API carburant-assignation-periode...')
    const apiResponse = await fetch(`${baseUrl}/api/carburant-assignation-periode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        numero_carte: testCard,
        employe_id: testEmployee,
        employe_nom: 'Test Debug',
        date_debut: testDate,
        date_fin_prevue: '2024-12-31',
        commentaires: 'Test debug',
        force: false
      })
    })
    
    const apiData = await apiResponse.json()
    console.log(`   📊 Status API: ${apiResponse.status}`)
    console.log(`   📊 Réponse API: ${JSON.stringify(apiData, null, 2)}`)
    
    if (apiResponse.status === 409) {
      console.log('   ⚠️ Conflit détecté par l\'API')
      if (apiData.conflits) {
        console.log(`   📊 ${apiData.conflits.length} conflit(s) détecté(s):`)
        apiData.conflits.forEach((conflit, index) => {
          console.log(`      ${index + 1}. ${JSON.stringify(conflit)}`)
        })
      }
    } else if (apiResponse.ok) {
      console.log('   ✅ Assignation réussie')
    } else {
      console.log(`   ❌ Erreur API: ${apiData.error}`)
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du debug:', error)
  } finally {
    await pool.end()
  }
}

debugAssignmentConflict()










