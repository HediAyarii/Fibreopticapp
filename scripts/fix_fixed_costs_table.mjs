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

async function fixFixedCostsTable() {
  try {
    console.log('🔧 Correction de la table fixed_costs...')
    
    // 1. Vérifier la structure actuelle de la table
    console.log('\n📊 1. Vérification de la structure actuelle...')
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'fixed_costs' 
      ORDER BY ordinal_position
    `)
    
    console.log('📋 Colonnes actuelles:')
    tableInfo.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`)
    })
    
    // 2. Ajouter la colonne is_active si elle n'existe pas
    console.log('\n📊 2. Ajout de la colonne is_active...')
    try {
      await pool.query(`
        ALTER TABLE fixed_costs 
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true
      `)
      console.log('✅ Colonne is_active ajoutée avec succès')
    } catch (error) {
      if (error.code === '42701') {
        console.log('ℹ️ Colonne is_active existe déjà')
      } else {
        throw error
      }
    }
    
    // 3. Mettre à jour les enregistrements existants
    console.log('\n📊 3. Mise à jour des enregistrements existants...')
    const updateResult = await pool.query(`
      UPDATE fixed_costs 
      SET is_active = true 
      WHERE is_active IS NULL
    `)
    console.log(`✅ ${updateResult.rowCount} enregistrements mis à jour`)
    
    // 4. Créer la fonction calculate_monthly_costs
    console.log('\n📊 4. Création de la fonction calculate_monthly_costs...')
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
    
    // 5. Tester la fonction
    console.log('\n📊 5. Test de la fonction...')
    try {
      const testResult = await pool.query(`
        SELECT calculate_monthly_costs(1, 1, 2025) as test_result
      `)
      console.log(`✅ Test fonction: ${testResult.rows[0].test_result}`)
    } catch (testError) {
      console.log('⚠️ Test fonction échoué (normal si pas de données):', testError.message)
    }
    
    // 6. Vérification finale
    console.log('\n📊 6. Vérification finale...')
    const finalCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'fixed_costs' 
      AND column_name = 'is_active'
    `)
    
    if (finalCheck.rows.length > 0) {
      console.log('✅ Colonne is_active vérifiée:', finalCheck.rows[0])
    } else {
      console.log('❌ Colonne is_active non trouvée')
    }
    
    console.log('\n🎯 Correction terminée !')
    console.log('💡 La table fixed_costs est maintenant prête pour l\'API des coûts')
    
  } catch (error) {
    console.error('❌ Erreur correction table:', error)
  } finally {
    await pool.end()
  }
}

// Exécuter la correction
fixFixedCostsTable().catch(console.error)

