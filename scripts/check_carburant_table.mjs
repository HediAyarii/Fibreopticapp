import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function checkCarburantTable() {
  console.log('🔍 Vérification de la table carburant...')
  
  try {
    // 1. Structure de la table carburant
    console.log('\n📋 1. Structure de la table carburant:')
    const tableStructure = await pool.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'carburant'
      ORDER BY ordinal_position
    `)
    
    if (tableStructure.rows.length === 0) {
      console.log('   ❌ Table carburant non trouvée')
    } else {
      console.log(`   📊 ${tableStructure.rows.length} colonnes trouvées:`)
      tableStructure.rows.forEach((col, index) => {
        const maxLength = col.character_maximum_length ? `(${col.character_maximum_length})` : ''
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'
        const defaultValue = col.column_default ? ` DEFAULT ${col.column_default}` : ''
        console.log(`   ${index + 1}. ${col.column_name}: ${col.data_type}${maxLength} ${nullable}${defaultValue}`)
      })
    }
    
    // 2. Contraintes et index
    console.log('\n📋 2. Contraintes et index:')
    const constraints = await pool.query(`
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'carburant'
      ORDER BY tc.constraint_type, tc.constraint_name
    `)
    
    if (constraints.rows.length > 0) {
      constraints.rows.forEach((constraint, index) => {
        console.log(`   ${index + 1}. ${constraint.constraint_type}: ${constraint.constraint_name} (${constraint.column_name})`)
      })
    } else {
      console.log('   📊 Aucune contrainte trouvée')
    }
    
    // 3. Données dans la table
    console.log('\n📋 3. Données dans la table carburant:')
    const dataCount = await pool.query('SELECT COUNT(*) as total FROM carburant')
    console.log(`   📊 Nombre total d'enregistrements: ${dataCount.rows[0].total}`)
    
    if (parseInt(dataCount.rows[0].total) > 0) {
      const sampleData = await pool.query(`
        SELECT * FROM carburant 
        ORDER BY created_at DESC 
        LIMIT 5
      `)
      
      console.log(`   📊 Échantillon de données (5 derniers):`)
      sampleData.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ID: ${row.id}, Numéro: ${row.numero_carte}, Montant: ${row.montant}€, Statut: ${row.statut}`)
        console.log(`      Date livraison: ${row.date_livraison}, Créé: ${row.created_at}`)
      })
    }
    
    // 4. Vérifier les tables liées
    console.log('\n📋 4. Tables liées:')
    const relatedTables = await pool.query(`
      SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND (tc.table_name = 'carburant' OR ccu.table_name = 'carburant')
    `)
    
    if (relatedTables.rows.length > 0) {
      relatedTables.rows.forEach((rel, index) => {
        console.log(`   ${index + 1}. ${rel.table_name}.${rel.column_name} → ${rel.foreign_table_name}.${rel.foreign_column_name}`)
      })
    } else {
      console.log('   📊 Aucune relation trouvée')
    }
    
    console.log('\n🎯 Résumé de la table carburant:')
    console.log(`   - Colonnes: ${tableStructure.rows.length}`)
    console.log(`   - Contraintes: ${constraints.rows.length}`)
    console.log(`   - Enregistrements: ${dataCount.rows[0].total}`)
    console.log(`   - Relations: ${relatedTables.rows.length}`)
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message)
  } finally {
    await pool.end()
  }
}

checkCarburantTable()










