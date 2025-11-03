import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function checkCard34Assignments() {
  try {
    console.log('🔍 Vérification des assignations de la carte 34...')
    
    const result = await pool.query(`
      SELECT 
        ca.*,
        e.nom,
        e.prenom,
        e.matricule
      FROM carburant_assignations ca
      LEFT JOIN employes e ON ca.employe_id = e.id
      WHERE ca.carte_id = '34'
      ORDER BY ca.date_assignation DESC
    `)
    
    console.log(`📊 Historique des assignations de la carte 34: ${result.rows.length}`)
    result.rows.forEach((assignment, index) => {
      console.log(`   ${index + 1}. Employé: ${assignment.prenom} ${assignment.nom} (ID: ${assignment.employe_id})`)
      console.log(`      Matricule: ${assignment.matricule}`)
      console.log(`      Période: ${assignment.date_assignation} → ${assignment.date_fin || 'permanent'}`)
      console.log(`      Statut: ${assignment.statut}`)
      console.log(`      ---`)
    })
    
    // Vérifier aussi les autres cartes assignées à Radhouan
    console.log('🔍 Vérification des autres cartes assignées à Radhouan...')
    const radhouanCards = await pool.query(`
      SELECT 
        ca.*,
        e.nom,
        e.prenom,
        e.matricule
      FROM carburant_assignations ca
      LEFT JOIN employes e ON ca.employe_id = e.id
      WHERE ca.employe_id = 18
        AND ca.statut = 'active'
      ORDER BY ca.date_assignation DESC
    `)
    
    console.log(`📊 Cartes actuellement assignées à Radhouan: ${radhouanCards.rows.length}`)
    radhouanCards.rows.forEach((assignment, index) => {
      console.log(`   ${index + 1}. Carte: ${assignment.carte_id}`)
      console.log(`      Période: ${assignment.date_assignation} → ${assignment.date_fin || 'permanent'}`)
      console.log(`      Statut: ${assignment.statut}`)
      console.log(`      ---`)
    })
    
    await pool.end()
  } catch (error) {
    console.error('❌ Erreur:', error)
    await pool.end()
  }
}

checkCard34Assignments()








