import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        a.*,
        m.nom_equipement,
        m.type_materiel,
        m.marque,
        m.modele,
        m.prix_unitaire,
        e.nom as employe_nom,
        e.prenom as employe_prenom
      FROM affectations_materiel a
      LEFT JOIN materiel m ON a.materiel_id = m.id
      LEFT JOIN employes e ON a.employe_id = e.id
      ORDER BY a.created_at DESC
    `)
    // Convertir les valeurs numériques en nombres
    const affectations = result.rows.map(row => ({
      ...row,
      quantite_assignee: row.quantite_assignee ? Number(row.quantite_assignee) : 0,
      prix_unitaire: row.prix_unitaire ? Number(row.prix_unitaire) : 0
    }))
    
    return NextResponse.json({ affectations })
  } catch (error) {
    console.error("Erreur API affectations GET:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      materiel_id,
      employe_id,
      quantite_assignee,
      commentaires
    } = await request.json()

    if (!materiel_id || !employe_id || !quantite_assignee) {
      return NextResponse.json({ error: "Matériel, employé et quantité requis" }, { status: 400 })
    }

    // Vérifier que le matériel existe et a suffisamment de stock
    const materielResult = await query(
      'SELECT quantite FROM materiel WHERE id = $1',
      [materiel_id]
    )

    if (materielResult.rows.length === 0) {
      return NextResponse.json({ error: "Matériel non trouvé" }, { status: 404 })
    }

    const stockDisponible = materielResult.rows[0].quantite
    if (stockDisponible < quantite_assignee) {
      return NextResponse.json({ 
        error: `Stock insuffisant. Disponible: ${stockDisponible}, Demandé: ${quantite_assignee}` 
      }, { status: 400 })
    }

    // Vérifier que l'employé existe
    const employeResult = await query(
      'SELECT id FROM employes WHERE id = $1',
      [employe_id]
    )

    if (employeResult.rows.length === 0) {
      return NextResponse.json({ error: "Employé non trouvé" }, { status: 404 })
    }

    // Commencer une transaction
    await query('BEGIN')

    try {
      // Créer l'affectation
      const affectationResult = await query(`
        INSERT INTO affectations_materiel (
          materiel_id, employe_id, quantite_assignee, commentaires
        ) VALUES ($1, $2, $3, $4) RETURNING *
      `, [materiel_id, employe_id, quantite_assignee, commentaires])

      // Diminuer le stock du matériel
      await query(`
        UPDATE materiel 
        SET quantite = quantite - $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [quantite_assignee, materiel_id])

      // Valider la transaction
      await query('COMMIT')

      return NextResponse.json({
        success: true,
        affectation: affectationResult.rows[0],
        message: `${quantite_assignee} unité(s) assignée(s) avec succès`
      })
    } catch (error) {
      // Annuler la transaction en cas d'erreur
      await query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error("Erreur API affectations POST:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updateData } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID affectation requis" }, { status: 400 })
    }

    // Nettoyer les données
    const cleanedData = { ...updateData }
    
    const integerFields = ['quantite_assignee']
    integerFields.forEach(field => {
      if (cleanedData[field] === '' || cleanedData[field] === undefined) {
        cleanedData[field] = null
      } else if (typeof cleanedData[field] === 'string' && !isNaN(Number(cleanedData[field]))) {
        cleanedData[field] = Number(cleanedData[field])
      }
    })

    const dateFields = ['date_retour']
    dateFields.forEach(field => {
      if (cleanedData[field] === '' || cleanedData[field] === undefined) {
        cleanedData[field] = null
      }
    })

    const fields = Object.keys(cleanedData).filter(key => cleanedData[key] !== undefined)
    if (fields.length === 0) {
      return NextResponse.json({ error: "Aucune donnée à mettre à jour" }, { status: 400 })
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ')
    const values = [id, ...fields.map(field => cleanedData[field])]

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
    console.error("Erreur API affectations PUT:", error)
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

    // Récupérer l'affectation avant suppression pour restaurer le stock
    const affectationResult = await query(
      'SELECT materiel_id, quantite_assignee FROM affectations_materiel WHERE id = $1',
      [id]
    )

    if (affectationResult.rows.length === 0) {
      return NextResponse.json({ error: "Affectation non trouvée" }, { status: 404 })
    }

    const { materiel_id, quantite_assignee } = affectationResult.rows[0]

    // Commencer une transaction
    await query('BEGIN')

    try {
      // Supprimer l'affectation
      const result = await query('DELETE FROM affectations_materiel WHERE id = $1 RETURNING *', [id])

      // Restaurer le stock
      await query(`
        UPDATE materiel 
        SET quantite = quantite + $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [quantite_assignee, materiel_id])

      // Valider la transaction
      await query('COMMIT')

      return NextResponse.json({
        success: true,
        message: "Affectation supprimée et stock restauré"
      })
    } catch (error) {
      // Annuler la transaction en cas d'erreur
      await query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error("Erreur API affectations DELETE:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
