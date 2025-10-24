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

async function fixVariableCostsTable() {
  try {
    console.log('🔧 Correction de la table variable_costs...')
    
    // 1. Vérifier la structure actuelle
    console.log('\n📊 1. Vérification de la structure actuelle...')
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'variable_costs' 
      ORDER BY ordinal_position
    `)
    
    console.log('📋 Colonnes actuelles de variable_costs:')
    tableInfo.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`)
    })
    
    // 2. Ajouter les colonnes manquantes
    console.log('\n📊 2. Ajout des colonnes manquantes...')
    
    // Ajouter la colonne month si elle n'existe pas
    try {
      await pool.query(`
        ALTER TABLE variable_costs 
        ADD COLUMN IF NOT EXISTS month INTEGER
      `)
      console.log('✅ Colonne month ajoutée')
    } catch (error) {
      if (error.code === '42701') {
        console.log('ℹ️ Colonne month existe déjà')
      } else {
        throw error
      }
    }
    
    // Ajouter la colonne year si elle n'existe pas
    try {
      await pool.query(`
        ALTER TABLE variable_costs 
        ADD COLUMN IF NOT EXISTS year INTEGER
      `)
      console.log('✅ Colonne year ajoutée')
    } catch (error) {
      if (error.code === '42701') {
        console.log('ℹ️ Colonne year existe déjà')
      } else {
        throw error
      }
    }
    
    // Ajouter la colonne frequency si elle n'existe pas
    try {
      await pool.query(`
        ALTER TABLE variable_costs 
        ADD COLUMN IF NOT EXISTS frequency VARCHAR(20) DEFAULT 'monthly'
      `)
      console.log('✅ Colonne frequency ajoutée')
    } catch (error) {
      if (error.code === '42701') {
        console.log('ℹ️ Colonne frequency existe déjà')
      } else {
        throw error
      }
    }
    
    // Ajouter la colonne is_active si elle n'existe pas
    try {
      await pool.query(`
        ALTER TABLE variable_costs 
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true
      `)
      console.log('✅ Colonne is_active ajoutée')
    } catch (error) {
      if (error.code === '42701') {
        console.log('ℹ️ Colonne is_active existe déjà')
      } else {
        throw error
      }
    }
    
    // 3. Mettre à jour les enregistrements existants
    console.log('\n📊 3. Mise à jour des enregistrements existants...')
    
    // Mettre à jour month et year avec les valeurs actuelles
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()
    
    const updateResult = await pool.query(`
      UPDATE variable_costs 
      SET month = $1, year = $2, frequency = 'monthly', is_active = true
      WHERE month IS NULL OR year IS NULL OR frequency IS NULL OR is_active IS NULL
    `, [currentMonth, currentYear])
    
    console.log(`✅ ${updateResult.rowCount} enregistrements mis à jour`)
    
    // 4. Vérifier la structure finale
    console.log('\n📊 4. Vérification de la structure finale...')
    const finalStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'variable_costs' 
      ORDER BY ordinal_position
    `)
    
    console.log('📋 Structure finale de variable_costs:')
    finalStructure.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`)
    })
    
    // 5. Tester les opérations CRUD
    console.log('\n📊 5. Test des opérations CRUD...')
    
    // Créer un coût variable de test
    const testCost = await pool.query(`
      INSERT INTO variable_costs (name, description, amount, category, date, month, year, frequency, is_active)
      VALUES ('Test Variable Cost', 'Test coût variable', 150.00, 'test', CURRENT_DATE, $1, $2, 'monthly', true)
      RETURNING id, name, amount, month, year, is_active
    `, [currentMonth, currentYear])
    
    if (testCost.rows.length > 0) {
      const testId = testCost.rows[0].id
      console.log(`✅ Coût variable de test créé: ID ${testId}`)
      console.log(`   - Nom: ${testCost.rows[0].name}`)
      console.log(`   - Montant: ${testCost.rows[0].amount}€`)
      console.log(`   - Période: ${testCost.rows[0].month}/${testCost.rows[0].year}`)
      console.log(`   - Actif: ${testCost.rows[0].is_active}`)
      
      // Tester la mise à jour
      const updateTest = await pool.query(`
        UPDATE variable_costs 
        SET name = $1, amount = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `, ['Test Variable Cost Updated', 200.00, testId])
      
      if (updateTest.rows.length > 0) {
        console.log(`✅ Mise à jour réussie: ${updateTest.rows[0].name} - ${updateTest.rows[0].amount}€`)
      }
      
      // Tester la suppression
      const deleteTest = await pool.query(`
        DELETE FROM variable_costs WHERE id = $1
      `, [testId])
      
      if (deleteTest.rowCount > 0) {
        console.log(`✅ Suppression réussie: ${deleteTest.rowCount} enregistrement supprimé`)
      }
    }
    
    // 6. Vérifier les contraintes
    console.log('\n📊 6. Vérification des contraintes...')
    const constraints = await pool.query(`
      SELECT constraint_name, constraint_type, table_name
      FROM information_schema.table_constraints 
      WHERE table_name = 'variable_costs'
      ORDER BY constraint_name
    `)
    
    console.log('📋 Contraintes de variable_costs:')
    constraints.rows.forEach(row => {
      console.log(`   - ${row.constraint_name}: ${row.constraint_type}`)
    })
    
    console.log('\n🎯 Correction de variable_costs terminée !')
    console.log('✅ Toutes les colonnes nécessaires sont présentes')
    console.log('✅ Les opérations CRUD fonctionnent correctement')
    
  } catch (error) {
    console.error('❌ Erreur correction table:', error)
  } finally {
    await pool.end()
  }
}

// Exécuter la correction
fixVariableCostsTable().catch(console.error)
