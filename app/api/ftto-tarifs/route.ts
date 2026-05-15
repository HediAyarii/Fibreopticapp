import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

// GET - Récupérer les tarifs FTTO
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    let queryText = `
      SELECT 
        id,
        code_article,
        designation,
        bpu,
        created_at,
        updated_at
      FROM ftto_tarifs
      WHERE 1=1
    `
    const params: any[] = []
    let paramIndex = 1

    if (search) {
      queryText += ` AND (code_article ILIKE $${paramIndex} OR designation ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    queryText += ` ORDER BY code_article`

    const result = await query(queryText, params)

    return NextResponse.json({
      success: true,
      tarifs: result.rows,
      count: result.rows.length
    })
  } catch (error) {
    console.error("Erreur API ftto-tarifs GET:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST - Créer un nouveau tarif FTTO
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { code_article, designation, bpu } = data

    if (!code_article || !designation || bpu === undefined) {
      return NextResponse.json({
        error: "code_article, designation et bpu sont requis"
      }, { status: 400 })
    }

    const insertQuery = `
      INSERT INTO ftto_tarifs (code_article, designation, bpu)
      VALUES ($1, $2, $3)
      RETURNING *
    `
    const result = await query(insertQuery, [
      code_article.trim(),
      designation.trim(),
      parseFloat(bpu)
    ])

    return NextResponse.json({
      success: true,
      tarif: result.rows[0]
    }, { status: 201 })
  } catch (error) {
    console.error("Erreur API ftto-tarifs POST:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// PUT - Mettre à jour un tarif FTTO
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { id, code_article, designation, bpu } = data

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    const updateQuery = `
      UPDATE ftto_tarifs
      SET
        code_article = $2,
        designation = $3,
        bpu = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `
    const result = await query(updateQuery, [
      id,
      code_article.trim(),
      designation.trim(),
      parseFloat(bpu)
    ])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Tarif non trouvé" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      tarif: result.rows[0]
    })
  } catch (error) {
    console.error("Erreur API ftto-tarifs PUT:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// DELETE - Supprimer un tarif FTTO
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    const deleteQuery = `DELETE FROM ftto_tarifs WHERE id = $1 RETURNING *`
    const result = await query(deleteQuery, [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Tarif non trouvé" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Tarif supprimé avec succès"
    })
  } catch (error) {
    console.error("Erreur API ftto-tarifs DELETE:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
