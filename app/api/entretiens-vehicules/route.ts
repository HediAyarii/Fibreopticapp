import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vehicule_id = searchParams.get('vehicule_id')
    const categorie = searchParams.get('categorie')
    
    let queryText = `
      SELECT ev.*, 
             v.matricule, v.marque, v.modele
      FROM entretiens_vehicules ev
      LEFT JOIN vehicules v ON ev.vehicule_id = v.id
      WHERE 1=1
    `
    let params: any[] = []
    let paramIndex = 1
    
    if (vehicule_id) {
      queryText += ` AND ev.vehicule_id = $${paramIndex}`
      params.push(vehicule_id)
      paramIndex++
    }
    
    if (categorie) {
      queryText += ` AND ev.categorie_entretien = $${paramIndex}`
      params.push(categorie)
      paramIndex++
    }
    
    queryText += ' ORDER BY ev.date_entretien DESC'
    
    const result = await query(queryText, params)
    
    return NextResponse.json({
      success: true,
      entretiens: result.rows
    })
  } catch (error: any) {
    console.error('Erreur lors de la récupération des entretiens:', error)
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
      vehicule_id,
      categorie_entretien,
      date_entretien,
      cout_entretien,
      kilometrage_entretien,
      garage,
      facture_numero,
      description,
      prochain_entretien_km,
      prochain_entretien_date
    } = body

    const result = await query(
      `INSERT INTO entretiens_vehicules (
        vehicule_id, categorie_entretien, date_entretien, cout_entretien,
        kilometrage_entretien, garage, facture_numero, description,
        prochain_entretien_km, prochain_entretien_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        vehicule_id, categorie_entretien, date_entretien, cout_entretien,
        kilometrage_entretien, garage, facture_numero, description,
        prochain_entretien_km, prochain_entretien_date
      ]
    )

    // Mettre à jour le kilométrage du véhicule si nécessaire
    if (kilometrage_entretien) {
      await query(
        'UPDATE vehicules SET kilometrage = $1 WHERE id = $2 AND kilometrage < $1',
        [kilometrage_entretien, vehicule_id]
      )
    }

    return NextResponse.json({
      success: true,
      entretien: result.rows[0]
    })
  } catch (error: any) {
    console.error('Erreur lors de la création de l\'entretien:', error)
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
      vehicule_id,
      categorie_entretien,
      date_entretien,
      cout_entretien,
      kilometrage_entretien,
      garage,
      facture_numero,
      description,
      prochain_entretien_km,
      prochain_entretien_date
    } = body

    const result = await query(
      `UPDATE entretiens_vehicules SET
        vehicule_id = $1, categorie_entretien = $2, date_entretien = $3, cout_entretien = $4,
        kilometrage_entretien = $5, garage = $6, facture_numero = $7, description = $8,
        prochain_entretien_km = $9, prochain_entretien_date = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *`,
      [
        vehicule_id, categorie_entretien, date_entretien, cout_entretien,
        kilometrage_entretien, garage, facture_numero, description,
        prochain_entretien_km, prochain_entretien_date, id
      ]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Entretien non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      entretien: result.rows[0]
    })
  } catch (error: any) {
    console.error('Erreur lors de la modification de l\'entretien:', error)
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

    await query('DELETE FROM entretiens_vehicules WHERE id = $1', [id])

    return NextResponse.json({
      success: true,
      message: 'Entretien supprimé avec succès'
    })
  } catch (error: any) {
    console.error('Erreur lors de la suppression de l\'entretien:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
