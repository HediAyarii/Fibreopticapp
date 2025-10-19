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

async function debugMissingTechnicians() {
  try {
    console.log('🔍 Diagnostic des techniciens manquants...')
    console.log('📊 Problème: Seuls 8 techniciens apparaissent au lieu de 18')
    
    // 1. Vérifier tous les techniciens dans cout_par_salaire
    console.log('\n📊 Tous les techniciens dans cout_par_salaire:')
    const allTechnicians = await pool.query(`
      SELECT 
        id, nom, prenom, matricule, total_genere, rap, updated_at
      FROM cout_par_salaire 
      WHERE mois = 5 AND annee = 2025
      ORDER BY total_genere DESC
    `)
    
    console.log(`📋 ${allTechnicians.rows.length} techniciens dans la base:`)
    allTechnicians.rows.forEach((row, index) => {
      const status = row.total_genere > 0 ? '✅' : '❌'
      console.log(`${index + 1}. ${status} ${row.nom} ${row.prenom} (${row.matricule}) - ${row.total_genere}€`)
    })
    
    // 2. Tester l'API directement
    console.log('\n🔧 Test de l\'API cout-par-salaire:')
    try {
      const apiResponse = await fetch('http://localhost:3000/api/cout-par-salaire?mois=5&annee=2025')
      const apiData = await apiResponse.json()
      
      if (apiData.success && apiData.couts) {
        console.log(`📊 API retourne ${apiData.couts.length} techniciens:`)
        const withRevenue = apiData.couts.filter(cout => cout.total_genere > 0)
        const withoutRevenue = apiData.couts.filter(cout => cout.total_genere === 0)
        
        console.log(`📈 Avec revenus: ${withRevenue.length}`)
        console.log(`📉 Sans revenus: ${withoutRevenue.length}`)
        
        console.log('\n📋 Techniciens avec revenus dans l\'API:')
        withRevenue.forEach((cout, index) => {
          console.log(`${index + 1}. ${cout.nom} ${cout.prenom} (${cout.matricule}) - ${cout.total_genere}€`)
        })
        
        console.log('\n📋 Techniciens sans revenus dans l\'API:')
        withoutRevenue.forEach((cout, index) => {
          console.log(`${index + 1}. ${cout.nom} ${cout.prenom} (${cout.matricule}) - ${cout.total_genere}€`)
        })
        
        // Comparer avec la base de données
        console.log('\n🔍 Comparaison API vs Base de données:')
        const apiMap = new Map()
        apiData.couts.forEach(cout => {
          const key = `${cout.nom}_${cout.prenom}`.toLowerCase()
          apiMap.set(key, cout)
        })
        
        const dbMap = new Map()
        allTechnicians.rows.forEach(row => {
          const key = `${row.nom}_${row.prenom}`.toLowerCase()
          dbMap.set(key, row)
        })
        
        console.log('\n📊 Techniciens manquants dans l\'API:')
        let missingCount = 0
        for (const [key, dbRow] of dbMap) {
          if (!apiMap.has(key)) {
            console.log(`❌ ${dbRow.nom} ${dbRow.prenom} (${dbRow.matricule}) - ${dbRow.total_genere}€`)
            missingCount++
          }
        }
        
        console.log(`\n📊 ${missingCount} techniciens manquants dans l'API`)
        
        if (missingCount > 0) {
          console.log('\n🔧 Problème identifié: L\'API ne retourne pas tous les techniciens')
          console.log('💡 Solutions possibles:')
          console.log('   1. Problème de cache de l\'API')
          console.log('   2. Problème de requête SQL dans l\'API')
          console.log('   3. Problème de correspondance des noms')
        }
        
      } else {
        console.log('❌ Erreur API:', apiData.error)
      }
    } catch (error) {
      console.log('❌ Erreur lors du test de l\'API:', error.message)
    }
    
    // 3. Vérifier les techniciens avec total_genere = 0
    console.log('\n📊 Techniciens avec total_genere = 0:')
    const zeroRevenueTechnicians = allTechnicians.rows.filter(row => row.total_genere === 0)
    
    if (zeroRevenueTechnicians.length > 0) {
      console.log(`📋 ${zeroRevenueTechnicians.length} techniciens sans revenus:`)
      zeroRevenueTechnicians.forEach((row, index) => {
        console.log(`${index + 1}. ${row.nom} ${row.prenom} (${row.matricule}) - ${row.total_genere}€`)
      })
      
      console.log('\n🔍 Analyse des techniciens sans revenus:')
      for (const technician of zeroRevenueTechnicians) {
        console.log(`\n📊 Analyse pour ${technician.nom} ${technician.prenom}:`)
        
        // Vérifier s'il y a des interventions pour ce technicien
        const interventionsResult = await pool.query(`
          SELECT COUNT(*) as total_interventions
          FROM interventions
          WHERE LOWER(nom_technicien) = LOWER($1) AND LOWER(prenom_technicien) = LOWER($2)
          AND statut = 'CLOTURE TERMINEE'
          AND articles IS NOT NULL 
          AND articles != ''
        `, [technician.nom, technician.prenom])
        
        const totalInterventions = parseInt(interventionsResult.rows[0].total_interventions || 0)
        console.log(`   - Interventions CLOTURE TERMINEE: ${totalInterventions}`)
        
        if (totalInterventions > 0) {
          console.log(`   ❌ Problème: ${totalInterventions} interventions mais total_genere = 0€`)
          console.log(`   💡 Ce technicien devrait avoir des revenus`)
        } else {
          console.log(`   ✅ Pas d'interventions, donc pas de revenus (normal)`)
        }
      }
    }
    
    // 4. Créer un script de test pour le navigateur
    console.log('\n📝 Script de test pour le navigateur:')
    const browserTestScript = `
// Script de test pour diagnostiquer les techniciens manquants
// Exécuter dans la console du navigateur (F12)

console.log('🧪 Test des techniciens manquants...')

fetch('/api/cout-par-salaire?mois=5&annee=2025')
  .then(response => response.json())
  .then(data => {
    console.log('📊 Données reçues:', data)
    
    if (data.success && data.couts) {
      const withRevenue = data.couts.filter(cout => cout.total_genere > 0)
      const withoutRevenue = data.couts.filter(cout => cout.total_genere === 0)
      
      console.log(\`📈 Techniciens avec revenus: \${withRevenue.length}\`)
      console.log(\`📉 Techniciens sans revenus: \${withoutRevenue.length}\`)
      
      console.log('📋 Techniciens avec revenus:')
      withRevenue.forEach(cout => {
        console.log(\`   - \${cout.nom} \${cout.prenom}: \${cout.total_genere}€\`)
      })
      
      console.log('📋 Techniciens sans revenus:')
      withoutRevenue.forEach(cout => {
        console.log(\`   - \${cout.nom} \${cout.prenom}: \${cout.total_genere}€\`)
      })
      
      if (withRevenue.length < 18) {
        console.log('❌ Problème: Moins de 18 techniciens avec revenus')
        console.log('💡 Certains techniciens ne sont pas retournés par l\'API')
      } else {
        console.log('✅ Tous les techniciens sont retournés par l\'API')
      }
    } else {
      console.log('❌ Erreur API:', data.error)
    }
  })
  .catch(error => {
    console.error('❌ Erreur réseau:', error)
  })
`
    
    console.log('📄 Script de test créé')
    console.log('💡 Exécutez ce script dans la console du navigateur (F12)')
    
    console.log('\n🎯 Diagnostic terminé !')
    console.log('💡 Le problème semble être que l\'API ne retourne pas tous les techniciens')
    console.log('💡 Certains techniciens ont total_genere = 0€ dans la base de données')
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error.message)
  } finally {
    await pool.end()
  }
}

debugMissingTechnicians()
