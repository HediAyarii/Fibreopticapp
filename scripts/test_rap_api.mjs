import pkg from 'pg'
const { Pool } = pkg

// Configuration de la base de données
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

async function testRapAPI() {
  try {
    console.log('🧪 Test de l\'API RAP...')
    
    // 1. Vérifier la fonction verifier_coherence_rap
    console.log('\n📊 1. Test de la fonction verifier_coherence_rap...')
    try {
      const coherenceResult = await pool.query(`
        SELECT * FROM verifier_coherence_rap()
        ORDER BY nom, prenom
        LIMIT 5
      `)
      
      console.log(`✅ Fonction verifier_coherence_rap: ${coherenceResult.rows.length} résultats`)
      
      if (coherenceResult.rows.length > 0) {
        console.log('📋 Exemple de données:')
        coherenceResult.rows.forEach((row, index) => {
          console.log(`   ${index + 1}. ${row.nom} ${row.prenom}:`)
          console.log(`      - RAP actuel: ${row.rap_actuel} (type: ${typeof row.rap_actuel})`)
          console.log(`      - RAP calculé: ${row.rap_calcule} (type: ${typeof row.rap_calcule})`)
          console.log(`      - Différence: ${row.difference} (type: ${typeof row.difference})`)
          console.log(`      - Cohérent: ${row.est_coherent}`)
        })
      }
      
    } catch (error) {
      console.error('❌ Erreur fonction verifier_coherence_rap:', error.message)
    }
    
    // 2. Vérifier la fonction corriger_tous_les_rap
    console.log('\n📊 2. Test de la fonction corriger_tous_les_rap...')
    try {
      const correctionResult = await pool.query(`
        SELECT * FROM corriger_tous_les_rap()
        WHERE ABS(difference) > 0.01
        LIMIT 5
      `)
      
      console.log(`✅ Fonction corriger_tous_les_rap: ${correctionResult.rows.length} résultats`)
      
      if (correctionResult.rows.length > 0) {
        console.log('📋 Exemple de corrections:')
        correctionResult.rows.forEach((row, index) => {
          console.log(`   ${index + 1}. ${row.nom} ${row.prenom}:`)
          console.log(`      - RAP avant: ${row.rap_avant}`)
          console.log(`      - RAP après: ${row.rap_apres}`)
          console.log(`      - Différence: ${row.difference}`)
        })
      }
      
    } catch (error) {
      console.error('❌ Erreur fonction corriger_tous_les_rap:', error.message)
    }
    
    // 3. Vérifier les données de cout_par_salaire
    console.log('\n📊 3. Vérification des données cout_par_salaire...')
    const coutData = await pool.query(`
      SELECT nom, prenom, rap, total_genere, total_paiements
      FROM cout_par_salaire 
      WHERE nom IS NOT NULL AND prenom IS NOT NULL
      ORDER BY nom, prenom
      LIMIT 5
    `)
    
    console.log(`✅ Données cout_par_salaire: ${coutData.rows.length} enregistrements`)
    
    if (coutData.rows.length > 0) {
      console.log('📋 Exemple de données:')
      coutData.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.nom} ${row.prenom}:`)
        console.log(`      - RAP: ${row.rap} (type: ${typeof row.rap})`)
        console.log(`      - Total généré: ${row.total_genere} (type: ${typeof row.total_genere})`)
        console.log(`      - Total paiements: ${row.total_paiements} (type: ${typeof row.total_paiements})`)
      })
    }
    
    // 4. Test de l'API GET
    console.log('\n📊 4. Test de l\'API GET...')
    try {
      // Simuler l'appel API GET
      const apiResult = await pool.query(`
        SELECT * FROM verifier_coherence_rap()
        ORDER BY nom, prenom
      `)
      
      const total = apiResult.rows.length
      const cohérents = apiResult.rows.filter(row => row.est_coherent).length
      const incohérents = total - cohérents
      
      console.log(`✅ API GET simulée:`)
      console.log(`   - Total: ${total}`)
      console.log(`   - Cohérents: ${cohérents}`)
      console.log(`   - Incohérents: ${incohérents}`)
      
      // Vérifier les types de données
      const problematicRows = apiResult.rows.filter(row => 
        row.rap_actuel === null || 
        row.rap_calcule === null || 
        row.difference === null
      )
      
      if (problematicRows.length > 0) {
        console.log(`⚠️ ${problematicRows.length} lignes avec des valeurs null:`)
        problematicRows.slice(0, 3).forEach((row, index) => {
          console.log(`   ${index + 1}. ${row.nom} ${row.prenom}:`)
          console.log(`      - RAP actuel: ${row.rap_actuel} (${typeof row.rap_actuel})`)
          console.log(`      - RAP calculé: ${row.rap_calcule} (${typeof row.rap_calcule})`)
          console.log(`      - Différence: ${row.difference} (${typeof row.difference})`)
        })
      } else {
        console.log('✅ Aucune valeur null détectée')
      }
      
    } catch (error) {
      console.error('❌ Erreur test API GET:', error.message)
    }
    
    console.log('\n🎯 Test de l\'API RAP terminé !')
    console.log('💡 Si des valeurs null sont détectées, l\'interface les gère maintenant avec des valeurs par défaut')
    
  } catch (error) {
    console.error('❌ Erreur test API RAP:', error)
  } finally {
    await pool.end()
  }
}

// Exécuter le test
testRapAPI().catch(console.error)



