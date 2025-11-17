import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getUserFromRequest } from "@/lib/auth"
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
      'SELECT quantite, statut FROM materiel WHERE id = $1',
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

    // 1️⃣ Récupérer l'utilisateur (headers en priorité, sinon JWT)
    const userIdHeader = request.headers.get('X-User-Id')
    const userNameHeader = request.headers.get('X-User-Name')

    let user: { id: number; email?: string; username?: string; role?: string } | null = null

    console.log('📥 Affectations DELETE - Headers reçus:', { userIdHeader, userNameHeader })

    if (userIdHeader && userNameHeader) {
      user = {
        id: parseInt(userIdHeader, 10),
        email: userNameHeader,
        username: userNameHeader,
        role: ''
      }
      console.log('✅ Affectations DELETE - User from headers:', user)
    } else {
      user = await getUserFromRequest(request)
      console.log('🔍 Affectations DELETE - User from JWT (fallback):', user)
    }

    // 2️⃣ Récupérer l'affectation complète AVANT suppression
    const affectationResult = await query(
      `SELECT am.*, m.nom_equipement, e.prenom, e.nom 
       FROM affectations_materiel am
       LEFT JOIN materiel m ON am.materiel_id = m.id
       LEFT JOIN employes e ON am.employe_id = e.id
       WHERE am.id = $1`,
      [id]
    )

    if (affectationResult.rows.length === 0) {
      return NextResponse.json({ error: "Affectation non trouvée" }, { status: 404 })
    }

    const deletedData = affectationResult.rows[0]

    // 3️⃣ Supprimer l'affectation
    await query('DELETE FROM affectations_materiel WHERE id = $1', [id])

    // 4️⃣ Remettre la quantité en stock seulement si ce n'est pas un matériel consommable
    if (deletedData.type_affectation !== 'consommable') {
      await query(
        'UPDATE materiel SET quantite = quantite + $1 WHERE id = $2',
        [deletedData.quantite_assignee, deletedData.materiel_id]
      )
    }

    // 5️⃣ Construire le label utilisateur + description
    const userEmail = user?.email || user?.username || undefined
    const userLabel = userEmail || 'Utilisateur inconnu'

    const description = generateDescription(
      'DELETE',
      'Matériel',
      `Désassignation: ${deletedData.nom_equipement} de ${deletedData.prenom} ${deletedData.nom} (Qté: ${deletedData.quantite_assignee})`,
      userEmail
    )

    // 6️⃣ Enregistrer dans l'historique
    await logHistorique({
      userId: user?.id,
      userName: userLabel,
      action: 'DELETE',
      tableName: 'affectations_materiel',
      recordId: parseInt(id),
      section: 'Matériel',
      description,
      oldValues: deletedData,
      newValues: null,
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