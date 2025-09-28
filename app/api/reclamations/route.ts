import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { addNoCacheHeaders } from "@/lib/cache-headers"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeId = searchParams.get('employe_id')
    
    let queryText = `
      SELECT r.*, 
             e.nom as employe_nom, e.prenom as employe_prenom,
             i.num_inter as numero_intervention, 
             i.client as intervention_client,
             i.date_rdv as date_intervention,
             i.statut as intervention_statut
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
    
    // Pour chaque réclamation, récupérer les photos
    const reclamationsWithPhotos = await Promise.all(
      result.rows.map(async (reclamation) => {
        try {
          const photosResult = await query(`
            SELECT id, photo_name, photo_type, photo_size, uploaded_at
            FROM reclamation_photos 
            WHERE reclamation_id = $1
            ORDER BY uploaded_at ASC
          `, [reclamation.id])
          
          return {
            ...reclamation,
            photos: photosResult.rows.map(photo => ({
              id: photo.id,
              name: photo.photo_name,
              type: photo.photo_type,
              size: photo.photo_size,
              uploadedAt: photo.uploaded_at,
              url: `/api/reclamations/photos/${photo.id}`
            }))
          }
        } catch (error) {
          console.error(`Erreur récupération photos pour réclamation ${reclamation.id}:`, error)
          return {
            ...reclamation,
            photos: []
          }
        }
      })
    )
    
    const response = NextResponse.json({ reclamations: reclamationsWithPhotos })
    return addNoCacheHeaders(response)
  } catch (error) {
    console.error("Erreur API réclamations GET:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    console.log("📝 Received reclamation data:", {
      keys: Object.keys(data),
      values: Object.entries(data).reduce((acc, [key, value]) => {
        acc[key] = typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : value
        return acc
      }, {} as any)
    })
    
    // Mapper les noms de champs du formulaire vers ceux de l'API
    const {
      numero_reclamation = data.numero_reclamation,
      type_reclamation = data.type_reclamation,
      priorite = data.priorite,
      statut = data.statut,
      client_id = data.client_id,
      nom_client = data.nom_client || data.client, // Support both field names
      telephone_client = data.telephone_client,
      email_client = data.email_client,
      adresse_client = data.adresse_client,
      intervention_id = data.intervention_id || data.intervention_concernee, // Support both field names
      employe_id = data.employe_id || data.employe_responsable, // Support both field names
      technicien_responsable = data.technicien_responsable,
      description_probleme = data.description_probleme || data.description, // Support both field names
      description_solution = data.description_solution || data.resolution, // Support both field names
      date_resolution = data.date_resolution,
      temps_resolution = data.temps_resolution,
      satisfaction_client = data.satisfaction_client,
      commentaires_client = data.commentaires_client,
      commentaires_internes = data.commentaires_internes || data.commentaires, // Support both field names
      cout_reclamation = data.cout_reclamation,
      indemnisation = data.indemnisation,
      materiel_defectueux = data.materiel_defectueux,
      garantie_applicable = data.garantie_applicable,
      escalade_requise = data.escalade_requise,
      manager_notifie = data.manager_notifie
    } = data

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

    // Validation des champs requis
    if (!description_probleme || description_probleme.trim() === '') {
      console.error("❌ Validation failed: description_probleme is empty or null")
      return NextResponse.json({ error: "La description du problème est requise" }, { status: 400 })
    }

    if (!nom_client || nom_client.trim() === '') {
      console.error("❌ Validation failed: nom_client is empty or null")
      return NextResponse.json({ error: "Le nom du client est requis" }, { status: 400 })
    }

    if (!type_reclamation || type_reclamation.trim() === '') {
      console.error("❌ Validation failed: type_reclamation is empty or null")
      return NextResponse.json({ error: "Le type de réclamation est requis" }, { status: 400 })
    }

    console.log("✅ Validation passed. Creating reclamation with data:", {
      numero_reclamation,
      nom_client,
      type_reclamation,
      description_probleme: description_probleme.substring(0, 50) + "...",
      employe_id,
      intervention_id
    })

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
      manager_notifie: manager_notifie === '' ? false : (manager_notifie || false),
      description_probleme: description_probleme.trim() // Assurer que la description n'est pas vide
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
      cleanedData.intervention_id, cleanedData.employe_id, technicien_responsable, cleanedData.description_probleme,
      description_solution, cleanedData.date_resolution, cleanedData.temps_resolution, cleanedData.satisfaction_client,
      commentaires_client, commentaires_internes, cleanedData.cout_reclamation, cleanedData.indemnisation,
      cleanedData.materiel_defectueux, cleanedData.garantie_applicable, cleanedData.escalade_requise,
      cleanedData.manager_notifie
    ]

    const result = await query(insertQuery, values)
    
    const response = NextResponse.json({
      success: true,
      reclamation: result.rows[0]
    })
    
    return addNoCacheHeaders(response)
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

    const response = NextResponse.json({
      success: true,
      reclamation: result.rows[0]
    })
    
    return addNoCacheHeaders(response)
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
