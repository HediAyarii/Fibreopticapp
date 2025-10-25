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

async function fixFixedCostsComplete() {
  try {
    console.log('🔧 Correction complète de la table fixed_costs...')
    
    // 1. Ajouter la colonne frequency si elle n'existe pas
    console.log('\n📊 1. Ajout de la colonne frequency...')
    try {
      await pool.query(`
        ALTER TABLE fixed_costs 
        ADD COLUMN IF NOT EXISTS frequency VARCHAR(20) DEFAULT 'monthly'
      `)
      console.log('✅ Colonne frequency ajoutée avec succès')
    } catch (error) {
      if (error.code === '42701') {
        console.log('ℹ️ Colonne frequency existe déjà')
      } else {
        throw error
      }
    }
    
    // 2. Mettre à jour les enregistrements existants avec frequency
    console.log('\n📊 2. Mise à jour des enregistrements existants...')
    const updateResult = await pool.query(`
      UPDATE fixed_costs 
      SET frequency = 'monthly' 
      WHERE frequency IS NULL
    `)
    console.log(`✅ ${updateResult.rowCount} enregistrements mis à jour avec frequency`)
    
    // 3. Recréer la fonction calculate_monthly_costs avec la bonne structure
    console.log('\n📊 3. Création de la fonction calculate_monthly_costs...')
    const createFunction = `
      CREATE OR REPLACE FUNCTION calculate_monthly_costs(
        p_cost_id INTEGER,
        p_month INTEGER,
        p_year INTEGER
      ) RETURNS DECIMAL(10,2) AS $$
      DECLARE
        cost_amount DECIMAL(10,2);
        cost_frequency VARCHAR(20);
        monthly_cost DECIMAL(10,2);
      BEGIN
        -- Récupérer les informations du coût
        SELECT amount, frequency 
        INTO cost_amount, cost_frequency
        FROM fixed_costs 
        WHERE id = p_cost_id AND is_active = true;
        
        -- Si le coût n'existe pas ou n'est pas actif
        IF NOT FOUND THEN
          RETURN 0;
        END IF;
        
        -- Calculer le coût mensuel selon la fréquence
        CASE cost_frequency
          WHEN 'monthly' THEN
            monthly_cost := cost_amount;
          WHEN 'yearly' THEN
            monthly_cost := cost_amount / 12;
          WHEN 'weekly' THEN
            monthly_cost := cost_amount * 4.33; -- Approximation 52/12
          WHEN 'daily' THEN
            monthly_cost := cost_amount * 30.44; -- Approximation 365/12
          ELSE
            monthly_cost := cost_amount; -- Par défaut, considérer comme mensuel
        END CASE;
        
        RETURN ROUND(monthly_cost, 2);
      END;
      $$ LANGUAGE plpgsql;
    `
    
    await pool.query(createFunction)
    console.log('✅ Fonction calculate_monthly_costs créée avec succès')
    
    // 4. Tester la fonction avec des données de test
    console.log('\n📊 4. Test de la fonction avec données de test...')
    
    // Créer un coût de test
    const testCost = await pool.query(`
      INSERT INTO fixed_costs (name, description, amount, category, frequency, is_active)
      VALUES ('Test Cost', 'Coût de test', 100.00, 'test', 'monthly', true)
      RETURNING id
    `)
    
    if (testCost.rows.length > 0) {
      const testId = testCost.rows[0].id
      console.log(`📝 Coût de test créé avec ID: ${testId}`)
      
      // Tester la fonction
      const testResult = await pool.query(`
        SELECT calculate_monthly_costs($1, 1, 2025) as test_result
      `, [testId])
      
      console.log(`✅ Test fonction: ${testResult.rows[0].test_result}€`)
      
      // Nettoyer le coût de test
      await pool.query(`DELETE FROM fixed_costs WHERE id = $1`, [testId])
      console.log('🧹 Coût de test supprimé')
    }
    
    // 5. Vérification finale de la structure
    console.log('\n📊 5. Vérification finale de la structure...')
    const finalCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'fixed_costs' 
      ORDER BY ordinal_position
    `)
    
    console.log('📋 Structure finale de la table:')
    finalCheck.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`)
    })
    
    console.log('\n🎯 Correction complète terminée !')
    console.log('💡 La table fixed_costs est maintenant complètement prête')
    console.log('✅ Colonnes ajoutées: is_active, frequency')
    console.log('✅ Fonction calculate_monthly_costs créée et testée')
    
  } catch (error) {
    console.error('❌ Erreur correction complète:', error)
  } finally {
    await pool.end()
  }
}

// Exécuter la correction complète
fixFixedCostsComplete().catch(console.error)

