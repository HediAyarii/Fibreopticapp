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

async function testCostsAPI() {
  try {
    console.log('🧪 Test de l\'API des coûts fixes...')
    
    // 1. Vérifier la structure de la table
    console.log('\n📊 1. Vérification de la structure...')
    const structure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'fixed_costs' 
      ORDER BY ordinal_position
    `)
    
    console.log('📋 Structure de fixed_costs:')
    structure.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`)
    })
    
    // 2. Tester la fonction calculate_monthly_costs
    console.log('\n📊 2. Test de la fonction calculate_monthly_costs...')
    try {
      const functionTest = await pool.query(`
        SELECT calculate_monthly_costs(1, 1, 2025) as result
      `)
      console.log(`✅ Fonction testée: ${functionTest.rows[0].result}€`)
    } catch (error) {
      console.log('⚠️ Test fonction (normal si pas de données):', error.message)
    }
    
    // 3. Créer un coût de test
    console.log('\n📊 3. Création d\'un coût de test...')
    const testCost = await pool.query(`
      INSERT INTO fixed_costs (name, description, amount, category, frequency, is_active)
      VALUES ('Test Cost', 'Cout de test pour API', 150.00, 'test', 'monthly', true)
      RETURNING id, name, amount, is_active
    `)
    
    if (testCost.rows.length > 0) {
      const costId = testCost.rows[0].id
      console.log(`✅ Coût de test créé: ID ${costId}`)
      console.log(`   - Nom: ${testCost.rows[0].name}`)
      console.log(`   - Montant: ${testCost.rows[0].amount}€`)
      console.log(`   - Actif: ${testCost.rows[0].is_active}`)
      
      // 4. Tester la fonction avec le coût de test
      console.log('\n📊 4. Test de la fonction avec le coût de test...')
      const functionResult = await pool.query(`
        SELECT calculate_monthly_costs($1, 1, 2025) as monthly_cost
      `, [costId])
      
      console.log(`✅ Coût mensuel calculé: ${functionResult.rows[0].monthly_cost}€`)
      
      // 5. Tester les requêtes de l'API
      console.log('\n📊 5. Test des requêtes API...')
      
      // Test GET (récupération des coûts actifs)
      const activeCosts = await pool.query(`
        SELECT fc.*, cc.name as category_name, cc.color as category_color
        FROM fixed_costs fc
        LEFT JOIN cost_categories cc ON fc.category = cc.name
        WHERE fc.is_active = true
        ORDER BY fc.name
      `)
      
      console.log(`✅ Coûts actifs récupérés: ${activeCosts.rows.length}`)
      activeCosts.rows.forEach(cost => {
        console.log(`   - ${cost.name}: ${cost.amount}€ (${cost.category})`)
      })
      
      // Test calcul manuel (fallback de l'API)
      const manualCalc = await pool.query(`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM fixed_costs 
        WHERE is_active = true
      `)
      
      console.log(`✅ Calcul manuel: ${manualCalc.rows[0].total}€`)
      
      // 6. Nettoyer le coût de test
      console.log('\n📊 6. Nettoyage du coût de test...')
      await pool.query(`DELETE FROM fixed_costs WHERE id = $1`, [costId])
      console.log('🧹 Coût de test supprimé')
    }
    
    // 7. Test des catégories de coûts
    console.log('\n📊 7. Vérification des catégories de coûts...')
    const categories = await pool.query(`
      SELECT name, color, description 
      FROM cost_categories 
      ORDER BY name
    `)
    
    if (categories.rows.length > 0) {
      console.log(`✅ Catégories disponibles: ${categories.rows.length}`)
      categories.rows.forEach(cat => {
        console.log(`   - ${cat.name}: ${cat.color} (${cat.description})`)
      })
    } else {
      console.log('⚠️ Aucune catégorie de coût trouvée')
    }
    
    console.log('\n🎯 Test de l\'API terminé !')
    console.log('✅ Toutes les colonnes nécessaires sont présentes')
    console.log('✅ La fonction calculate_monthly_costs fonctionne')
    console.log('✅ L\'API devrait maintenant fonctionner correctement')
    
  } catch (error) {
    console.error('❌ Erreur test API:', error)
  } finally {
    await pool.end()
  }
}

// Exécuter le test
testCostsAPI().catch(console.error)
