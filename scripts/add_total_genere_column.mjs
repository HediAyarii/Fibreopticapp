import { Pool } from 'pg'

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'finalfibre',
  password: 'postgres',
  port: 5432,
})

async function addTotalGenereColumn() {
  try {
    console.log('🚀 Ajout de la colonne total_genere à cout_par_salaire...')
    
    // Vérifier si la colonne existe déjà
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'cout_par_salaire' 
      AND column_name = 'total_genere'
    `)
    
    if (checkColumn.rows.length > 0) {
      console.log('ℹ️ Colonne total_genere existe déjà')
    } else {
      // Ajouter la colonne total_genere
      await pool.query(`
        ALTER TABLE cout_par_salaire 
        ADD COLUMN total_genere DECIMAL(10,2) DEFAULT 0
      `)
      console.log('✅ Colonne total_genere ajoutée')
    }
    
    // Créer un index pour optimiser les requêtes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_cout_par_salaire_total_genere 
      ON cout_par_salaire(total_genere)
    `)
    console.log('✅ Index sur total_genere créé')
    
    // Vérifier la structure finale
    const structure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'cout_par_salaire'
      ORDER BY ordinal_position
    `)
    
    console.log('\n📋 Structure finale de cout_par_salaire:')
    structure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`)
    })
    
    console.log('\n✅ Colonne total_genere ajoutée avec succès !')
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await pool.end()
  }
}

addTotalGenereColumn()
