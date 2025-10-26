// Script pour tester le trigger de pénalités
import { Pool } from 'pg'

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024'
})

async function testPenaltyTrigger() {
  try {
    console.log('🧪 Test du trigger de pénalités...')
    
    // 1. Vérifier l'état actuel de cout_par_salaire pour un employé
    const employeeId = 6 // BEN TRAD Fares
    const employee = await pool.query(`
      SELECT id, nom, prenom, matricule 
      FROM employes 
      WHERE id = $1
    `, [employeeId])
    
    if (employee.rows.length === 0) {
      console.log('❌ Employé non trouvé')
      return
    }
    
    const emp = employee.rows[0]
    console.log(`👤 Employé: ${emp.nom} ${emp.prenom} (${emp.matricule})`)
    
    // 2. Vérifier l'état actuel des pénalités
    const currentPenalties = await pool.query(`
      SELECT COUNT(*) as count, SUM(montant) as total
      FROM penalites 
      WHERE employe_id = $1
    `, [employeeId])
    
    console.log(`📊 Pénalités actuelles: ${currentPenalties.rows[0].count} (Total: ${currentPenalties.rows[0].total || 0} DT)`)
    
    // 3. Vérifier l'état actuel dans cout_par_salaire
    const currentCout = await pool.query(`
      SELECT penalite, total_genere, rap
      FROM cout_par_salaire 
      WHERE matricule = $1 AND annee = 2025 AND mois = 5
    `, [emp.matricule])
    
    console.log(`💰 État actuel dans cout_par_salaire:`, currentCout.rows[0] || 'Aucun enregistrement')
    
    // 4. Ajouter une nouvelle pénalité de test
    const testPenalty = {
      numero_penalite: `PEN_TEST_${Date.now()}`,
      employe_id: employeeId,
      type_penalite: 'test',
      motif: 'Test du trigger',
      montant: 25.00,
      manager_approbateur: 'Test Manager',
      commentaires: 'Pénalité de test pour vérifier le trigger'
    }
    
    console.log('➕ Ajout d\'une pénalité de test...')
    const insertResult = await pool.query(`
      INSERT INTO penalites (
        numero_penalite, employe_id, type_penalite, motif, montant,
        manager_approbateur, commentaires, date_attribution
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      testPenalty.numero_penalite,
      testPenalty.employe_id,
      testPenalty.type_penalite,
      testPenalty.motif,
      testPenalty.montant,
      testPenalty.manager_approbateur,
      testPenalty.commentaires
    ])
    
    console.log('✅ Pénalité ajoutée:', insertResult.rows[0])
    
    // 5. Vérifier la mise à jour dans cout_par_salaire
    const updatedCout = await pool.query(`
      SELECT penalite, total_genere, rap, updated_at
      FROM cout_par_salaire 
      WHERE matricule = $1 AND annee = 2025 AND mois = 5
    `, [emp.matricule])
    
    console.log('🔄 État après mise à jour:', updatedCout.rows[0] || 'Aucun enregistrement')
    
    // 6. Vérifier le total des pénalités
    const totalPenalties = await pool.query(`
      SELECT SUM(montant) as total
      FROM penalites 
      WHERE employe_id = $1
    `, [employeeId])
    
    console.log(`📈 Total des pénalités après ajout: ${totalPenalties.rows[0].total} DT`)
    
    // 7. Nettoyer la pénalité de test
    console.log('🧹 Nettoyage de la pénalité de test...')
    await pool.query(`
      DELETE FROM penalites 
      WHERE numero_penalite = $1
    `, [testPenalty.numero_penalite])
    
    console.log('✅ Test terminé avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
  } finally {
    await pool.end()
  }
}

// Exécuter le test
testPenaltyTrigger()
