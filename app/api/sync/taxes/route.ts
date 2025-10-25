import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Synchronisation automatique des taxes...')
    
    // Désactiver temporairement les triggers
    await query('ALTER TABLE cout_par_salaire DISABLE TRIGGER ALL')
    
    // Récupérer tous les employés avec des charges
    const employees = await query(`
      SELECT DISTINCT nom, prenom, mois, annee, id, taxe, impot, charge
      FROM cout_par_salaire 
      WHERE nom IS NOT NULL AND prenom IS NOT NULL
      ORDER BY nom, prenom, annee, mois
    `)
    
    console.log(`📋 ${employees.rows.length} employés trouvés`)
    
    let totalUpdated = 0
    let totalSkipped = 0
    const updates = []
    
    // Synchroniser les taxes pour chaque employé
    for (const employee of employees.rows) {
      try {
        // Récupérer la taxe depuis la table employes
        const employeeData = await query(`
          SELECT pourcentage_taxe, statut
          FROM employes 
          WHERE LOWER(nom) = LOWER($1) AND LOWER(prenom) = LOWER($2) AND statut = 'actif'
        `, [employee.nom, employee.prenom])
        
        // Déterminer la taxe correcte
        let correctTaxe = 50 // Valeur par défaut
        if (employeeData.rows.length > 0) {
          correctTaxe = employeeData.rows[0].pourcentage_taxe || 50
        }
        
        const currentTaxe = parseFloat(employee.taxe) || 0
        const currentImpot = parseFloat(employee.impot) || 0
        const currentCharge = parseFloat(employee.charge) || 0
        
        // Calculer l'impôt correct
        let correctImpot = currentCharge * (correctTaxe / 100)
        
        // Vérifier si une correction est nécessaire
        const taxeDifference = Math.abs(currentTaxe - correctTaxe)
        const impotDifference = Math.abs(currentImpot - correctImpot)
        
        if (taxeDifference > 0.01 || impotDifference > 0.01) {
          console.log(`🔄 Correction: ${employee.nom} ${employee.prenom} (${currentTaxe}% → ${correctTaxe}%)`)
          
          // Mettre à jour la taxe et l'impôt
          await query(`
            UPDATE cout_par_salaire 
            SET 
              taxe = $1,
              impot = $2,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
          `, [correctTaxe, correctImpot, employee.id])
          
          // Recalculer le RAP
          const salaireNet = await query(`SELECT salaire_net FROM cout_par_salaire WHERE id = $1`, [employee.id])
          const prime = await query(`SELECT prime FROM cout_par_salaire WHERE id = $1`, [employee.id])
          const totalGenere = await query(`SELECT total_genere FROM cout_par_salaire WHERE id = $1`, [employee.id])
          
          const salaireNetValue = parseFloat(salaireNet.rows[0]?.salaire_net) || 0
          const primeValue = parseFloat(prime.rows[0]?.prime) || 0
          const totalGenereValue = parseFloat(totalGenere.rows[0]?.total_genere) || 0
          const newRap = totalGenereValue - salaireNetValue - correctImpot + primeValue
          
          await query(`
            UPDATE cout_par_salaire 
            SET 
              rap = $1,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [newRap, employee.id])
          
          totalUpdated++
          updates.push({
            employe: `${employee.nom} ${employee.prenom}`,
            periode: `${employee.mois}/${employee.annee}`,
            ancienne_taxe: currentTaxe,
            nouvelle_taxe: correctTaxe,
            ancien_impot: currentImpot,
            nouveau_impot: correctImpot
          })
        } else {
          totalSkipped++
        }
        
      } catch (error) {
        console.error(`❌ Erreur pour ${employee.nom} ${employee.prenom}:`, error)
      }
    }
    
    // Réactiver les triggers
    await query('ALTER TABLE cout_par_salaire ENABLE TRIGGER ALL')
    
    console.log(`🎯 Synchronisation des taxes terminée !`)
    console.log(`📊 Résultats: ${totalUpdated} mis à jour, ${totalSkipped} déjà à jour`)
    
    return NextResponse.json({
      success: true,
      message: 'Synchronisation automatique des taxes terminée',
      total_employees: employees.rows.length,
      updated: totalUpdated,
      skipped: totalSkipped,
      updates: updates
    })
    
  } catch (error) {
    console.error('❌ Erreur synchronisation taxes:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur lors de la synchronisation des taxes' 
    }, { status: 500 })
  }
}
