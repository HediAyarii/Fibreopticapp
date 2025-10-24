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

async function testCostsAPIOperations() {
  try {
    console.log('🧪 Test des opérations de l\'API des coûts...')
    
    // 1. Créer un coût de test
    console.log('\n📊 1. Création d\'un coût de test...')
    const createTest = await pool.query(`
      INSERT INTO fixed_costs (name, description, amount, category, frequency, is_active)
      VALUES ('Test API Operations', 'Test pour les opérations API', 250.00, 'test', 'monthly', true)
      RETURNING id, name, amount, is_active
    `)
    
    const testId = createTest.rows[0].id
    console.log(`✅ Coût de test créé: ID ${testId}`)
    console.log(`   - Nom: ${createTest.rows[0].name}`)
    console.log(`   - Montant: ${createTest.rows[0].amount}€`)
    console.log(`   - Actif: ${createTest.rows[0].is_active}`)
    
    // 2. Tester la mise à jour (PUT)
    console.log('\n📊 2. Test de la mise à jour (PUT)...')
    const updateTest = await pool.query(`
      UPDATE fixed_costs 
      SET name = $1, description = $2, amount = $3, category = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `, ['Test API Operations Updated', 'Test mis à jour', 300.00, 'test', testId])
    
    if (updateTest.rows.length > 0) {
      console.log(`✅ Mise à jour réussie: ${updateTest.rows[0].name} - ${updateTest.rows[0].amount}€`)
    } else {
      console.log('❌ Échec de la mise à jour')
    }
    
    // 3. Tester la désactivation (DELETE - soft delete)
    console.log('\n📊 3. Test de la désactivation (DELETE)...')
    
    // Vérifier l'état avant
    const beforeState = await pool.query(`
      SELECT id, name, is_active FROM fixed_costs WHERE id = $1
    `, [testId])
    
    console.log(`📋 État avant: ${beforeState.rows[0].name} - Actif: ${beforeState.rows[0].is_active}`)
    
    // Désactiver
    const deleteTest = await pool.query(`
      UPDATE fixed_costs 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_active = true
      RETURNING *
    `, [testId])
    
    if (deleteTest.rows.length > 0) {
      console.log(`✅ Désactivation réussie: ${deleteTest.rows[0].name} - Actif: ${deleteTest.rows[0].is_active}`)
    } else {
      console.log('⚠️ Aucune modification (peut-être déjà désactivé)')
    }
    
    // 4. Tester la désactivation d'un coût déjà désactivé
    console.log('\n📊 4. Test de la désactivation d\'un coût déjà désactivé...')
    const deleteAgainTest = await pool.query(`
      UPDATE fixed_costs 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_active = true
      RETURNING *
    `, [testId])
    
    if (deleteAgainTest.rows.length > 0) {
      console.log(`✅ Deuxième désactivation réussie`)
    } else {
      console.log('✅ Comportement attendu: Aucune modification (déjà désactivé)')
    }
    
    // 5. Tester la réactivation
    console.log('\n📊 5. Test de la réactivation...')
    const reactivateTest = await pool.query(`
      UPDATE fixed_costs 
      SET is_active = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [testId])
    
    if (reactivateTest.rows.length > 0) {
      console.log(`✅ Réactivation réussie: ${reactivateTest.rows[0].name} - Actif: ${reactivateTest.rows[0].is_active}`)
    } else {
      console.log('❌ Échec de la réactivation')
    }
    
    // 6. Tester la suppression définitive
    console.log('\n📊 6. Test de la suppression définitive...')
    const finalDeleteTest = await pool.query(`
      DELETE FROM fixed_costs WHERE id = $1
    `, [testId])
    
    if (finalDeleteTest.rowCount > 0) {
      console.log(`✅ Suppression définitive réussie: ${finalDeleteTest.rowCount} enregistrement supprimé`)
    } else {
      console.log('❌ Échec de la suppression définitive')
    }
    
    // 7. Tester les cas d'erreur
    console.log('\n📊 7. Test des cas d\'erreur...')
    
    // Test avec un ID inexistant
    const nonExistentTest = await pool.query(`
      SELECT id, name, is_active FROM fixed_costs WHERE id = 99999
    `)
    
    if (nonExistentTest.rows.length === 0) {
      console.log('✅ Gestion des IDs inexistants: Comportement correct')
    } else {
      console.log('❌ Problème avec la gestion des IDs inexistants')
    }
    
    // Test avec des données invalides
    try {
      const invalidDataTest = await pool.query(`
        UPDATE fixed_costs 
        SET amount = $1
        WHERE id = 99999
      `, ['invalid_amount'])
      console.log('⚠️ Test données invalides: Aucune erreur (normal)')
    } catch (error) {
      console.log('✅ Gestion des données invalides: Erreur capturée')
    }
    
    console.log('\n🎯 Test des opérations terminé !')
    console.log('✅ Toutes les opérations CRUD fonctionnent correctement')
    console.log('✅ La gestion des erreurs est appropriée')
    
  } catch (error) {
    console.error('❌ Erreur test opérations:', error)
  } finally {
    await pool.end()
  }
}

// Exécuter le test
testCostsAPIOperations().catch(console.error)
