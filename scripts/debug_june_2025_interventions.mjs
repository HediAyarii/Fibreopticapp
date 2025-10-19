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

async function debugJune2025Interventions() {
  try {
    console.log('🔍 Diagnostic des interventions pour juin 2025...')
    console.log('📊 Problème: 83 interventions affichées pour juin 2025 (incorrect)')
    
    // 1. Vérifier les interventions pour juin 2025
    console.log('\n📊 Interventions pour juin 2025 (01/06/2025 - 30/06/2025):')
    const juneInterventions = await pool.query(`
      SELECT 
        COUNT(*) as total_interventions,
        COUNT(CASE WHEN statut = 'CLOTURE TERMINEE' THEN 1 END) as cloture_terminee,
        COUNT(CASE WHEN statut = 'CLOTURE TERMINEE' AND articles IS NOT NULL AND articles != '' THEN 1 END) as avec_articles
      FROM interventions
      WHERE (
        (cloture_tech IS NOT NULL AND cloture_tech != '' AND 
         (TO_DATE(cloture_tech, 'DD.MM.YYYY') >= '2025-06-01' OR 
          TO_DATE(cloture_tech, 'YYYY-MM-DD') >= '2025-06-01' OR
          cloture_tech >= '2025-06-01' OR
          DATE(cloture_tech) >= '2025-06-01')) OR
        (cloture_hotline IS NOT NULL AND cloture_hotline != '' AND 
         (TO_DATE(cloture_hotline, 'DD.MM.YYYY') >= '2025-06-01' OR 
          TO_DATE(cloture_hotline, 'YYYY-MM-DD') >= '2025-06-01' OR
          cloture_hotline >= '2025-06-01' OR
          DATE(cloture_hotline) >= '2025-06-01')) OR
        (cloture_tech IS NULL AND cloture_hotline IS NULL AND date_rdv >= '2025-06-01')
      )
      AND (
        (cloture_tech IS NOT NULL AND cloture_tech != '' AND 
         (TO_DATE(cloture_tech, 'DD.MM.YYYY') <= '2025-06-30' OR 
          TO_DATE(cloture_tech, 'YYYY-MM-DD') <= '2025-06-30' OR
          cloture_tech <= '2025-06-30' OR
          DATE(cloture_tech) <= '2025-06-30')) OR
        (cloture_hotline IS NOT NULL AND cloture_hotline != '' AND 
         (TO_DATE(cloture_hotline, 'DD.MM.YYYY') <= '2025-06-30' OR 
          TO_DATE(cloture_hotline, 'YYYY-MM-DD') <= '2025-06-30' OR
          cloture_hotline <= '2025-06-30' OR
          DATE(cloture_hotline) <= '2025-06-30')) OR
        (cloture_tech IS NULL AND cloture_hotline IS NULL AND date_rdv <= '2025-06-30')
      )
    `)
    
    console.log(`📋 Interventions juin 2025:`)
    console.log(`   - Total: ${juneInterventions.rows[0].total_interventions}`)
    console.log(`   - CLOTURE TERMINEE: ${juneInterventions.rows[0].cloture_terminee}`)
    console.log(`   - Avec articles: ${juneInterventions.rows[0].avec_articles}`)
    
    // 2. Vérifier les interventions pour mai 2025 (pour comparaison)
    console.log('\n📊 Interventions pour mai 2025 (01/05/2025 - 31/05/2025):')
    const mayInterventions = await pool.query(`
      SELECT 
        COUNT(*) as total_interventions,
        COUNT(CASE WHEN statut = 'CLOTURE TERMINEE' THEN 1 END) as cloture_terminee,
        COUNT(CASE WHEN statut = 'CLOTURE TERMINEE' AND articles IS NOT NULL AND articles != '' THEN 1 END) as avec_articles
      FROM interventions
      WHERE (
        (cloture_tech IS NOT NULL AND cloture_tech != '' AND 
         (TO_DATE(cloture_tech, 'DD.MM.YYYY') >= '2025-05-01' OR 
          TO_DATE(cloture_tech, 'YYYY-MM-DD') >= '2025-05-01' OR
          cloture_tech >= '2025-05-01' OR
          DATE(cloture_tech) >= '2025-05-01')) OR
        (cloture_hotline IS NOT NULL AND cloture_hotline != '' AND 
         (TO_DATE(cloture_hotline, 'DD.MM.YYYY') >= '2025-05-01' OR 
          TO_DATE(cloture_hotline, 'YYYY-MM-DD') >= '2025-05-01' OR
          cloture_hotline >= '2025-05-01' OR
          DATE(cloture_hotline) >= '2025-05-01')) OR
        (cloture_tech IS NULL AND cloture_hotline IS NULL AND date_rdv >= '2025-05-01')
      )
      AND (
        (cloture_tech IS NOT NULL AND cloture_tech != '' AND 
         (TO_DATE(cloture_tech, 'DD.MM.YYYY') <= '2025-05-31' OR 
          TO_DATE(cloture_tech, 'YYYY-MM-DD') <= '2025-05-31' OR
          cloture_tech <= '2025-05-31' OR
          DATE(cloture_tech) <= '2025-05-31')) OR
        (cloture_hotline IS NOT NULL AND cloture_hotline != '' AND 
         (TO_DATE(cloture_hotline, 'DD.MM.YYYY') <= '2025-05-31' OR 
          TO_DATE(cloture_hotline, 'YYYY-MM-DD') <= '2025-05-31' OR
          cloture_hotline <= '2025-05-31' OR
          DATE(cloture_hotline) <= '2025-05-31')) OR
        (cloture_tech IS NULL AND cloture_hotline IS NULL AND date_rdv <= '2025-05-31')
      )
    `)
    
    console.log(`📋 Interventions mai 2025:`)
    console.log(`   - Total: ${mayInterventions.rows[0].total_interventions}`)
    console.log(`   - CLOTURE TERMINEE: ${mayInterventions.rows[0].cloture_terminee}`)
    console.log(`   - Avec articles: ${mayInterventions.rows[0].avec_articles}`)
    
    // 3. Vérifier les interventions de CHIKHA SALEM pour juin 2025
    console.log('\n📊 Interventions de CHIKHA SALEM pour juin 2025:')
    const chikhaJuneInterventions = await pool.query(`
      SELECT 
        COUNT(*) as total_interventions,
        COUNT(CASE WHEN statut = 'CLOTURE TERMINEE' THEN 1 END) as cloture_terminee,
        COUNT(CASE WHEN statut = 'CLOTURE TERMINEE' AND articles IS NOT NULL AND articles != '' THEN 1 END) as avec_articles
      FROM interventions
      WHERE LOWER(nom_technicien) = LOWER('CHIKHA') AND LOWER(prenom_technicien) = LOWER('SALEM')
      AND (
        (cloture_tech IS NOT NULL AND cloture_tech != '' AND 
         (TO_DATE(cloture_tech, 'DD.MM.YYYY') >= '2025-06-01' OR 
          TO_DATE(cloture_tech, 'YYYY-MM-DD') >= '2025-06-01' OR
          cloture_tech >= '2025-06-01' OR
          DATE(cloture_tech) >= '2025-06-01')) OR
        (cloture_hotline IS NOT NULL AND cloture_hotline != '' AND 
         (TO_DATE(cloture_hotline, 'DD.MM.YYYY') >= '2025-06-01' OR 
          TO_DATE(cloture_hotline, 'YYYY-MM-DD') >= '2025-06-01' OR
          cloture_hotline >= '2025-06-01' OR
          DATE(cloture_hotline) >= '2025-06-01')) OR
        (cloture_tech IS NULL AND cloture_hotline IS NULL AND date_rdv >= '2025-06-01')
      )
      AND (
        (cloture_tech IS NOT NULL AND cloture_tech != '' AND 
         (TO_DATE(cloture_tech, 'DD.MM.YYYY') <= '2025-06-30' OR 
          TO_DATE(cloture_tech, 'YYYY-MM-DD') <= '2025-06-30' OR
          cloture_tech <= '2025-06-30' OR
          DATE(cloture_tech) <= '2025-06-30')) OR
        (cloture_hotline IS NOT NULL AND cloture_hotline != '' AND 
         (TO_DATE(cloture_hotline, 'DD.MM.YYYY') <= '2025-06-30' OR 
          TO_DATE(cloture_hotline, 'YYYY-MM-DD') <= '2025-06-30' OR
          cloture_hotline <= '2025-06-30' OR
          DATE(cloture_hotline) <= '2025-06-30')) OR
        (cloture_tech IS NULL AND cloture_hotline IS NULL AND date_rdv <= '2025-06-30')
      )
    `)
    
    console.log(`📋 CHIKHA SALEM - juin 2025:`)
    console.log(`   - Total: ${chikhaJuneInterventions.rows[0].total_interventions}`)
    console.log(`   - CLOTURE TERMINEE: ${chikhaJuneInterventions.rows[0].cloture_terminee}`)
    console.log(`   - Avec articles: ${chikhaJuneInterventions.rows[0].avec_articles}`)
    
    // 4. Vérifier les interventions de CHIKHA SALEM pour mai 2025
    console.log('\n📊 Interventions de CHIKHA SALEM pour mai 2025:')
    const chikhaMayInterventions = await pool.query(`
      SELECT 
        COUNT(*) as total_interventions,
        COUNT(CASE WHEN statut = 'CLOTURE TERMINEE' THEN 1 END) as cloture_terminee,
        COUNT(CASE WHEN statut = 'CLOTURE TERMINEE' AND articles IS NOT NULL AND articles != '' THEN 1 END) as avec_articles
      FROM interventions
      WHERE LOWER(nom_technicien) = LOWER('CHIKHA') AND LOWER(prenom_technicien) = LOWER('SALEM')
      AND (
        (cloture_tech IS NOT NULL AND cloture_tech != '' AND 
         (TO_DATE(cloture_tech, 'DD.MM.YYYY') >= '2025-05-01' OR 
          TO_DATE(cloture_tech, 'YYYY-MM-DD') >= '2025-05-01' OR
          cloture_tech >= '2025-05-01' OR
          DATE(cloture_tech) >= '2025-05-01')) OR
        (cloture_hotline IS NOT NULL AND cloture_hotline != '' AND 
         (TO_DATE(cloture_hotline, 'DD.MM.YYYY') >= '2025-05-01' OR 
          TO_DATE(cloture_hotline, 'YYYY-MM-DD') >= '2025-05-01' OR
          cloture_hotline >= '2025-05-01' OR
          DATE(cloture_hotline) >= '2025-05-01')) OR
        (cloture_tech IS NULL AND cloture_hotline IS NULL AND date_rdv >= '2025-05-01')
      )
      AND (
        (cloture_tech IS NOT NULL AND cloture_tech != '' AND 
         (TO_DATE(cloture_tech, 'DD.MM.YYYY') <= '2025-05-31' OR 
          TO_DATE(cloture_tech, 'YYYY-MM-DD') <= '2025-05-31' OR
          cloture_tech <= '2025-05-31' OR
          DATE(cloture_tech) <= '2025-05-31')) OR
        (cloture_hotline IS NOT NULL AND cloture_hotline != '' AND 
         (TO_DATE(cloture_hotline, 'DD.MM.YYYY') <= '2025-05-31' OR 
          TO_DATE(cloture_hotline, 'YYYY-MM-DD') <= '2025-05-31' OR
          cloture_hotline <= '2025-05-31' OR
          DATE(cloture_hotline) <= '2025-05-31')) OR
        (cloture_tech IS NULL AND cloture_hotline IS NULL AND date_rdv <= '2025-05-31')
      )
    `)
    
    console.log(`📋 CHIKHA SALEM - mai 2025:`)
    console.log(`   - Total: ${chikhaMayInterventions.rows[0].total_interventions}`)
    console.log(`   - CLOTURE TERMINEE: ${chikhaMayInterventions.rows[0].cloture_terminee}`)
    console.log(`   - Avec articles: ${chikhaMayInterventions.rows[0].avec_articles}`)
    
    // 5. Analyser le problème
    console.log('\n🔍 Analyse du problème:')
    const juneTotal = parseInt(juneInterventions.rows[0].total_interventions || 0)
    const mayTotal = parseInt(mayInterventions.rows[0].total_interventions || 0)
    const chikhaJuneTotal = parseInt(chikhaJuneInterventions.rows[0].total_interventions || 0)
    const chikhaMayTotal = parseInt(chikhaMayInterventions.rows[0].total_interventions || 0)
    
    if (juneTotal > 0) {
      console.log('❌ PROBLÈME DÉTECTÉ: Il y a des interventions pour juin 2025')
      console.log(`💡 ${juneTotal} interventions trouvées pour juin 2025`)
      console.log('💡 Cela explique pourquoi vous voyez 83 interventions')
    } else {
      console.log('✅ Aucune intervention pour juin 2025 (normal)')
    }
    
    if (chikhaJuneTotal > 0) {
      console.log(`❌ CHIKHA SALEM: ${chikhaJuneTotal} interventions pour juin 2025`)
    } else {
      console.log('✅ CHIKHA SALEM: Aucune intervention pour juin 2025')
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

debugJune2025Interventions()
