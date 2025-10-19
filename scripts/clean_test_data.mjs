import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function cleanTestData() {
  console.log('🧹 Nettoyage des données de test...')
  
  try {
    // Supprimer les assignations de test
    console.log('📋 Suppression des assignations de test...')
    const deleteResult = await pool.query(`
      DELETE FROM carburant_assignations 
      WHERE carte_id LIKE 'TEST_%' 
         OR carte_id LIKE 'CARTE_%'
    `)
    
    console.log(`✅ ${deleteResult.rowCount} assignations de test supprimées`)
    
    // Vérifier les assignations restantes
    const remainingAssignments = await pool.query(`
      SELECT 
        ca.id,
        ca.carte_id,
        ca.employe_id,
        ca.date_assignation,
        ca.date_fin,
        ca.statut,
        e.nom,
        e.prenom
      FROM carburant_assignations ca
      LEFT JOIN employes e ON e.id = ca.employe_id
      ORDER BY ca.created_at DESC
    `)
    
    console.log(`📊 ${remainingAssignments.rows.length} assignations restantes:`)
    remainingAssignments.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. Carte: ${row.carte_id}, Employé: ${row.prenom} ${row.nom} (${row.employe_id}), Statut: ${row.statut}`)
    })
    
    console.log('\n🎯 Données de test nettoyées !')
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error)
  } finally {
    await pool.end()
  }
}

cleanTestData()






