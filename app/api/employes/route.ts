import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET() {
  try {
    // D'abord synchroniser les employés avec les interventions
    await syncEmployeesFromInterventions()
    
    // Puis récupérer tous les employés
    const result = await query('SELECT * FROM employes ORDER BY created_at DESC')
    return NextResponse.json({ employes: result.rows })
  } catch (error) {
    console.error("Erreur API employés GET:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

async function syncEmployeesFromInterventions() {
  try {
    // Récupérer tous les techniciens distincts des interventions
    const interventionsResult = await query(`
      SELECT DISTINCT 
        nom_technicien, 
        prenom_technicien,
        COUNT(*) as nb_interventions
      FROM interventions 
      WHERE nom_technicien IS NOT NULL 
      AND prenom_technicien IS NOT NULL
      AND nom_technicien != 'nan'
      AND prenom_technicien != 'nan'
      GROUP BY nom_technicien, prenom_technicien
      ORDER BY nb_interventions DESC
    `)

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
        
        console.log(`[SYNC] Employé créé: ${prenom_technicien} ${nom_technicien} (${nb_interventions} interventions)`)
      }
    }
  } catch (error) {
    console.error("Erreur synchronisation employés:", error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      matricule,
      nom,
      prenom,
      email,
      telephone,
      poste,
      departement,
      manager_id,
      date_embauche,
      statut,
      niveau_acces,
      region,
      plaque_vehicule,
      numero_carte_carburant,
      salaire_base,
      taux_horaire,
      pourcentage_taxe,
      heures_travaillees,
      heures_supplementaires,
      prime_performance,
      penalites_total,
      notes_performance,
      competences,
      certifications,
      date_derniere_evaluation,
      commentaires
    } = await request.json()

    // Vérifier si l'employé existe déjà (par matricule ou email)
    if (matricule) {
      const existingByMatricule = await query(
        'SELECT id FROM employes WHERE matricule = $1',
        [matricule]
      )
      if (existingByMatricule.rows.length > 0) {
        return NextResponse.json({ error: "Un employé avec ce matricule existe déjà" }, { status: 400 })
      }
    }

    if (email) {
      const existingByEmail = await query(
        'SELECT id FROM employes WHERE email = $1',
        [email]
      )
      if (existingByEmail.rows.length > 0) {
        return NextResponse.json({ error: "Un employé avec cet email existe déjà" }, { status: 400 })
      }
    }

    const insertQuery = `
      INSERT INTO employes (
        matricule, nom, prenom, email, telephone, poste, departement,
        manager_id, date_embauche, statut, niveau_acces, region,
        plaque_vehicule, numero_carte_carburant, salaire_base, taux_horaire, pourcentage_taxe,
        heures_travaillees, heures_supplementaires, prime_performance,
        penalites_total, notes_performance, competences, certifications,
        date_derniere_evaluation, commentaires
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23, $24, $25, $26
      ) RETURNING *
    `

    const values = [
      matricule, nom, prenom, email, telephone, poste, departement,
      manager_id, date_embauche, statut || 'actif', niveau_acces || 'technicien',
      region, plaque_vehicule, numero_carte_carburant, salaire_base, taux_horaire, pourcentage_taxe,
      heures_travaillees || 0, heures_supplementaires || 0, prime_performance || 0,
      penalites_total || 0, notes_performance, competences, certifications,
      date_derniere_evaluation, commentaires
    ]

    const result = await query(insertQuery, values)
    
    return NextResponse.json({
      success: true,
      employe: result.rows[0]
    })
  } catch (error) {
    console.error("Erreur API employés POST:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updateData } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID employé requis" }, { status: 400 })
    }

    // Nettoyer les données : convertir les chaînes vides en null pour les champs entiers et dates
    const cleanedData = { ...updateData }
    
    // Champs entiers qui doivent être null si vides
    const integerFields = ['manager_id', 'salaire_base', 'taux_horaire', 'pourcentage_taxe', 
                          'heures_travaillees', 'heures_supplementaires', 'prime_performance', 
                          'penalites_total']
    
    // Champs de date qui doivent être null si vides
    const dateFields = ['date_embauche', 'date_derniere_evaluation']
    
    integerFields.forEach(field => {
      if (cleanedData[field] === '' || cleanedData[field] === undefined) {
        cleanedData[field] = null
      } else if (typeof cleanedData[field] === 'string' && !isNaN(Number(cleanedData[field]))) {
        cleanedData[field] = Number(cleanedData[field])
      }
    })
    
    dateFields.forEach(field => {
      if (cleanedData[field] === '' || cleanedData[field] === undefined) {
        cleanedData[field] = null
      }
    })

    // Construire la requête de mise à jour dynamiquement
    const fields = Object.keys(cleanedData).filter(key => cleanedData[key] !== undefined)
    if (fields.length === 0) {
      return NextResponse.json({ error: "Aucune donnée à mettre à jour" }, { status: 400 })
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ')
    const values = [id, ...fields.map(field => cleanedData[field])]

    const updateQuery = `
      UPDATE employes 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `

    const result = await query(updateQuery, values)
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Employé non trouvé" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      employe: result.rows[0]
    })
  } catch (error) {
    console.error("Erreur API employés PUT:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "ID employé requis" }, { status: 400 })
    }

    const result = await query('DELETE FROM employes WHERE id = $1 RETURNING *', [id])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Employé non trouvé" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Employé supprimé avec succès"
    })
  } catch (error) {
    console.error("Erreur API employés DELETE:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
