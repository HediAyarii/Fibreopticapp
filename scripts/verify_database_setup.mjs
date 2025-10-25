import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function verifyDatabaseSetup() {
  try {
    console.log('🔍 Vérification de la configuration de la base de données...')
    
    // 1. Vérifier les tables essentielles
    console.log('\n📋 1. Vérification des tables essentielles:')
    const essentialTables = [
      'interventions',
      'employes', 
      'carburant_assignations',
      'cout_par_salaire',
      'company_pricing',
      'fixed_costs',
      'variable_costs',
      'cost_categories'
    ]
    
    for (const tableName of essentialTables) {
      try {
        const result = await pool.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        `, [tableName])
        
        const exists = parseInt(result.rows[0].count) > 0
        console.log(`   ${exists ? '✅' : '❌'} ${tableName}: ${exists ? 'EXISTE' : 'MANQUANTE'}`)
      } catch (error) {
        console.log(`   ❌ ${tableName}: ERREUR - ${error.message}`)
      }
    }
    
    // 2. Vérifier les fonctions essentielles
    console.log('\n📋 2. Vérification des fonctions essentielles:')
    const essentialFunctions = [
      'detecter_conflits_assignation',
      'historique_carte',
      'historique_employe',
      'trigger_carburant_mouvement'
    ]
    
    for (const functionName of essentialFunctions) {
      try {
        const result = await pool.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.routines 
          WHERE routine_schema = 'public' 
          AND routine_name = $1
          AND routine_type = 'FUNCTION'
        `, [functionName])
        
        const exists = parseInt(result.rows[0].count) > 0
        console.log(`   ${exists ? '✅' : '❌'} ${functionName}: ${exists ? 'EXISTE' : 'MANQUANTE'}`)
      } catch (error) {
        console.log(`   ❌ ${functionName}: ERREUR - ${error.message}`)
      }
    }
    
    // 3. Vérifier les données de tarifs
    console.log('\n📋 3. Vérification des données de tarifs:')
    try {
      const pricingResult = await pool.query(`
        SELECT 
          company_name,
          COUNT(*) as service_count,
          SUM(prix_base + prix_tech) as total_value
        FROM company_pricing 
        GROUP BY company_name 
        ORDER BY company_name
      `)
      
      if (pricingResult.rows.length > 0) {
        console.log('   ✅ Données de tarifs présentes:')
        pricingResult.rows.forEach(row => {
          console.log(`      - ${row.company_name}: ${row.service_count} services, Total: ${row.total_value}€`)
        })
      } else {
        console.log('   ❌ Aucune donnée de tarifs trouvée')
      }
    } catch (error) {
      console.log(`   ❌ Erreur lors de la vérification des tarifs: ${error.message}`)
    }
    
    // 4. Vérifier les catégories de coûts
    console.log('\n📋 4. Vérification des catégories de coûts:')
    try {
      const categoriesResult = await pool.query(`
        SELECT name, color 
        FROM cost_categories 
        ORDER BY name
      `)
      
      if (categoriesResult.rows.length > 0) {
        console.log('   ✅ Catégories de coûts présentes:')
        categoriesResult.rows.forEach(row => {
          console.log(`      - ${row.name} (${row.color})`)
        })
      } else {
        console.log('   ❌ Aucune catégorie de coûts trouvée')
      }
    } catch (error) {
      console.log(`   ❌ Erreur lors de la vérification des catégories: ${error.message}`)
    }
    
    // 5. Test de la fonction detecter_conflits_assignation
    console.log('\n📋 5. Test de la fonction detecter_conflits_assignation:')
    try {
      const testResult = await pool.query(`
        SELECT * FROM detecter_conflits_assignation(1, 'TEST_CARD_001', '2025-01-01 00:00:00'::timestamp)
      `)
      console.log('   ✅ Fonction detecter_conflits_assignation fonctionne')
      console.log(`      - Résultat: ${JSON.stringify(testResult.rows[0])}`)
    } catch (error) {
      console.log(`   ❌ Erreur lors du test de la fonction: ${error.message}`)
    }
    
    console.log('\n🎯 Vérification terminée !')
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  } finally {
    await pool.end()
  }
}

verifyDatabaseSetup()










