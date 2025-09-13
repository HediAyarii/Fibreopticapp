
import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET() {
  try {
    const result = await query(`
      SELECT * FROM bordereau_prix_ert 
      WHERE actif = true
      ORDER BY categorie, article
    `)
    
    return NextResponse.json({ bordereau_prix_ert: result.rows })
  } catch (error) {
    console.error("Erreur API bordereau prix ERT GET:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      article,
      intitule,
      unite,
      pu_ht_euros,
      description,
      categorie,
      actif
    } = await request.json()

    // Vérifier si l'article existe déjà
    if (article) {
      const existing = await query(
        'SELECT id FROM bordereau_prix_ert WHERE article = $1',
        [article]
      )
      if (existing.rows.length > 0) {
        return NextResponse.json({ error: "Un article avec ce code existe déjà" }, { status: 400 })
      }
    }

    const insertQuery = `
      INSERT INTO bordereau_prix_ert (
        article, intitule, unite, pu_ht_euros, description, categorie, actif
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7
      ) RETURNING *
    `

    const values = [
      article, intitule, unite, parseFloat(pu_ht_euros) || 0, description, categorie, actif !== false
    ]

    const result = await query(insertQuery, values)
    
    return NextResponse.json({
      success: true,
      bordereau_prix_ert: result.rows[0]
    })
  } catch (error) {
    console.error("Erreur API bordereau prix ERT POST:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updateData } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID bordereau prix ERT requis" }, { status: 400 })
    }

    const fields = Object.keys(updateData).filter(key => updateData[key] !== undefined)
    if (fields.length === 0) {
      return NextResponse.json({ error: "Aucune donnée à mettre à jour" }, { status: 400 })
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ')
    const values = [id, ...fields.map(field => updateData[field])]

    const updateQuery = `
      UPDATE bordereau_prix_ert 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `

    const result = await query(updateQuery, values)
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Article bordereau prix ERT non trouvé" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      bordereau_prix_ert: result.rows[0]
    })
  } catch (error) {
    console.error("Erreur API bordereau prix ERT PUT:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "ID bordereau prix ERT requis" }, { status: 400 })
    }

    const result = await query('DELETE FROM bordereau_prix_ert WHERE id = $1 RETURNING *', [id])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Article bordereau prix ERT non trouvé" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Article bordereau prix ERT supprimé avec succès"
    })
  } catch (error) {
    console.error("Erreur API bordereau prix ERT DELETE:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
