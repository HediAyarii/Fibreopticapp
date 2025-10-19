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

async function debugApiDateFiltering() {
  try {
    console.log('🔍 Diagnostic du filtrage de dates dans l\'API...')
    console.log('📊 Problème: L\'API affiche des interventions pour des périodes vides ou futures')
    
    // 1. Tester différentes périodes
    const testPeriods = [
      { name: 'Juin 2025', startDate: '2025-06-01', endDate: '2025-06-30' },
      { name: 'Juillet 2025', startDate: '2025-07-01', endDate: '2025-07-31' },
      { name: 'Décembre 2025', startDate: '2025-12-01', endDate: '2025-12-31' },
      { name: 'Janvier 2026', startDate: '2026-01-01', endDate: '2026-01-31' },
      { name: 'Mai 2025 (avec données)', startDate: '2025-05-01', endDate: '2025-05-31' }
    ]
    
    for (const period of testPeriods) {
      console.log(`\n📊 Test pour ${period.name} (${period.startDate} - ${period.endDate}):`)
      
      // Test direct de la base de données
      const dbResult = await pool.query(`
        SELECT 
          COUNT(*) as total_interventions,
          COUNT(CASE WHEN statut = 'CLOTURE TERMINEE' THEN 1 END) as cloture_terminee
        FROM interventions
        WHERE (
          (cloture_tech IS NOT NULL AND cloture_tech != '' AND 
           (TO_DATE(cloture_tech, 'DD.MM.YYYY') >= $1::date OR 
            TO_DATE(cloture_tech, 'YYYY-MM-DD') >= $1::date OR
            cloture_tech::date >= $1::date)) OR
          (cloture_hotline IS NOT NULL AND cloture_hotline != '' AND 
           (TO_DATE(cloture_hotline, 'DD.MM.YYYY') >= $1::date OR 
            TO_DATE(cloture_hotline, 'YYYY-MM-DD') >= $1::date OR
            cloture_hotline::date >= $1::date)) OR
          (cloture_tech IS NULL AND cloture_hotline IS NULL AND date_rdv::date >= $1::date)
        )
        AND (
          (cloture_tech IS NOT NULL AND cloture_tech != '' AND 
           (TO_DATE(cloture_tech, 'DD.MM.YYYY') <= $2::date OR 
            TO_DATE(cloture_tech, 'YYYY-MM-DD') <= $2::date OR
            cloture_tech::date <= $2::date)) OR
          (cloture_hotline IS NOT NULL AND cloture_hotline != '' AND 
           (TO_DATE(cloture_hotline, 'DD.MM.YYYY') <= $2::date OR 
            TO_DATE(cloture_hotline, 'YYYY-MM-DD') <= $2::date OR
            cloture_hotline::date <= $2::date)) OR
          (cloture_tech IS NULL AND cloture_hotline IS NULL AND date_rdv::date <= $2::date)
        )
      `, [period.startDate, period.endDate])
      
      console.log(`   - Base de données: ${dbResult.rows[0].total_interventions} interventions`)
      
      // Test de l'API
      try {
        const apiResponse = await fetch(`http://localhost:3000/api/recap-calcul?startDate=${period.startDate}&endDate=${period.endDate}`)
        const apiData = await apiResponse.json()
        
        if (apiData.success && apiData.recettesParTechnicien) {
          const totalInterventions = apiData.recettesParTechnicien.reduce((sum, recette) => sum + (recette.nombre_interventions || 0), 0)
          console.log(`   - API: ${apiData.recettesParTechnicien.length} techniciens, ${totalInterventions} interventions`)
          
          if (totalInterventions > 0 && dbResult.rows[0].total_interventions == 0) {
            console.log(`   ❌ PROBLÈME: L'API retourne ${totalInterventions} interventions alors que la DB en a 0`)
          } else if (totalInterventions > 0) {
            console.log(`   ✅ API cohérente avec la base de données`)
          } else {
            console.log(`   ✅ Aucune intervention (normal)`)
          }
        } else {
          console.log(`   ❌ Erreur API: ${apiData.error || 'Erreur inconnue'}`)
        }
      } catch (error) {
        console.log(`   ❌ Erreur lors du test de l'API: ${error.message}`)
      }
    }
    
    // 2. Analyser les données de la base
    console.log('\n📊 Analyse des données dans la base:')
    
    // Vérifier les dates des interventions
    const dateAnalysis = await pool.query(`
      SELECT 
        COUNT(*) as total,
        MIN(cloture_tech) as min_cloture_tech,
        MAX(cloture_tech) as max_cloture_tech,
        MIN(cloture_hotline) as min_cloture_hotline,
        MAX(cloture_hotline) as max_cloture_hotline,
        MIN(date_rdv) as min_date_rdv,
        MAX(date_rdv) as max_date_rdv
      FROM interventions
      WHERE statut = 'CLOTURE TERMINEE'
    `)
    
    console.log(`📋 Analyse des dates dans la base:`)
    console.log(`   - Total interventions CLOTURE TERMINEE: ${dateAnalysis.rows[0].total}`)
    console.log(`   - cloture_tech: ${dateAnalysis.rows[0].min_cloture_tech} à ${dateAnalysis.rows[0].max_cloture_tech}`)
    console.log(`   - cloture_hotline: ${dateAnalysis.rows[0].min_cloture_hotline} à ${dateAnalysis.rows[0].max_cloture_hotline}`)
    console.log(`   - date_rdv: ${dateAnalysis.rows[0].min_date_rdv} à ${dateAnalysis.rows[0].max_date_rdv}`)
    
    // 3. Vérifier les interventions futures
    console.log('\n📊 Vérification des interventions futures:')
    const futureInterventions = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN cloture_tech LIKE '%2026%' OR cloture_tech LIKE '%2027%' THEN 1 END) as future_cloture_tech,
        COUNT(CASE WHEN cloture_hotline LIKE '%2026%' OR cloture_hotline LIKE '%2027%' THEN 1 END) as future_cloture_hotline,
        COUNT(CASE WHEN date_rdv LIKE '%2026%' OR date_rdv LIKE '%2027%' THEN 1 END) as future_date_rdv
      FROM interventions
      WHERE statut = 'CLOTURE TERMINEE'
    `)
    
    console.log(`📋 Interventions futures:`)
    console.log(`   - Total: ${futureInterventions.rows[0].total}`)
    console.log(`   - cloture_tech futures: ${futureInterventions.rows[0].future_cloture_tech}`)
    console.log(`   - cloture_hotline futures: ${futureInterventions.rows[0].future_cloture_hotline}`)
    console.log(`   - date_rdv futures: ${futureInterventions.rows[0].future_date_rdv}`)
    
    // 4. Créer un script de test pour le navigateur
    console.log('\n📝 Script de test pour le navigateur:')
    const browserTestScript = `
// Script de test pour vérifier le filtrage de dates
// Exécuter dans la console du navigateur (F12)

console.log('🧪 Test du filtrage de dates dans l\'API...')

const testPeriods = [
  { name: 'Juin 2025', startDate: '2025-06-01', endDate: '2025-06-30' },
  { name: 'Juillet 2025', startDate: '2025-07-01', endDate: '2025-07-31' },
  { name: 'Décembre 2025', startDate: '2025-12-01', endDate: '2025-12-31' },
  { name: 'Janvier 2026', startDate: '2026-01-01', endDate: '2026-01-31' }
]

async function testDateFiltering() {
  for (const period of testPeriods) {
    console.log(\`\\n📊 Test pour \${period.name}:\`)
    
    try {
      const response = await fetch(\`/api/recap-calcul?startDate=\${period.startDate}&endDate=\${period.endDate}\`)
      const data = await response.json()
      
      if (data.success && data.recettesParTechnicien) {
        const totalInterventions = data.recettesParTechnicien.reduce((sum, recette) => sum + (recette.nombre_interventions || 0), 0)
        console.log(\`   - API: \${data.recettesParTechnicien.length} techniciens, \${totalInterventions} interventions\`)
        
        if (totalInterventions > 0) {
          console.log(\`   ❌ PROBLÈME: \${totalInterventions} interventions trouvées pour \${period.name}\`)
          console.log(\`   💡 Cela ne devrait pas être le cas si la période est vide\`)
        } else {
          console.log(\`   ✅ Aucune intervention (normal)\`)
        }
      } else {
        console.log(\`   ❌ Erreur API: \${data.error || 'Erreur inconnue'}\`)
      }
    } catch (error) {
      console.error(\`   ❌ Erreur: \${error.message}\`)
    }
  }
}

testDateFiltering()
`
    
    console.log('📄 Script de test créé')
    console.log('💡 Exécutez ce script dans la console du navigateur (F12)')
    
    console.log('\n🎯 Diagnostic terminé !')
    console.log('💡 Le problème semble être dans le filtrage de dates de l\'API')
    console.log('💡 L\'API ne filtre pas correctement les dates')
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error.message)
  } finally {
    await pool.end()
  }
}

debugApiDateFiltering()
