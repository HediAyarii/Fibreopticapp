import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function checkCarburantAssignationsStructure() {
  try {
    console.log('🔍 Vérification de la structure de carburant_assignations...')
    
    // Vérifier si la table existe
    const tableExists = await pool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'carburant_assignations'
    `)
    
    if (parseInt(tableExists.rows[0].count) === 0) {
      console.log('❌ Table carburant_assignations n\'existe pas')
      return
    }
    
    console.log('✅ Table carburant_assignations existe')
    
    // Récupérer la structure de la table
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'carburant_assignations' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `)
    
    console.log('\n📋 Structure de la table:')
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
      if (row.column_default) {
        console.log(`     Default: ${row.column_default}`)
      }
    })
    
    // Vérifier les colonnes spécifiques mentionnées dans l'erreur
    const expectedColumns = ['numero_carte', 'employe_id', 'date_debut', 'date_fin_prevue', 'date_fin_reelle', 'statut']
    console.log('\n🔍 Vérification des colonnes attendues:')
    
    for (const col of expectedColumns) {
      const colExists = result.rows.find(row => row.column_name === col)
      console.log(`   ${colExists ? '✅' : '❌'} ${col}: ${colExists ? 'EXISTE' : 'MANQUANTE'}`)
    }
    
    // Vérifier s'il y a des données
    const dataCount = await pool.query('SELECT COUNT(*) as count FROM carburant_assignations')
    console.log(`\n📊 Nombre d'enregistrements: ${dataCount.rows[0].count}`)
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  } finally {
    await pool.end()
  }
}

checkCarburantAssignationsStructure()
