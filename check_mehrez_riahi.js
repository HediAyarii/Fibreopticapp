const { Pool } = require('pg')

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'postgres',
  password: 'postgres'
})

async function checkMehrezRiahi() {
  try {
    console.log('🔍 Recherche de Mehrez Riahi...\n')
    
    // 1. Chercher dans employees
    const employees = await pool.query(`
      SELECT id, nom, prenom, matricule, is_active, created_at 
      FROM employees 
      WHERE LOWER(nom) LIKE '%riahi%' 
         OR LOWER(prenom) LIKE '%mehrez%' 
         OR LOWER(nom) LIKE '%mehrez%'
    `)
    console.log('📋 Table employees:')
    if (employees.rows.length > 0) {
      employees.rows.forEach(e => {
        console.log(`   - ID: ${e.id}, Nom: ${e.nom}, Prénom: ${e.prenom}, Matricule: ${e.matricule}, Actif: ${e.is_active}`)
      })
    } else {
      console.log('   ❌ Aucun résultat')
    }
    
    // 2. Chercher dans interventions
    const interventions = await pool.query(`
      SELECT DISTINCT employe_nom, employe_prenom, COUNT(*) as nb_interventions
      FROM interventions 
      WHERE LOWER(employe_nom) LIKE '%riahi%' 
         OR LOWER(employe_prenom) LIKE '%mehrez%'
         OR LOWER(employe_nom) LIKE '%mehrez%'
      GROUP BY employe_nom, employe_prenom
    `)
    console.log('\n📋 Table interventions:')
    if (interventions.rows.length > 0) {
      interventions.rows.forEach(i => {
        console.log(`   - ${i.employe_nom} ${i.employe_prenom}: ${i.nb_interventions} interventions`)
      })
    } else {
      console.log('   ❌ Aucune intervention trouvée')
    }
    
    // 3. Vérifier cout_par_salaire
    const salaires = await pool.query(`
      SELECT * FROM cout_par_salaire 
      WHERE LOWER(employe_nom) LIKE '%riahi%' 
         OR LOWER(employe_nom) LIKE '%mehrez%'
    `)
    console.log('\n📋 Table cout_par_salaire:')
    if (salaires.rows.length > 0) {
      salaires.rows.forEach(s => {
        console.log(`   - ${s.employe_nom}: ${s.cout_journalier}€/jour`)
      })
    } else {
      console.log('   ❌ Aucun résultat')
    }
    
    // 4. Recherche élargie
    console.log('\n🔍 Recherche élargie (tous les noms contenant RIAHI ou MEHREZ):')
    const wider = await pool.query(`
      SELECT DISTINCT employe_nom, employe_prenom
      FROM interventions 
      WHERE UPPER(employe_nom) LIKE '%RIAHI%' 
         OR UPPER(employe_prenom) LIKE '%RIAHI%'
         OR UPPER(employe_nom) LIKE '%MEHREZ%' 
         OR UPPER(employe_prenom) LIKE '%MEHREZ%'
    `)
    if (wider.rows.length > 0) {
      wider.rows.forEach(w => {
        console.log(`   - ${w.employe_nom} ${w.employe_prenom}`)
      })
    } else {
      console.log('   ❌ Aucun résultat')
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await pool.end()
  }
}

checkMehrezRiahi()
