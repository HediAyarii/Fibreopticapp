import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

// GET - Récupérer l'assignation active du technicien
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employe_id = searchParams.get('employe_id')

    if (!employe_id) {
      return NextResponse.json(
        { success: false, error: 'ID employé requis' },
        { status: 400 }
      )
    }

    const result = await query(
      `SELECT av.*, 
             v.matricule, v.marque, v.modele, v.kilometrage as kilometrage_actuel_vehicule
      FROM assignations_vehicules av
      JOIN vehicules v ON av.vehicule_id = v.id
      WHERE av.employe_id = $1 AND av.statut = 'active'
      ORDER BY av.date_assignation DESC
      LIMIT 1`,
      [employe_id]
    )

    return NextResponse.json({
      success: true,
      assignation: result.rows[0] || null
    })
  } catch (error: any) {
    console.error('Erreur lors de la récupération de l\'assignation:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour le kilométrage (technicien)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { assignation_id, kilometrage, employe_id } = body

    if (!assignation_id || !kilometrage || !employe_id) {
      return NextResponse.json(
        { success: false, error: 'Paramètres manquants' },
        { status: 400 }
      )
    }

    // Vérifier que l'assignation appartient au technicien
    const checkResult = await query(
      'SELECT vehicule_id, kilometrage_debut FROM assignations_vehicules WHERE id = $1 AND employe_id = $2 AND statut = $3',
      [assignation_id, employe_id, 'active']
    )

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Assignation non trouvée ou non autorisée' },
        { status: 404 }
      )
    }

    const vehicule_id = checkResult.rows[0].vehicule_id
    const kilometrage_debut = checkResult.rows[0].kilometrage_debut

    // Si c'est la première fois que le technicien entre le kilométrage (kilometrage_debut est null)
    if (kilometrage_debut === null) {
      // Mettre à jour kilometrage_debut dans assignations_vehicules
      await query(
        'UPDATE assignations_vehicules SET kilometrage_debut = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [kilometrage, assignation_id]
      )
    }

    // Toujours mettre à jour le kilométrage du véhicule
    await query(
      'UPDATE vehicules SET kilometrage = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [kilometrage, vehicule_id]
    )

    return NextResponse.json({
      success: true,
      message: 'Kilométrage mis à jour avec succès'
    })
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du kilométrage:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
