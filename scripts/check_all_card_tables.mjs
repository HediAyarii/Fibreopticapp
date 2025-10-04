import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function checkAllCardTables() {
  console.log('🔍 Vérification de toutes les tables liées aux cartes...')
  
  try {
    // 1. Lister toutes les tables qui contiennent "carte" ou "card" dans le nom
    console.log('\n📋 1. Tables contenant "carte" ou "card":')
    const cardTables = await pool.query(`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND (table_name ILIKE '%carte%' OR table_name ILIKE '%card%')
      ORDER BY table_name
    `)
    
    if (cardTables.rows.length > 0) {
      cardTables.rows.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.table_name} (${table.table_type})`)
      })
    } else {
      console.log('   📊 Aucune table trouvée avec "carte" ou "card"')
    }
    
    // 2. Lister toutes les tables qui contiennent des colonnes liées aux cartes
    console.log('\n📋 2. Tables avec colonnes liées aux cartes:')
    const tablesWithCardColumns = await pool.query(`
      SELECT DISTINCT table_name
      FROM information_schema.columns 
      WHERE column_name ILIKE '%carte%' 
         OR column_name ILIKE '%card%'
         OR column_name ILIKE '%numero%'
         OR column_name ILIKE '%assignation%'
         OR column_name ILIKE '%assign%'
      ORDER BY table_name
    `)
    
    if (tablesWithCardColumns.rows.length > 0) {
      tablesWithCardColumns.rows.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.table_name}`)
      })
    } else {
      console.log('   📊 Aucune table trouvée avec colonnes liées aux cartes')
    }
    
    // 3. Détail de chaque table trouvée
    console.log('\n📋 3. Détail des tables liées aux cartes:')
    
    for (const table of tablesWithCardColumns.rows) {
      const tableName = table.table_name
      console.log(`\n   🔍 Table: ${tableName}`)
      
      // Structure de la table
      const structure = await pool.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tableName])
      
      console.log(`   📊 Structure (${structure.rows.length} colonnes):`)
      structure.rows.forEach((col, index) => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'
        const defaultValue = col.column_default ? ` DEFAULT ${col.column_default}` : ''
        console.log(`      ${index + 1}. ${col.column_name}: ${col.data_type} ${nullable}${defaultValue}`)
      })
      
      // Nombre d'enregistrements
      try {
        const count = await pool.query(`SELECT COUNT(*) as total FROM ${tableName}`)
        console.log(`   📊 Enregistrements: ${count.rows[0].total}`)
        
        // Échantillon de données si la table n'est pas vide
        if (parseInt(count.rows[0].total) > 0) {
          const sample = await pool.query(`SELECT * FROM ${tableName} LIMIT 3`)
          console.log(`   📊 Échantillon de données:`)
          sample.rows.forEach((row, index) => {
            console.log(`      ${index + 1}. ${JSON.stringify(row, null, 2)}`)
          })
        }
      } catch (error) {
        console.log(`   ❌ Erreur lors de la lecture: ${error.message}`)
      }
    }
    
    // 4. Tables spécifiques connues
    console.log('\n📋 4. Tables spécifiques connues:')
    const knownTables = [
      'carburant',
      'carburant_assignations', 
      'carburant_consommation',
      'carburant_mouvements'
    ]
    
    for (const tableName of knownTables) {
      try {
        const exists = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )
        `, [tableName])
        
        if (exists.rows[0].exists) {
          const count = await pool.query(`SELECT COUNT(*) as total FROM ${tableName}`)
          console.log(`   ✅ ${tableName}: ${count.rows[0].total} enregistrements`)
        } else {
          console.log(`   ❌ ${tableName}: Table n'existe pas`)
        }
      } catch (error) {
        console.log(`   ❌ ${tableName}: Erreur - ${error.message}`)
      }
    }
    
    console.log('\n🎯 Résumé des tables liées aux cartes:')
    console.log(`   - Tables avec "carte/card": ${cardTables.rows.length}`)
    console.log(`   - Tables avec colonnes liées: ${tablesWithCardColumns.rows.length}`)
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message)
  } finally {
    await pool.end()
  }
}

checkAllCardTables()
