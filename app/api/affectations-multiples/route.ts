import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const {
      employe_id,
      affectations // Array of { materiel_id, quantite_assignee, commentaires }
    } = await request.json()

    if (!employe_id || !affectations || !Array.isArray(affectations) || affectations.length === 0) {
      return NextResponse.json({ error: "Employé et affectations requis" }, { status: 400 })
    }

    // Vérifier que l'employé existe
    const employeResult = await query(
      'SELECT id FROM employes WHERE id = $1',
      [employe_id]
    )

    if (employeResult.rows.length === 0) {
      return NextResponse.json({ error: "Employé non trouvé" }, { status: 404 })
    }

    // Vérifier que tous les matériels existent et ont suffisamment de stock
    const materielIds = affectations.map(a => a.materiel_id)
    const materielResult = await query(
      `SELECT id, nom_equipement, quantite FROM materiel WHERE id = ANY($1)`,
      [materielIds]
    )

    if (materielResult.rows.length !== materielIds.length) {
      return NextResponse.json({ error: "Un ou plusieurs matériels non trouvés" }, { status: 404 })
    }

    // Vérifier les stocks
    const stockChecks = []
    for (const affectation of affectations) {
      const materiel = materielResult.rows.find(m => m.id === affectation.materiel_id)
      if (materiel.quantite < affectation.quantite_assignee) {
        stockChecks.push({
          materiel: materiel.nom_equipement,
          disponible: materiel.quantite,
          demande: affectation.quantite_assignee
        })
      }
    }

    if (stockChecks.length > 0) {
      return NextResponse.json({ 
        error: "Stock insuffisant", 
        details: stockChecks 
      }, { status: 400 })
    }

    // Commencer une transaction
    await query('BEGIN')

    try {
      const createdAffectations = []

      // Créer toutes les affectations
      for (const affectation of affectations) {
        const affectationResult = await query(`
          INSERT INTO affectations_materiel (
            materiel_id, employe_id, quantite_assignee, commentaires
          ) VALUES ($1, $2, $3, $4) RETURNING *
        `, [affectation.materiel_id, employe_id, affectation.quantite_assignee, affectation.commentaires || ''])

        createdAffectations.push(affectationResult.rows[0])

        // Diminuer le stock du matériel
        await query(`
          UPDATE materiel 
          SET quantite = quantite - $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [affectation.quantite_assignee, affectation.materiel_id])
      }

      // Valider la transaction
      await query('COMMIT')

      return NextResponse.json({
        success: true,
        affectations: createdAffectations,
        message: `${affectations.length} affectation(s) créée(s) avec succès`
      })
    } catch (error) {
      // Annuler la transaction en cas d'erreur
      await query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error("Erreur API affectations multiples POST:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
