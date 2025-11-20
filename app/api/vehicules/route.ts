import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const statut = searchParams.get('statut')
    
    let queryText = `
      SELECT v.*, 
             av.employe_id, 
             e.nom as employe_nom, 
             e.prenom as employe_prenom,
             av.date_assignation,
             av.date_fin as assignation_date_fin
      FROM vehicules v
      LEFT JOIN assignations_vehicules av ON v.id = av.vehicule_id AND av.statut = 'active'
      LEFT JOIN employes e ON av.employe_id = e.id
    `
    let params: any[] = []
    
    if (statut) {
      queryText += ' WHERE v.statut = $1'
      params.push(statut)
    }
    
    queryText += ' ORDER BY v.created_at DESC'
    
    const result = await query(queryText, params)
    
    return NextResponse.json({
      success: true,
      vehicules: result.rows
    })
  } catch (error: any) {
    console.error('Erreur lors de la récupération des véhicules:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      matricule,
      marque,
      modele,
      annee,
      kilometrage,
      type_vehicule,
      couleur,
      numero_chassis,
      date_acquisition,
      statut,
      commentaires
    } = body

    const result = await query(
      `INSERT INTO vehicules (
        matricule, marque, modele, annee, kilometrage, type_vehicule, 
        couleur, numero_chassis, date_acquisition, statut, commentaires
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        matricule, marque, modele, annee, kilometrage, type_vehicule,
        couleur, numero_chassis, date_acquisition, statut || 'disponible', commentaires
      ]
    )

    return NextResponse.json({
      success: true,
      vehicule: result.rows[0]
    })
  } catch (error: any) {
    console.error('Erreur lors de la création du véhicule:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      matricule,
      marque,
      modele,
      annee,
      kilometrage,
      type_vehicule,
      couleur,
      numero_chassis,
      date_acquisition,
      statut,
      commentaires
    } = body

    const result = await query(
      `UPDATE vehicules SET
        matricule = $1, marque = $2, modele = $3, annee = $4, kilometrage = $5,
        type_vehicule = $6, couleur = $7, numero_chassis = $8, date_acquisition = $9,
        statut = $10, commentaires = $11, updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *`,
      [
        matricule, marque, modele, annee, kilometrage, type_vehicule,
        couleur, numero_chassis, date_acquisition, statut, commentaires, id
      ]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Véhicule non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      vehicule: result.rows[0]
    })
  } catch (error: any) {
    console.error('Erreur lors de la modification du véhicule:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requis' },
        { status: 400 }
      )
    }

    await query('DELETE FROM vehicules WHERE id = $1', [id])

    return NextResponse.json({
      success: true,
      message: 'Véhicule supprimé avec succès'
    })
  } catch (error: any) {
    console.error('Erreur lors de la suppression du véhicule:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
