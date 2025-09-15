import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeId = searchParams.get('employe_id')
    
    let queryText = `
      SELECT r.*, 
             e.nom as employe_nom, e.prenom as employe_prenom,
             i.num_inter, i.client as intervention_client
      FROM reclamations r 
      LEFT JOIN employes e ON r.employe_id = e.id 
      LEFT JOIN interventions i ON r.intervention_id = i.id
    `
    let params: any[] = []
    
    if (employeId) {
      queryText += ' WHERE r.employe_id = $1'
      params = [employeId]
    }
    
    queryText += ' ORDER BY r.created_at DESC'
    
    const result = await query(queryText, params)
    return NextResponse.json({ reclamations: result.rows })
  } catch (error) {
    console.error("Erreur API réclamations GET:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      numero_reclamation,
      type_reclamation,
      priorite,
      statut,
      client_id,
      nom_client,
      telephone_client,
      email_client,
      adresse_client,
      intervention_id,
      employe_id,
      technicien_responsable,
      description_probleme,
      description_solution,
      date_resolution,
      temps_resolution,
      satisfaction_client,
      commentaires_client,
      commentaires_internes,
      cout_reclamation,
      indemnisation,
      materiel_defectueux,
      garantie_applicable,
      escalade_requise,
      manager_notifie
    } = await request.json()

    // Générer un numéro de réclamation si non fourni
    let numeroReclamation = numero_reclamation
    if (!numeroReclamation) {
      const countResult = await query('SELECT COUNT(*) as count FROM reclamations')
      const count = parseInt(countResult.rows[0].count) + 1
      numeroReclamation = `REC-${new Date().getFullYear()}-${count.toString().padStart(4, '0')}`
    }

    // Vérifier si la réclamation existe déjà
    const existing = await query(
      'SELECT id FROM reclamations WHERE numero_reclamation = $1',
      [numeroReclamation]
    )
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Une réclamation avec ce numéro existe déjà" }, { status: 400 })
    }

    // Nettoyer les données : convertir les chaînes vides en null pour les champs entiers et dates
    const cleanedData = {
      client_id: client_id === '' ? null : client_id,
      intervention_id: intervention_id === '' ? null : intervention_id,
      employe_id: employe_id === '' ? null : employe_id,
      satisfaction_client: satisfaction_client === '' ? null : satisfaction_client,
      cout_reclamation: cout_reclamation === '' ? null : (cout_reclamation || 0),
      indemnisation: indemnisation === '' ? null : (indemnisation || 0),
      date_resolution: date_resolution === '' ? null : date_resolution,
      temps_resolution: temps_resolution === '' ? null : temps_resolution,
      materiel_defectueux: materiel_defectueux === '' ? null : materiel_defectueux,
      garantie_applicable: garantie_applicable === '' ? false : (garantie_applicable || false),
      escalade_requise: escalade_requise === '' ? false : (escalade_requise || false),
      manager_notifie: manager_notifie === '' ? false : (manager_notifie || false)
    }

    const insertQuery = `
      INSERT INTO reclamations (
        numero_reclamation, type_reclamation, priorite, statut, client_id,
        nom_client, telephone_client, email_client, adresse_client,
        intervention_id, employe_id, technicien_responsable, description_probleme,
        description_solution, date_resolution, temps_resolution, satisfaction_client,
        commentaires_client, commentaires_internes, cout_reclamation, indemnisation,
        materiel_defectueux, garantie_applicable, escalade_requise, manager_notifie
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25
      ) RETURNING *
    `

    const values = [
      numeroReclamation, type_reclamation, priorite || 'normale', statut || 'ouverte',
      cleanedData.client_id, nom_client, telephone_client, email_client, adresse_client,
      cleanedData.intervention_id, cleanedData.employe_id, technicien_responsable, description_probleme,
      description_solution, cleanedData.date_resolution, cleanedData.temps_resolution, cleanedData.satisfaction_client,
      commentaires_client, commentaires_internes, cleanedData.cout_reclamation, cleanedData.indemnisation,
      cleanedData.materiel_defectueux, cleanedData.garantie_applicable, cleanedData.escalade_requise,
      cleanedData.manager_notifie
    ]

    const result = await query(insertQuery, values)
    
    return NextResponse.json({
      success: true,
      reclamation: result.rows[0]
    })
  } catch (error) {
    console.error("Erreur API réclamations POST:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updateData } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID réclamation requis" }, { status: 400 })
    }

    // Nettoyer les données : convertir les chaînes vides en null pour les champs entiers et dates
    const cleanedData = { ...updateData }
    
    // Champs entiers qui doivent être null si vides
    const integerFields = ['client_id', 'intervention_id', 'employe_id', 'satisfaction_client', 'cout_reclamation', 'indemnisation']
    
    // Champs de date qui doivent être null si vides
    const dateFields = ['date_resolution', 'temps_resolution']
    
    // Champs booléens qui doivent être false si vides
    const booleanFields = ['garantie_applicable', 'escalade_requise', 'manager_notifie']
    
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
    
    booleanFields.forEach(field => {
      if (cleanedData[field] === '' || cleanedData[field] === undefined) {
        cleanedData[field] = false
      }
    })

    const fields = Object.keys(cleanedData).filter(key => cleanedData[key] !== undefined)
    if (fields.length === 0) {
      return NextResponse.json({ error: "Aucune donnée à mettre à jour" }, { status: 400 })
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ')
    const values = [id, ...fields.map(field => cleanedData[field])]

    const updateQuery = `
      UPDATE reclamations 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `

    const result = await query(updateQuery, values)
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Réclamation non trouvée" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      reclamation: result.rows[0]
    })
  } catch (error) {
    console.error("Erreur API réclamations PUT:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "ID réclamation requis" }, { status: 400 })
    }

    const result = await query('DELETE FROM reclamations WHERE id = $1 RETURNING *', [id])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Réclamation non trouvée" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Réclamation supprimée avec succès"
    })
  } catch (error) {
    console.error("Erreur API réclamations DELETE:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
