import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    console.log('[SYNC] Début de la synchronisation des employés depuis les interventions...')
    
    // Récupérer tous les techniciens distincts des interventions
    const interventionsResult = await query(`
      SELECT DISTINCT 
        nom_technicien, 
        prenom_technicien,
        COUNT(*) as nb_interventions,
        MIN(date_rdv) as premiere_intervention,
        MAX(date_rdv) as derniere_intervention
      FROM interventions 
      WHERE nom_technicien IS NOT NULL 
      AND prenom_technicien IS NOT NULL
      AND nom_technicien != 'nan'
      AND prenom_technicien != 'nan'
      GROUP BY nom_technicien, prenom_technicien
      ORDER BY nb_interventions DESC
    `)

    let created = 0
    let updated = 0
    let skipped = 0

    for (const intervention of interventionsResult.rows) {
      const { nom_technicien, prenom_technicien, nb_interventions } = intervention
      
      // Générer un matricule basé sur le nom/prénom
      const matricule = `EMP${nom_technicien.substring(0, 3).toUpperCase()}${prenom_technicien.substring(0, 2).toUpperCase()}`
      
      // Vérifier si l'employé existe déjà (par nom et prénom)
      const existingEmployee = await query(
        'SELECT id FROM employes WHERE nom = $1 AND prenom = $2',
        [nom_technicien, prenom_technicien]
      )
      
      if (existingEmployee.rows.length === 0) {
        // Créer le nouvel employé avec seulement les champs essentiels
        await query(`
          INSERT INTO employes (
            matricule, nom, prenom, statut, commentaires, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, NOW(), NOW()
          )
        `, [
          matricule,
          nom_technicien,
          prenom_technicien,
          'actif',
          `Technicien avec ${nb_interventions} interventions réalisées - À compléter par l'admin`
        ])
        
        created++
        console.log(`[SYNC] Employé créé: ${prenom_technicien} ${nom_technicien} (${nb_interventions} interventions)`)
      } else {
        // Mettre à jour seulement le commentaire avec le nombre d'interventions
        await query(`
          UPDATE employes 
          SET 
            commentaires = $1,
            updated_at = NOW()
          WHERE nom = $2 AND prenom = $3
        `, [
          `Technicien avec ${nb_interventions} interventions réalisées - À compléter par l'admin`,
          nom_technicien,
          prenom_technicien
        ])
        
        updated++
        console.log(`[SYNC] Employé mis à jour: ${prenom_technicien} ${nom_technicien} (${nb_interventions} interventions)`)
      }
    }
    
    // Récupérer le nombre total d'employés
    const totalResult = await query('SELECT COUNT(*) as total FROM employes')
    const total = totalResult.rows[0].total
    
    console.log(`[SYNC] Synchronisation terminée: ${created} créés, ${updated} mis à jour, ${skipped} ignorés`)
    
    return NextResponse.json({
      success: true,
      message: 'Synchronisation des employés terminée',
      stats: {
        created,
        updated,
        skipped,
        total: parseInt(total)
      }
    })
    
  } catch (error) {
    console.error("Erreur synchronisation employés:", error)
    return NextResponse.json(
      { error: "Erreur lors de la synchronisation des employés" },
      { status: 500 }
    )
  }
}
