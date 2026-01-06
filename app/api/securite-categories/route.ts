import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

// GET - Récupérer toutes les catégories
export async function GET() {
  try {
    const result = await query(
      `SELECT * FROM securite_categories WHERE actif = true ORDER BY ordre ASC, nom ASC`
    )

    return NextResponse.json({
      success: true,
      categories: result.rows
    })
  } catch (error: any) {
    console.error('Erreur récupération catégories sécurité:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST - Créer une nouvelle catégorie
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nom, description, ordre } = body

    if (!nom) {
      return NextResponse.json(
        { success: false, error: 'Le nom de la catégorie est requis' },
        { status: 400 }
      )
    }

    const result = await query(
      `INSERT INTO securite_categories (nom, description, ordre) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [nom, description || null, ordre || 0]
    )

    return NextResponse.json({
      success: true,
      categorie: result.rows[0]
    })
  } catch (error: any) {
    console.error('Erreur création catégorie sécurité:', error)
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Une catégorie avec ce nom existe déjà' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT - Modifier une catégorie
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, nom, description, ordre, actif } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de la catégorie requis' },
        { status: 400 }
      )
    }

    const result = await query(
      `UPDATE securite_categories 
       SET nom = COALESCE($2, nom),
           description = COALESCE($3, description),
           ordre = COALESCE($4, ordre),
           actif = COALESCE($5, actif),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, nom, description, ordre, actif]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Catégorie non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      categorie: result.rows[0]
    })
  } catch (error: any) {
    console.error('Erreur modification catégorie sécurité:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer une catégorie
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de la catégorie requis' },
        { status: 400 }
      )
    }

    await query('DELETE FROM securite_categories WHERE id = $1', [id])

    return NextResponse.json({
      success: true,
      message: 'Catégorie supprimée'
    })
  } catch (error: any) {
    console.error('Erreur suppression catégorie sécurité:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
