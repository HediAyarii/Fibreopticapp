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

async function simpleJuneCheck() {
  try {
    console.log('🔍 Vérification simple pour juin 2025...')
    console.log('📊 Problème: 83 interventions affichées pour juin 2025 (incorrect)')
    
    // 1. Vérifier les interventions de CHIKHA SALEM pour juin 2025 (approche simple)
    console.log('\n📊 CHIKHA SALEM - Interventions pour juin 2025:')
    const chikhaJuneSimple = await pool.query(`
      SELECT 
        COUNT(*) as total_interventions,
        COUNT(CASE WHEN statut = 'CLOTURE TERMINEE' THEN 1 END) as cloture_terminee
      FROM interventions
      WHERE LOWER(nom_technicien) = LOWER('CHIKHA') 
        AND LOWER(prenom_technicien) = LOWER('SALEM')
        AND (
          (cloture_tech LIKE '%06.2025%' OR cloture_tech LIKE '%2025-06%') OR
          (cloture_hotline LIKE '%06.2025%' OR cloture_hotline LIKE '%2025-06%') OR
          (date_rdv LIKE '%06.2025%' OR date_rdv LIKE '%2025-06%')
        )
    `)
    
    console.log(`📋 CHIKHA SALEM - juin 2025 (approche simple):`)
    console.log(`   - Total: ${chikhaJuneSimple.rows[0].total_interventions}`)
    console.log(`   - CLOTURE TERMINEE: ${chikhaJuneSimple.rows[0].cloture_terminee}`)
    
    // 2. Vérifier les interventions de CHIKHA SALEM pour mai 2025
    console.log('\n📊 CHIKHA SALEM - Interventions pour mai 2025:')
    const chikhaMaySimple = await pool.query(`
      SELECT 
        COUNT(*) as total_interventions,
        COUNT(CASE WHEN statut = 'CLOTURE TERMINEE' THEN 1 END) as cloture_terminee
      FROM interventions
      WHERE LOWER(nom_technicien) = LOWER('CHIKHA') 
        AND LOWER(prenom_technicien) = LOWER('SALEM')
        AND (
          (cloture_tech LIKE '%05.2025%' OR cloture_tech LIKE '%2025-05%') OR
          (cloture_hotline LIKE '%05.2025%' OR cloture_hotline LIKE '%2025-05%') OR
          (date_rdv LIKE '%05.2025%' OR date_rdv LIKE '%2025-05%')
        )
    `)
    
    console.log(`📋 CHIKHA SALEM - mai 2025 (approche simple):`)
    console.log(`   - Total: ${chikhaMaySimple.rows[0].total_interventions}`)
    console.log(`   - CLOTURE TERMINEE: ${chikhaMaySimple.rows[0].cloture_terminee}`)
    
    // 3. Vérifier toutes les interventions pour juin 2025
    console.log('\n📊 Toutes les interventions pour juin 2025:')
    const allJuneSimple = await pool.query(`
      SELECT 
        COUNT(*) as total_interventions,
        COUNT(CASE WHEN statut = 'CLOTURE TERMINEE' THEN 1 END) as cloture_terminee
      FROM interventions
      WHERE (
        (cloture_tech LIKE '%06.2025%' OR cloture_tech LIKE '%2025-06%') OR
        (cloture_hotline LIKE '%06.2025%' OR cloture_hotline LIKE '%2025-06%') OR
        (date_rdv LIKE '%06.2025%' OR date_rdv LIKE '%2025-06%')
      )
    `)
    
    console.log(`📋 Toutes les interventions - juin 2025:`)
    console.log(`   - Total: ${allJuneSimple.rows[0].total_interventions}`)
    console.log(`   - CLOTURE TERMINEE: ${allJuneSimple.rows[0].cloture_terminee}`)
    
    // 4. Vérifier toutes les interventions pour mai 2025
    console.log('\n📊 Toutes les interventions pour mai 2025:')
    const allMaySimple = await pool.query(`
      SELECT 
        COUNT(*) as total_interventions,
        COUNT(CASE WHEN statut = 'CLOTURE TERMINEE' THEN 1 END) as cloture_terminee
      FROM interventions
      WHERE (
        (cloture_tech LIKE '%05.2025%' OR cloture_tech LIKE '%2025-05%') OR
        (cloture_hotline LIKE '%05.2025%' OR cloture_hotline LIKE '%2025-05%') OR
        (date_rdv LIKE '%05.2025%' OR date_rdv LIKE '%2025-05%')
      )
    `)
    
    console.log(`📋 Toutes les interventions - mai 2025:`)
    console.log(`   - Total: ${allMaySimple.rows[0].total_interventions}`)
    console.log(`   - CLOTURE TERMINEE: ${allMaySimple.rows[0].cloture_terminee}`)
    
    // 5. Analyser le problème
    console.log('\n🔍 Analyse du problème:')
    const chikhaJuneTotal = parseInt(chikhaJuneSimple.rows[0].total_interventions || 0)
    const chikhaMayTotal = parseInt(chikhaMaySimple.rows[0].total_interventions || 0)
    const allJuneTotal = parseInt(allJuneSimple.rows[0].total_interventions || 0)
    const allMayTotal = parseInt(allMaySimple.rows[0].total_interventions || 0)
    
    console.log(`📊 Résumé:`)
    console.log(`   - CHIKHA SALEM - juin 2025: ${chikhaJuneTotal} interventions`)
    console.log(`   - CHIKHA SALEM - mai 2025: ${chikhaMayTotal} interventions`)
    console.log(`   - Toutes - juin 2025: ${allJuneTotal} interventions`)
    console.log(`   - Toutes - mai 2025: ${allMayTotal} interventions`)
    
    if (chikhaJuneTotal > 0) {
      console.log('❌ PROBLÈME DÉTECTÉ: CHIKHA SALEM a des interventions pour juin 2025')
      console.log(`💡 ${chikhaJuneTotal} interventions trouvées pour juin 2025`)
      console.log('💡 Cela explique pourquoi vous voyez 83 interventions')
    } else {
      console.log('✅ CHIKHA SALEM: Aucune intervention pour juin 2025 (normal)')
    }
    
    if (allJuneTotal > 0) {
      console.log(`❌ PROBLÈME GÉNÉRAL: ${allJuneTotal} interventions trouvées pour juin 2025`)
      console.log('💡 Il y a des données pour juin 2025 dans la base')
    } else {
      console.log('✅ Aucune intervention pour juin 2025 (normal)')
    }
    
    if (chikhaMayTotal > 0) {
      console.log(`✅ CHIKHA SALEM: ${chikhaMayTotal} interventions pour mai 2025 (données synchronisées)`)
    }
    
    // 6. Créer un script de test pour le navigateur
    console.log('\n📝 Script de test pour le navigateur:')
    const browserTestScript = `
// Script de test pour vérifier les interventions juin 2025
// Exécuter dans la console du navigateur (F12)

console.log('🧪 Test des interventions pour juin 2025...')

// Test 1: Vérifier l'API recap-calcul pour juin 2025
fetch('/api/recap-calcul?startDate=2025-06-01&endDate=2025-06-30')
  .then(response => response.json())
  .then(data => {
    console.log('📊 API recap-calcul pour juin 2025:', data)
    
    if (data.success && data.recettesParTechnicien) {
      const chikhaSalem = data.recettesParTechnicien.find(recette => 
        recette.employe_nom.toLowerCase() === 'chikha' && recette.employe_prenom.toLowerCase() === 'salem'
      )
      
      if (chikhaSalem) {
        console.log('✅ CHIKHA SALEM trouvé pour juin 2025:')
        console.log(\`   - Recette Technicien: \${chikhaSalem.total_recette_technicien}€\`)
        console.log(\`   - Nombre d'interventions: \${chikhaSalem.nombre_interventions}\`)
        
        if (chikhaSalem.nombre_interventions > 0) {
          console.log('❌ PROBLÈME: CHIKHA SALEM a des interventions pour juin 2025')
          console.log('💡 Cela ne devrait pas être le cas si les données sont pour mai 2025')
        } else {
          console.log('✅ CHIKHA SALEM: Aucune intervention pour juin 2025 (normal)')
        }
      } else {
        console.log('✅ CHIKHA SALEM: Non trouvé pour juin 2025 (normal)')
      }
    }
  })
  .catch(error => {
    console.error('❌ Erreur API recap-calcul:', error)
  })

// Test 2: Vérifier l'API cout-par-salaire pour juin 2025
fetch('/api/cout-par-salaire?mois=6&annee=2025')
  .then(response => response.json())
  .then(data => {
    console.log('📊 API cout-par-salaire pour juin 2025:', data)
    
    if (data.success && data.couts) {
      const chikhaSalem = data.couts.find(cout => 
        cout.nom.toLowerCase() === 'chikha' && cout.prenom.toLowerCase() === 'salem'
      )
      
      if (chikhaSalem) {
        console.log('✅ CHIKHA SALEM trouvé dans cout-par-salaire pour juin 2025:')
        console.log(\`   - Total Généré: \${chikhaSalem.total_genere}€\`)
      } else {
        console.log('✅ CHIKHA SALEM: Non trouvé dans cout-par-salaire pour juin 2025 (normal)')
      }
    }
  })
  .catch(error => {
    console.error('❌ Erreur API cout-par-salaire:', error)
  })
`
    
    console.log('📄 Script de test créé')
    console.log('💡 Exécutez ce script dans la console du navigateur (F12)')
    
    console.log('\n🎯 Diagnostic terminé !')
    console.log('💡 Le problème semble être que l\'API récupère des données d\'autres mois')
    console.log('💡 Vérifiez que vous utilisez les bonnes dates dans l\'interface')
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error.message)
  } finally {
    await pool.end()
  }
}

simpleJuneCheck()
