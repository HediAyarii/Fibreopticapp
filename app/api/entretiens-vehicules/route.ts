import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vehicule_id = searchParams.get('vehicule_id')
    const type_entretien = searchParams.get('type_entretien')
    
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
    
    if (type_entretien) {
      queryText += ` AND ev.type_entretien = $${paramIndex}`
      params.push(type_entretien)
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
      type_entretien,
      date_entretien,
      cout_entretien,
      cout,
      kilometrage_entretien,
      prestataire,
      garage,
      facture_numero,
      description,
      prochain_entretien_km,
      prochaine_echeance_km,
      prochain_entretien_date,
      prochaine_echeance_date,
      statut
    } = body

    const result = await query(
      `INSERT INTO entretiens_vehicules (
        vehicule_id, categorie_entretien, type_entretien, date_entretien, 
        cout_entretien, cout, kilometrage_entretien, prestataire, garage,
        facture_numero, description, prochain_entretien_km, prochaine_echeance_km,
        prochain_entretien_date, prochaine_echeance_date, statut
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        vehicule_id, 
        categorie_entretien || null, 
        type_entretien || 'Autre',
        date_entretien, 
        cout_entretien || cout || null,
        cout || cout_entretien || null,
        kilometrage_entretien || null, 
        prestataire || garage || null,
        garage || prestataire || null,
        facture_numero || null, 
        description || null,
        prochain_entretien_km || prochaine_echeance_km || null,
        prochaine_echeance_km || prochain_entretien_km || null,
        (prochain_entretien_date && prochain_entretien_date !== '') ? prochain_entretien_date : (prochaine_echeance_date && prochaine_echeance_date !== '') ? prochaine_echeance_date : null,
        (prochaine_echeance_date && prochaine_echeance_date !== '') ? prochaine_echeance_date : (prochain_entretien_date && prochain_entretien_date !== '') ? prochain_entretien_date : null,
        statut || 'effectue'
      ]
    )

    // Mettre à jour le kilométrage du véhicule si nécessaire
    if (kilometrage_entretien) {
      await query(
        'UPDATE vehicules SET kilometrage = $1 WHERE id = $2 AND (kilometrage IS NULL OR kilometrage < $1)',
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
      type_entretien,
      date_entretien,
      cout_entretien,
      cout,
      kilometrage_entretien,
      prestataire,
      garage,
      facture_numero,
      description,
      prochain_entretien_km,
      prochaine_echeance_km,
      prochain_entretien_date,
      prochaine_echeance_date,
      statut
    } = body

    const result = await query(
      `UPDATE entretiens_vehicules SET
        vehicule_id = $1, 
        categorie_entretien = $2, 
        type_entretien = $3,
        date_entretien = $4, 
        cout_entretien = $5,
        cout = $6,
        kilometrage_entretien = $7, 
        prestataire = $8,
        garage = $9,
        facture_numero = $10, 
        description = $11,
        prochain_entretien_km = $12,
        prochaine_echeance_km = $13,
        prochain_entretien_date = $14,
        prochaine_echeance_date = $15,
        statut = $16,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $17
      RETURNING *`,
      [
        vehicule_id, 
        categorie_entretien || null,
        type_entretien || 'Autre',
        date_entretien, 
        cout_entretien || cout || null,
        cout || cout_entretien || null,
        kilometrage_entretien || null, 
        prestataire || garage || null,
        garage || prestataire || null,
        facture_numero || null, 
        description || null,
        prochain_entretien_km || prochaine_echeance_km || null,
        prochaine_echeance_km || prochain_entretien_km || null,
        (prochain_entretien_date && prochain_entretien_date !== '') ? prochain_entretien_date : (prochaine_echeance_date && prochaine_echeance_date !== '') ? prochaine_echeance_date : null,
        (prochaine_echeance_date && prochaine_echeance_date !== '') ? prochaine_echeance_date : (prochain_entretien_date && prochain_entretien_date !== '') ? prochain_entretien_date : null,
        statut || 'effectue',
        id
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
