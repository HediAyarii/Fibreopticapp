const { query } = require('./lib/database')

async function checkParcoursField() {
  try {
    console.log('🔍 Vérification de la structure de la table interventions...')
    
    // Vérifier les colonnes de la table
    const columns = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'interventions' 
      AND column_name LIKE '%parcours%'
      ORDER BY column_name
    `)
    
    console.log('📋 Colonnes contenant "parcours":', columns.rows)
    
    // Vérifier quelques valeurs
    const sample = await query(`
      SELECT 
        id,
        parcours_type,
        grille,
        cloture_tech,
        echec
      FROM interventions 
      WHERE parcours_type IS NOT NULL
      LIMIT 5
    `)
    
    console.log('\n📊 Échantillon de données:', sample.rows)
    
    // Compter les valeurs par parcours_type
    const counts = await query(`
      SELECT 
        parcours_type,
        COUNT(*) as total
      FROM interventions
      WHERE parcours_type IS NOT NULL AND parcours_type != ''
      GROUP BY parcours_type
      ORDER BY total DESC
    `)
    
    console.log('\n📈 Répartition par parcours_type:', counts.rows)
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    process.exit(0)
  }
}

checkParcoursField()
