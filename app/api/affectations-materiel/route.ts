import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { logHistorique, getClientIP, getUserAgent, generateDescription } from "@/lib/historique"

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        am.*,
        m.nom_equipement,
        m.type_materiel,
        m.marque,
        m.modele,
        m.statut as materiel_statut,
        m.quantite as materiel_quantite,
        e.nom as employe_nom,
        e.prenom as employe_prenom,
        e.matricule as employe_matricule,
        e.niveau_acces as employe_niveau_acces
      FROM affectations_materiel am
      LEFT JOIN materiel m ON am.materiel_id = m.id
      LEFT JOIN employes e ON am.employe_id = e.id
      ORDER BY am.date_affectation DESC
    `)
    
    return NextResponse.json({ affectations: result.rows })
  } catch (error) {
    console.error("Erreur API affectations matériel GET:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      materiel_id,
      employe_id,
      quantite_assignee,
      date_affectation,
      commentaires,
      type_affectation = 'permanent'
    } = await request.json()

    // Validation des champs obligatoires
    if (!materiel_id || materiel_id === '' || !employe_id || employe_id === '' || !quantite_assignee || quantite_assignee === '') {
      return NextResponse.json({ 
        error: "ID matériel, ID employé et quantité assignée sont obligatoires" 
      }, { status: 400 })
    }

    // Convertir en nombres pour validation
    const materielId = parseInt(materiel_id)
    const employeId = parseInt(employe_id)
    const quantiteAssignee = parseInt(quantite_assignee)

    if (isNaN(materielId) || isNaN(employeId) || isNaN(quantiteAssignee) || quantiteAssignee <= 0) {
      return NextResponse.json({ 
        error: "Les IDs doivent être des nombres valides et la quantité doit être positive" 
      }, { status: 400 })
    }

    // Vérifier que le matériel existe et est disponible
    const materielResult = await query(
      'SELECT id, nom_equipement, quantite, statut FROM materiel WHERE id = $1',
      [materielId]
    )
    
    if (materielResult.rows.length === 0) {
      return NextResponse.json({ error: "Matériel non trouvé" }, { status: 404 })
    }

    // Vérifier que l'employé existe
    const employeResult = await query(
      'SELECT id, nom, prenom FROM employes WHERE id = $1',
      [employeId]
    )
    
    if (employeResult.rows.length === 0) {
      return NextResponse.json({ 
        error: "L'employé n'existe pas dans la base de données. Veuillez d'abord synchroniser les employés." 
      }, { status: 404 })
    }

    const materiel = materielResult.rows[0]
    const employe = employeResult.rows[0]
    // Suppression de la vérification du statut - l'affectation se fait immédiatement

    if (quantiteAssignee > parseInt(materiel.quantite)) {
      return NextResponse.json({ 
        error: "Quantité demandée supérieure au stock disponible" 
      }, { status: 400 })
    }

    // Créer l'affectation
    const insertQuery = `
      INSERT INTO affectations_materiel (
        materiel_id,
        employe_id,
        quantite_assignee,
        date_affectation,
        commentaires,
        statut,
        type_affectation
      ) VALUES ($1, $2, $3, $4, $5, 'active', $6)
      RETURNING *
    `

    const result = await query(insertQuery, [
      materielId,
      employeId,
      quantiteAssignee,
      date_affectation || new Date().toISOString(),
      commentaires || null,
      type_affectation
    ])

    // Mettre à jour la quantité disponible du matériel
    const newQuantite = parseInt(materiel.quantite) - quantiteAssignee
    await query(
      'UPDATE materiel SET quantite = $1 WHERE id = $2',
      [newQuantite, materielId]
    )

    // Enregistrer dans l'historique
    await logHistorique({
      action: 'CREATE',
      tableName: 'affectations_materiel',
      recordId: result.rows[0].id,
      section: 'Matériel',
      description: generateDescription('CREATE', 'Matériel', `Assignation: ${materiel.nom_equipement} à ${employe.prenom} ${employe.nom} (Qté: ${quantiteAssignee})`),
      newValues: result.rows[0],
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request)
    })

    return NextResponse.json({
      success: true,
      affectation: result.rows[0]
    })
  } catch (error) {
    console.error("Erreur API affectations matériel POST:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updateData } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID affectation requis" }, { status: 400 })
    }

    const fields = Object.keys(updateData).filter(key => updateData[key] !== undefined)
    if (fields.length === 0) {
      return NextResponse.json({ error: "Aucune donnée à mettre à jour" }, { status: 400 })
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ')
    const values = [id, ...fields.map(field => updateData[field])]

    const updateQuery = `
      UPDATE affectations_materiel 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `

    const result = await query(updateQuery, values)
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Affectation non trouvée" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      affectation: result.rows[0]
    })
  } catch (error) {
    console.error("Erreur API affectations matériel PUT:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "ID affectation requis" }, { status: 400 })
    }

    // Récupérer les informations utilisateur du body
    let userData: any = null
    try {
      const body = await request.json()
      userData = body._user
    } catch (e) {
      // Body vide ou invalide, continuer sans userData
    }

    // Récupérer l'affectation complète avant suppression pour l'historique
    const affectationResult = await query(`
      SELECT 
        am.*,
        m.nom_equipement,
        e.nom as employe_nom,
        e.prenom as employe_prenom
      FROM affectations_materiel am
      LEFT JOIN materiel m ON am.materiel_id = m.id
      LEFT JOIN employes e ON am.employe_id = e.id
      WHERE am.id = $1
    `, [id])

    if (affectationResult.rows.length === 0) {
      return NextResponse.json({ error: "Affectation non trouvée" }, { status: 404 })
    }

    const affectation = affectationResult.rows[0]

    // Supprimer l'affectation
    await query('DELETE FROM affectations_materiel WHERE id = $1', [id])

    // Remettre la quantité en stock seulement si ce n'est pas un matériel consommable
    if (affectation.type_affectation !== 'consommable') {
      await query(
        'UPDATE materiel SET quantite = quantite + $1 WHERE id = $2',
        [affectation.quantite_assignee, affectation.materiel_id]
      )
    }

    // Enregistrer dans l'historique
    await logHistorique({
      userName: userData?.email || userData?.name || 'Utilisateur inconnu',
      action: 'DELETE',
      tableName: 'affectations_materiel',
      recordId: parseInt(id),
      section: 'Matériel',
      description: generateDescription('DELETE', 'Affectation Matériel', `${affectation.nom_equipement} → ${affectation.employe_nom} ${affectation.employe_prenom} (${affectation.quantite_assignee} unité(s))`),
      oldValues: affectation,
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request)
    })

    return NextResponse.json({
      success: true,
      message: "Affectation supprimée avec succès"
    })
  } catch (error) {
    console.error("Erreur API affectations matériel DELETE:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}