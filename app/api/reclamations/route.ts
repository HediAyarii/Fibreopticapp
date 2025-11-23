import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { addNoCacheHeaders } from "@/lib/cache-headers"
import { sendReclamationNotification } from "@/lib/socketio"
import { logHistorique, getClientIP, getUserAgent } from "@/lib/historique"

export const dynamic = 'force-dynamic'

// Fonction helper pour valider et nettoyer les valeurs entières
const validateAndCleanInteger = (value: any, fieldName: string) => {
  if (value === '' || value === undefined || value === null) {
    return null
  }
  
  if (typeof value === 'string' && !isNaN(Number(value))) {
    const numValue = Number(value)
    // Vérifier que la valeur est dans la plage des entiers PostgreSQL (32-bit)
    if (numValue < -2147483648 || numValue > 2147483647) {
      console.log(`⚠️ Valeur ${fieldName} trop grande: ${numValue}, réinitialisation à null`)
      return null
    }
    return numValue
  }
  
  if (typeof value === 'number') {
    if (value < -2147483648 || value > 2147483647) {
      console.log(`⚠️ Valeur ${fieldName} trop grande: ${value}, réinitialisation à null`)
      return null
    }
    return value
  }
  
  return null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeId = searchParams.get('employe_id')
    const date_debut = searchParams.get('date_debut')
    const date_fin = searchParams.get('date_fin')
    
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
    let whereConditions: string[] = []
    let paramIndex = 1
    
    if (employeId) {
      whereConditions.push(`r.employe_id = $${paramIndex}`)
      params.push(employeId)
      paramIndex++
    }
    
    // Filtres de date sur created_at ou date_reclamation
    if (date_debut) {
      whereConditions.push(`(r.created_at >= $${paramIndex}::date OR COALESCE(r.date_reclamation, r.created_at) >= $${paramIndex}::date)`)
      params.push(date_debut)
      paramIndex++
    }
    
    if (date_fin) {
      whereConditions.push(`(r.created_at <= $${paramIndex}::date OR COALESCE(r.date_reclamation, r.created_at) <= $${paramIndex}::date)`)
      params.push(date_fin)
      paramIndex++
    }
    
    if (whereConditions.length > 0) {
      queryText += ' WHERE ' + whereConditions.join(' AND ')
    }
    
    queryText += ' ORDER BY r.created_at DESC'
    
    const result = await query(queryText, params)
    
    // Pour chaque réclamation, récupérer les photos
    const reclamationsWithPhotos = await Promise.all(
      result.rows.map(async (reclamation) => {
        try {
          const photosResult = await query(`
            SELECT id, photo_name, photo_path, mime_type, file_size, uploaded_at
            FROM reclamation_photos 
            WHERE reclamation_id = $1
            ORDER BY uploaded_at ASC
          `, [reclamation.id])
          
          return {
            ...reclamation,
            photos: photosResult.rows.map(photo => ({
              id: photo.id,
              name: photo.photo_name,
              type: photo.mime_type,
              size: photo.file_size,
              uploadedAt: photo.uploaded_at,
              url: photo.photo_path || `/api/reclamations/photos/${photo.id}`
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
    const body = await request.json()
    const { _user, ...data } = body
    
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

    // Vérifier si l'intervention existe si un ID est fourni (avertissement seulement)
    let validInterventionId = intervention_id || null
    if (intervention_id && intervention_id !== '') {
      const interventionCheck = await query(
        'SELECT id FROM interventions WHERE id = $1',
        [intervention_id]
      )
      if (interventionCheck.rows.length > 0) {
        console.log(`✅ Intervention ${intervention_id} trouvée - lien créé automatiquement`)
      } else {
        console.log(`⚠️ AVERTISSEMENT: Intervention ${intervention_id} n'existe pas encore - réclamation créée avec lien vers intervention future`)
      }
    }

    // Vérifier si l'employé existe si un ID est fourni (blocage car les employés doivent exister)
    if (employe_id && employe_id !== '') {
      const employeCheck = await query('SELECT id FROM employes WHERE id = $1', [employe_id])
      if (employeCheck.rows.length === 0) {
        return NextResponse.json({ 
          error: `L'employé avec l'ID ${employe_id} n'existe pas dans la base de données.` 
        }, { status: 400 })
      }
    }

    // Nettoyer les données : convertir les chaînes vides en null pour les champs entiers et dates
    const cleanedData = {
      client_id: validateAndCleanInteger(client_id, 'client_id'),
      intervention_id: validateAndCleanInteger(validInterventionId, 'intervention_id'),
      employe_id: validateAndCleanInteger(employe_id, 'employe_id'),
      satisfaction_client: validateAndCleanInteger(satisfaction_client, 'satisfaction_client'),
      cout_reclamation: validateAndCleanInteger(cout_reclamation, 'cout_reclamation') || 0,
      indemnisation: validateAndCleanInteger(indemnisation, 'indemnisation') || 0,
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
    
    // Envoyer une notification au technicien
    if (cleanedData.employe_id) {
      try {
        const reclamationData = {
          numero_reclamation: numeroReclamation,
          type_reclamation: type_reclamation,
          priorite: priorite || 'normale',
          description: cleanedData.description_probleme.substring(0, 100),
          delai_resolution: 0,
          intervention_client: nom_client,
          date_creation: new Date().toISOString()
        }
        
        const socketNotificationSent = sendReclamationNotification(cleanedData.employe_id, reclamationData)
        console.log(`📨 Notification Socket.IO réclamation: ${socketNotificationSent ? 'OUI' : 'NON'}`)
      } catch (notificationError) {
        console.error('❌ Erreur envoi notification réclamation:', notificationError)
      }
    }
    
    // Enregistrer dans l'historique
    const employeInfo = cleanedData.employe_id 
      ? await query('SELECT nom, prenom FROM employes WHERE id = $1', [cleanedData.employe_id])
      : null
    const employeNom = employeInfo?.rows.length > 0 
      ? `${employeInfo.rows[0].prenom} ${employeInfo.rows[0].nom}` 
      : technicien_responsable || 'Technicien non assigné'

    await logHistorique({
      userName: _user?.email || _user?.name || 'Utilisateur inconnu',
      action: 'CREATE',
      tableName: 'reclamations',
      recordId: result.rows[0].id,
      section: 'Réclamations',
      description: `Nouvelle réclamation - ${numeroReclamation} - ${nom_client} - ${type_reclamation} - Assignée à ${employeNom}`,
      newValues: result.rows[0],
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request)
    })

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
    const body = await request.json()
    const { id, _user, ...updateData } = body

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
      cleanedData[field] = validateAndCleanInteger(cleanedData[field], field)
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

    // Supprimer les champs calculés côté frontend qui ne doivent pas être dans la base de données
    delete cleanedData.deadline_calculated
    delete cleanedData.deadline

    // Vérifier intervention_id si présent (avertissement seulement, pas de blocage)
    if (cleanedData.intervention_id && cleanedData.intervention_id !== null) {
      const interventionCheck = await query('SELECT id FROM interventions WHERE id = $1', [cleanedData.intervention_id])
      if (interventionCheck.rows.length === 0) {
        console.log(`⚠️ AVERTISSEMENT: L'intervention avec l'ID ${cleanedData.intervention_id} n'existe pas encore dans la base de données. Réclamation mise à jour avec un lien vers une intervention future.`)
      } else {
        console.log(`✅ Intervention ${cleanedData.intervention_id} trouvée et liée à la réclamation.`)
      }
    }

    // Valider employe_id si présent (blocage pour les employés car ils doivent exister)
    if (cleanedData.employe_id && cleanedData.employe_id !== null) {
      const employeCheck = await query('SELECT id FROM employes WHERE id = $1', [cleanedData.employe_id])
      if (employeCheck.rows.length === 0) {
        return NextResponse.json({ 
          error: `L'employé avec l'ID ${cleanedData.employe_id} n'existe pas dans la base de données.` 
        }, { status: 400 })
      }
    }

    const fields = Object.keys(cleanedData).filter(key => cleanedData[key] !== undefined)
    if (fields.length === 0) {
      return NextResponse.json({ error: "Aucune donnée à mettre à jour" }, { status: 400 })
    }

    // Récupérer les anciennes valeurs avec infos employé
    const oldDataResult = await query(`
      SELECT r.*, e.nom as employe_nom, e.prenom as employe_prenom
      FROM reclamations r
      LEFT JOIN employes e ON r.employe_id = e.id
      WHERE r.id = $1
    `, [id])
    
    if (oldDataResult.rows.length === 0) {
      return NextResponse.json({ error: "Réclamation non trouvée" }, { status: 404 })
    }
    
    const oldData = oldDataResult.rows[0]

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

    const newData = result.rows[0]

    // Générer une description détaillée des modifications
    const changes: string[] = []
    
    if (oldData.statut !== newData.statut) {
      changes.push(`Statut: ${oldData.statut} → ${newData.statut}`)
    }
    if (oldData.priorite !== newData.priorite) {
      changes.push(`Priorité: ${oldData.priorite} → ${newData.priorite}`)
    }
    if (oldData.employe_id !== newData.employe_id) {
      const newEmployeInfo = newData.employe_id 
        ? await query('SELECT nom, prenom FROM employes WHERE id = $1', [newData.employe_id])
        : null
      const oldEmployeName = oldData.employe_prenom && oldData.employe_nom 
        ? `${oldData.employe_prenom} ${oldData.employe_nom}` 
        : 'Non assigné'
      const newEmployeName = newEmployeInfo?.rows.length > 0 
        ? `${newEmployeInfo.rows[0].prenom} ${newEmployeInfo.rows[0].nom}` 
        : 'Non assigné'
      changes.push(`Technicien: ${oldEmployeName} → ${newEmployeName}`)
    }
    if (oldData.description_solution !== newData.description_solution) {
      changes.push(`Solution ajoutée/modifiée`)
    }
    if (oldData.date_resolution !== newData.date_resolution && newData.date_resolution) {
      changes.push(`Résolue le ${new Date(newData.date_resolution).toLocaleDateString('fr-FR')}`)
    }
    if (oldData.satisfaction_client !== newData.satisfaction_client) {
      changes.push(`Satisfaction: ${oldData.satisfaction_client || 'N/A'} → ${newData.satisfaction_client || 'N/A'}`)
    }
    
    const detailedDescription = changes.length > 0 
      ? `${oldData.numero_reclamation} - ${oldData.nom_client} - ${changes.join(', ')}`
      : `${oldData.numero_reclamation} - ${oldData.nom_client} (aucune modification détectable)`

    // Enregistrer dans l'historique
    await logHistorique({
      userName: _user?.email || _user?.name || 'Utilisateur inconnu',
      action: 'UPDATE',
      tableName: 'reclamations',
      recordId: id,
      section: 'Réclamations',
      description: `Modification réclamation - ${detailedDescription}`,
      oldValues: oldData,
      newValues: result.rows[0],
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request)
    })

    // Envoyer notification SSE au technicien si la réclamation lui est assignée et qu'il y a eu des changements importants
    const updatedReclamation = result.rows[0]
    if (updatedReclamation.employe_id && (oldData.statut !== updatedReclamation.statut || oldData.commentaires_internes !== updatedReclamation.commentaires_internes)) {
      try {
        const { sendToTechnicien } = await import('@/app/api/sse/technicien/route')
        sendToTechnicien(updatedReclamation.employe_id, 'reclamation_updated', {
          id: updatedReclamation.id,
          numero_reclamation: updatedReclamation.numero_reclamation,
          statut: updatedReclamation.statut,
          commentaires_internes: updatedReclamation.commentaires_internes,
          message: updatedReclamation.statut === 'resolue' 
            ? 'Votre réclamation a été résolue'
            : 'Votre réclamation a été mise à jour par l\'administration'
        })
        console.log('✅ Notification SSE envoyée au technicien', updatedReclamation.employe_id)
      } catch (sseError) {
        console.log('⚠️ SSE non disponible:', sseError)
      }
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
    const body = await request.json()
    const { id, _user } = body

    if (!id) {
      return NextResponse.json({ error: "ID réclamation requis" }, { status: 400 })
    }

    // Récupérer les données avant suppression
    const oldDataResult = await query(
      'SELECT * FROM reclamations WHERE id = $1',
      [id]
    )
    
    if (oldDataResult.rows.length === 0) {
      return NextResponse.json({ error: "Réclamation non trouvée" }, { status: 404 })
    }
    
    const deletedData = oldDataResult.rows[0]

    const result = await query('DELETE FROM reclamations WHERE id = $1 RETURNING *', [id])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Réclamation non trouvée" }, { status: 404 })
    }

    // Enregistrer dans l'historique
    await logHistorique({
      userName: _user?.email || _user?.name || 'Utilisateur inconnu',
      action: 'DELETE',
      tableName: 'reclamations',
      recordId: parseInt(id),
      section: 'Réclamations',
      description: `Suppression réclamation - ${deletedData.numero_reclamation} - ${deletedData.nom_client} - ${deletedData.type_reclamation}`,
      oldValues: deletedData,
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request)
    })

    return NextResponse.json({
      success: true,
      message: "Réclamation supprimée avec succès"
    })
  } catch (error) {
    console.error("Erreur API réclamations DELETE:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
