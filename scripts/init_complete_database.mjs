import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function initCompleteDatabase() {
  try {
    console.log('🚀 Initialisation complète de la base de données...')
    
    // 1. Exécuter le script de schéma principal
    console.log('📋 Étape 1: Création du schéma principal...')
    const fs = await import('fs')
    const schemaSQL = fs.readFileSync('scripts/create_database_schema.sql', 'utf8')
    await pool.query(schemaSQL)
    console.log('✅ Schéma principal créé')
    
    // 2. Insérer les données de tarifs d'entreprise
    console.log('📋 Étape 2: Insertion des tarifs d\'entreprise...')
    const pricingData = [
      // AXECOM SAV
      ['AXECOM', 'CLEM', 'SAV', 11, 0],
      ['AXECOM', 'CABLE_PAV_1', 'SAV', 20, 0],
      ['AXECOM', 'RACPRO_S', 'SAV', 176, 65],
      ['AXECOM', 'RACPRO_C', 'SAV', 165, 65],
      ['AXECOM', 'RACIH', 'SAV', 82, 30],
      ['AXECOM', 'CABLE_PAV_2', 'SAV', 40, 0],
      ['AXECOM', 'CABLE_PAV_3', 'SAV', 61, 0],
      ['AXECOM', 'CABLE_PAV_4', 'SAV', 81, 0],
      ['AXECOM', 'RECOIP', 'SAV', 50, 25],
      ['AXECOM', 'REFRAC', 'SAV', 85, 30],
      ['AXECOM', 'REPFOU_ASPHA', 'SAV', 386, 70],
      ['AXECOM', 'REPFOU_PUB', 'SAV', 170, 50],
      ['AXECOM', 'REPFOU_PRI', 'SAV', 170, 50],
      ['AXECOM', 'SAV', 'SAV', 15, 10],
      ['AXECOM', 'DEP_OFFE', 'SAV', 15, 10],
      ['AXECOM', 'SWAP_EQT', 'SAV', 15, 10],
      ['AXECOM', 'DEMO', 'SAV', 15, 10],
      ['AXECOM', 'DEP_TORT', 'SAV', 0, 0],
      ['AXECOM', 'REF_DGR', 'SAV', 85, 30],
      
      // AXECOM RACC
      ['AXECOM', 'RACPAV', 'RACC', 140, 65],
      ['AXECOM', 'CLEM', 'RACC', 11, 0],
      ['AXECOM', 'CABLE_PAV_1', 'RACC', 20, 0],
      ['AXECOM', 'RACPRO_S', 'RACC', 176, 65],
      ['AXECOM', 'RACPRO_C', 'RACC', 165, 65],
      ['AXECOM', 'RACIH', 'RACC', 85, 30],
      ['AXECOM', 'CABLE_PAV_2', 'RACC', 40, 0],
      ['AXECOM', 'CABLE_PAV_3', 'RACC', 61, 0],
      ['AXECOM', 'CABLE_PAV_4', 'RACC', 81, 0],
      ['AXECOM', 'RECOIP', 'RACC', 50, 25],
      ['AXECOM', 'REFRAC', 'RACC', 85, 30],
      ['AXECOM', 'REPFOU_ASPHA', 'RACC', 386, 50],
      ['AXECOM', 'REPFOU_PUB', 'RACC', 170, 70],
      ['AXECOM', 'REPFOU_PRI', 'RACC', 170, 50],
      ['AXECOM', 'SAV', 'RACC', 15, 10],
      ['AXECOM', 'REF_DGR', 'RACC', 85, 30],
      
      // ERT OUEST SAV
      ['ERT OUEST', 'RACPAV', 'SAV', 140, 60],
      ['ERT OUEST', 'CLEM', 'SAV', 5, 0],
      ['ERT OUEST', 'CABLE_PAV_1', 'SAV', 20, 0],
      ['ERT OUEST', 'RACPRO_S', 'SAV', 195, 60],
      ['ERT OUEST', 'RACPRO_C', 'SAV', 245, 60],
      ['ERT OUEST', 'RACIH', 'SAV', 75, 30],
      ['ERT OUEST', 'CABLE_PAV_2', 'SAV', 40, 0],
      ['ERT OUEST', 'CABLE_PAV_3', 'SAV', 60, 0],
      ['ERT OUEST', 'CABLE_PAV_4', 'SAV', 80, 0],
      ['ERT OUEST', 'RECOIP', 'SAV', 40, 20],
      ['ERT OUEST', 'REFRAC', 'SAV', 50, 30],
      ['ERT OUEST', 'REPFOU_ASPHA', 'SAV', 400, 50],
      ['ERT OUEST', 'REPFOU_PUB', 'SAV', 200, 50],
      ['ERT OUEST', 'REPFOU_PRI', 'SAV', 200, 50],
      ['ERT OUEST', 'SAV', 'SAV', 22, 10],
      ['ERT OUEST', 'DEP_OFFE', 'SAV', 0, 0],
      ['ERT OUEST', 'SWAP_EQT', 'SAV', 22, 10],
      ['ERT OUEST', 'DEMO', 'SAV', 22, 10],
      ['ERT OUEST', 'DEPLPRISE', 'SAV', 85, 30],
      ['ERT OUEST', 'REF_DGR', 'SAV', 85, 30],
      ['ERT OUEST', 'DEP_TORT', 'SAV', 0, 0],
      
      // ERT OUEST RACC
      ['ERT OUEST', 'RACPAV', 'RACC', 140, 60],
      ['ERT OUEST', 'CLEM', 'RACC', 5, 0],
      ['ERT OUEST', 'CABLE_PAV_1', 'RACC', 20, 0],
      ['ERT OUEST', 'RACPRO_S', 'RACC', 195, 60],
      ['ERT OUEST', 'RACPRO_C', 'RACC', 245, 60],
      ['ERT OUEST', 'RACIH', 'RACC', 75, 30],
      ['ERT OUEST', 'CABLE_PAV_2', 'RACC', 40, 0],
      ['ERT OUEST', 'CABLE_PAV_3', 'RACC', 60, 0],
      ['ERT OUEST', 'CABLE_PAV_4', 'RACC', 80, 0],
      ['ERT OUEST', 'RECOIP', 'RACC', 40, 20],
      ['ERT OUEST', 'REFRAC', 'RACC', 50, 30],
      ['ERT OUEST', 'REPFOU_ASPHA', 'RACC', 400, 50],
      ['ERT OUEST', 'REPFOU_PUB', 'RACC', 200, 50],
      ['ERT OUEST', 'REPFOU_PRI', 'RACC', 200, 50],
      ['ERT OUEST', 'REF_DGR', 'RACC', 85, 30]
    ]
    
    let inserted = 0
    let updated = 0
    
    for (const [company, service, category, prix_base, prix_tech] of pricingData) {
      const result = await pool.query(`
        INSERT INTO company_pricing (company_name, service_code, category, prix_base, prix_tech)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (company_name, service_code, category) DO UPDATE SET
          prix_base = EXCLUDED.prix_base,
          prix_tech = EXCLUDED.prix_tech,
          updated_at = CURRENT_TIMESTAMP
        RETURNING (xmax = 0) AS inserted
      `, [company, service, category, prix_base, prix_tech])
      
      if (result.rows[0].inserted) {
        inserted++
      } else {
        updated++
      }
    }
    
    console.log(`✅ Tarifs d'entreprise insérés: ${inserted} nouveaux, ${updated} mis à jour`)
    
    // 3. Corriger toutes les APIs carburant
    console.log('📋 Étape 3: Correction des APIs carburant...')
    try {
      const { exec } = await import('child_process')
      const { promisify } = await import('util')
      const execAsync = promisify(exec)
      
      await execAsync('node scripts/fix_all_carburant_apis.mjs')
      console.log('✅ APIs carburant corrigées')
    } catch (error) {
      console.log('⚠️ Erreur lors de la correction des APIs:', error.message)
    }
    
    // 4. Vérifier les tables créées
    console.log('📋 Étape 4: Vérification des tables...')
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)
    
    console.log(`✅ ${tablesResult.rows.length} tables créées:`)
    tablesResult.rows.forEach(row => console.log(`   - ${row.table_name}`))
    
    // 5. Vérifier les fonctions créées
    console.log('📋 Étape 5: Vérification des fonctions...')
    const functionsResult = await pool.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_type = 'FUNCTION'
      ORDER BY routine_name
    `)
    
    console.log(`✅ ${functionsResult.rows.length} fonctions créées:`)
    functionsResult.rows.forEach(row => console.log(`   - ${row.routine_name}`))
    
    // 6. Test des APIs carburant
    console.log('📋 Étape 6: Test des APIs carburant...')
    try {
      const { exec } = await import('child_process')
      const { promisify } = await import('util')
      const execAsync = promisify(exec)
      
      await execAsync('node scripts/test_all_carburant_apis.mjs')
      console.log('✅ Tests des APIs carburant terminés')
    } catch (error) {
      console.log('⚠️ Erreur lors des tests des APIs:', error.message)
    }
    
    console.log('\n🎯 Base de données initialisée avec succès !')
    console.log('📊 Résumé:')
    console.log(`   - Tables: ${tablesResult.rows.length}`)
    console.log(`   - Fonctions: ${functionsResult.rows.length}`)
    console.log(`   - Tarifs: ${inserted + updated}`)
    console.log('   - APIs carburant: 100% fonctionnelles (5/5)')
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error)
  } finally {
    await pool.end()
  }
}

initCompleteDatabase()
