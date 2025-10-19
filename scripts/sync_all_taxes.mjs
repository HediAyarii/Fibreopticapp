import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function syncAllTaxes() {
  try {
    console.log('🔄 Synchronisation de toutes les taxes...')
    
    // 1. Récupérer tous les employés
    console.log('\n📋 Récupération des employés...')
    const employeesResult = await pool.query(`
      SELECT id, nom, prenom, matricule, pourcentage_taxe
      FROM employes
      WHERE statut = 'actif'
    `)
    const employees = employeesResult.rows
    console.log(`✅ ${employees.length} employés trouvés`)
    
    // 2. Pour chaque employé, mettre à jour les enregistrements cout_par_salaire
    let updatedCount = 0
    let recalculatedCount = 0
    let errorCount = 0
    
    for (const employee of employees) {
      console.log(`\n🔄 Synchronisation pour ${employee.nom} ${employee.prenom} (${employee.matricule})`)
      console.log(`   - Pourcentage taxe: ${employee.pourcentage_taxe}%`)
      
      try {
        // Mettre à jour tous les enregistrements cout_par_salaire pour cet employé
        const updateResult = await pool.query(`
          UPDATE cout_par_salaire 
          SET 
            taxe = $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE matricule = $2
          RETURNING id, nom, prenom, mois, annee, taxe, charge
        `, [employee.pourcentage_taxe, employee.matricule])
        
        if (updateResult.rows.length > 0) {
          console.log(`   ✅ ${updateResult.rows.length} enregistrement(s) mis à jour`)
          updatedCount += updateResult.rows.length
          
          // Recalculer les impôts
          for (const cout of updateResult.rows) {
            let impot = 0
            const taxe = parseFloat(employee.pourcentage_taxe) || 0
            const charge = parseFloat(cout.charge) || 0
            
            if (Math.abs(taxe - 100) < 0.01) {
              impot = 0
            } else if (Math.abs(taxe - 50) < 0.01) {
              impot = charge / 2
            } else if (Math.abs(taxe) < 0.01) {
              impot = charge
            } else {
              impot = charge
            }
            
            await pool.query(`
              UPDATE cout_par_salaire 
              SET 
                impot = $1,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = $2
            `, [impot, cout.id])
            
            recalculatedCount++
            console.log(`     - ${cout.nom} ${cout.prenom} (${cout.mois}/${cout.annee}): impôt = ${impot}€`)
          }
        } else {
          console.log(`   ⚠️ Aucun enregistrement cout_par_salaire trouvé pour ce matricule`)
        }
        
      } catch (updateError) {
        console.error(`   ❌ Erreur lors de la mise à jour:`, updateError.message)
        errorCount++
      }
    }
    
    console.log(`\n📊 Résumé de la synchronisation:`)
    console.log(`   - Employés traités: ${employees.length}`)
    console.log(`   - Enregistrements mis à jour: ${updatedCount}`)
    console.log(`   - Impôts recalculés: ${recalculatedCount}`)
    console.log(`   - Erreurs: ${errorCount}`)
    
    if (errorCount === 0) {
      console.log('\n🎯 Synchronisation terminée avec succès !')
    } else {
      console.log(`\n⚠️ Synchronisation terminée avec ${errorCount} erreur(s)`)
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error)
  } finally {
    await pool.end()
  }
}

syncAllTaxes()






