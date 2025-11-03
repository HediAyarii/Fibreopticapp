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

async function debugCostsAPI() {
  try {
    console.log('🔍 Diagnostic de l\'API des coûts...')
    
    // 1. Vérifier l'existence des tables
    console.log('\n📊 1. Vérification des tables...')
    
    const tablesCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('fixed_costs', 'variable_costs', 'cost_categories')
      ORDER BY table_name
    `)
    
    console.log('📋 Tables trouvées:')
    tablesCheck.rows.forEach(row => {
      console.log(`   - ${row.table_name}`)
    })
    
    // 2. Vérifier le coût ID 17
    console.log('\n📊 2. Vérification du coût ID 17...')
    const cost17 = await pool.query(`
      SELECT id, name, amount, is_active, created_at, updated_at
      FROM fixed_costs 
      WHERE id = 17
    `)
    
    if (cost17.rows.length > 0) {
      console.log('✅ Coût ID 17 trouvé:')
      console.log(`   - Nom: ${cost17.rows[0].name}`)
      console.log(`   - Montant: ${cost17.rows[0].amount}€`)
      console.log(`   - Actif: ${cost17.rows[0].is_active}`)
      console.log(`   - Créé: ${cost17.rows[0].created_at}`)
      console.log(`   - Modifié: ${cost17.rows[0].updated_at}`)
    } else {
      console.log('❌ Coût ID 17 non trouvé')
    }
    
    // 3. Tester la requête DELETE
    console.log('\n📊 3. Test de la requête DELETE...')
    try {
      // Simuler la requête DELETE sans l'exécuter
      const deleteQuery = `
        UPDATE fixed_costs 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `
      
      console.log('📝 Requête DELETE préparée:')
      console.log(`   ${deleteQuery}`)
      console.log(`   Paramètres: [17]`)
      
      // Vérifier la syntaxe
      const syntaxCheck = await pool.query(`
        EXPLAIN (FORMAT JSON) 
        UPDATE fixed_costs 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = 17
      `)
      
      console.log('✅ Syntaxe de la requête valide')
      
    } catch (error) {
      console.error('❌ Erreur requête DELETE:', error.message)
    }
    
    // 4. Vérifier la table variable_costs
    console.log('\n📊 4. Vérification de variable_costs...')
    try {
      const variableCheck = await pool.query(`
        SELECT COUNT(*) as total, 
               COUNT(CASE WHEN id = 17 THEN 1 END) as id_17_count
        FROM variable_costs
      `)
      
      console.log(`📊 variable_costs: ${variableCheck.rows[0].total} enregistrements`)
      console.log(`📊 ID 17 dans variable_costs: ${variableCheck.rows[0].id_17_count}`)
      
    } catch (error) {
      console.log('⚠️ Table variable_costs:', error.message)
    }
    
    // 5. Tester les opérations CRUD
    console.log('\n📊 5. Test des opérations CRUD...')
    
    // Test CREATE
    try {
      const createTest = await pool.query(`
        INSERT INTO fixed_costs (name, description, amount, category, frequency, is_active)
        VALUES ('Test Debug', 'Test pour debug', 99.99, 'test', 'monthly', true)
        RETURNING id
      `)
      
      const testId = createTest.rows[0].id
      console.log(`✅ CREATE test: ID ${testId} créé`)
      
      // Test READ
      const readTest = await pool.query(`
        SELECT * FROM fixed_costs WHERE id = $1
      `, [testId])
      
      console.log(`✅ READ test: ${readTest.rows.length} enregistrement trouvé`)
      
      // Test UPDATE
      const updateTest = await pool.query(`
        UPDATE fixed_costs 
        SET name = 'Test Debug Updated', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `, [testId])
      
      console.log(`✅ UPDATE test: ${updateTest.rows.length} enregistrement modifié`)
      
      // Test DELETE (soft delete)
      const deleteTest = await pool.query(`
        UPDATE fixed_costs 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `, [testId])
      
      console.log(`✅ DELETE test: ${deleteTest.rows.length} enregistrement désactivé`)
      
      // Nettoyer
      await pool.query(`DELETE FROM fixed_costs WHERE id = $1`, [testId])
      console.log('🧹 Test record supprimé')
      
    } catch (error) {
      console.error('❌ Erreur test CRUD:', error.message)
    }
    
    // 6. Vérifier les logs d'erreur
    console.log('\n📊 6. Vérification des contraintes...')
    try {
      const constraints = await pool.query(`
        SELECT constraint_name, constraint_type, table_name
        FROM information_schema.table_constraints 
        WHERE table_name IN ('fixed_costs', 'variable_costs')
        ORDER BY table_name, constraint_name
      `)
      
      console.log('📋 Contraintes trouvées:')
      constraints.rows.forEach(row => {
        console.log(`   - ${row.table_name}: ${row.constraint_name} (${row.constraint_type})`)
      })
      
    } catch (error) {
      console.log('⚠️ Erreur contraintes:', error.message)
    }
    
    console.log('\n🎯 Diagnostic terminé !')
    
  } catch (error) {
    console.error('❌ Erreur diagnostic:', error)
  } finally {
    await pool.end()
  }
}

// Exécuter le diagnostic
debugCostsAPI().catch(console.error)



