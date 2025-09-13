import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET() {
  try {
    const result = await query(`
      SELECT * FROM frais_axecom
      ORDER BY article
    `)
    
    return NextResponse.json({ frais_axecom: result.rows })
  } catch (error) {
    console.error("Erreur API frais Axecom GET:", error)
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
      prix_emp,
      description,
      statut
    } = await request.json()

    // Vérifier si l'article existe déjà
    if (article) {
      const existing = await query(
        'SELECT id FROM frais_axecom WHERE article = $1',
        [article]
      )
      if (existing.rows.length > 0) {
        return NextResponse.json({ error: "Un article avec ce code existe déjà" }, { status: 400 })
      }
    }

    const insertQuery = `
      INSERT INTO frais_axecom (
        article, intitule, unite, pu_ht_euros, prix_emp, description, statut
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7
      ) RETURNING *
    `

    const values = [
      article, intitule, unite, parseFloat(pu_ht_euros) || 0, parseFloat(prix_emp) || 0, 
      description, statut || 'actif'
    ]

    const result = await query(insertQuery, values)
    
    return NextResponse.json({
      success: true,
      frais_axecom: result.rows[0]
    })
  } catch (error) {
    console.error("Erreur API frais Axecom POST:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updateData } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID frais Axecom requis" }, { status: 400 })
    }

    // Nettoyer les données
    const cleanedData = { ...updateData }
    
    // Champs numériques
    const numericFields = ['montant_ht', 'montant_ttc', 'tva', 'employe_id']
    
    numericFields.forEach(field => {
      if (cleanedData[field] === '' || cleanedData[field] === undefined) {
        cleanedData[field] = null
      } else if (typeof cleanedData[field] === 'string' && !isNaN(Number(cleanedData[field]))) {
        cleanedData[field] = Number(cleanedData[field])
      }
    })

    // Champs de tableau
    if (cleanedData.justificatifs && typeof cleanedData.justificatifs === 'string') {
      cleanedData.justificatifs = `{${cleanedData.justificatifs.split(',').map(item => `"${item.trim()}"`).join(',')}}`
    }

    const fields = Object.keys(cleanedData).filter(key => cleanedData[key] !== undefined)
    if (fields.length === 0) {
      return NextResponse.json({ error: "Aucune donnée à mettre à jour" }, { status: 400 })
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ')
    const values = [id, ...fields.map(field => cleanedData[field])]

    const updateQuery = `
      UPDATE frais_axecom 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `

    const result = await query(updateQuery, values)
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Frais Axecom non trouvé" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      frais_axecom: result.rows[0]
    })
  } catch (error) {
    console.error("Erreur API frais Axecom PUT:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "ID frais Axecom requis" }, { status: 400 })
    }

    const result = await query('DELETE FROM frais_axecom WHERE id = $1 RETURNING *', [id])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Frais Axecom non trouvé" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Frais Axecom supprimé avec succès"
    })
  } catch (error) {
    console.error("Erreur API frais Axecom DELETE:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
