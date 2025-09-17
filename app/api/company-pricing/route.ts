import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

// GET - Récupérer les tarifs des entreprises
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const company = searchParams.get('company')
    const category = searchParams.get('category')
    const service = searchParams.get('service')

    let queryText = `
      SELECT 
        id,
        company_name,
        service_code,
        category,
        prix_base,
        prix_tech,
        (prix_base + prix_tech) as total_price,
        created_at,
        updated_at
      FROM company_pricing
      WHERE 1=1
    `
    const params: any[] = []
    let paramIndex = 1

    if (company) {
      queryText += ` AND company_name = $${paramIndex}`
      params.push(company)
      paramIndex++
    }

    if (category) {
      queryText += ` AND category = $${paramIndex}`
      params.push(category)
      paramIndex++
    }

    if (service) {
      queryText += ` AND service_code ILIKE $${paramIndex}`
      params.push(`%${service}%`)
      paramIndex++
    }

    queryText += ` ORDER BY company_name, category, service_code`

    const result = await query(queryText, params)
    
    return NextResponse.json({
      success: true,
      pricing: result.rows,
      count: result.rows.length
    })
  } catch (error) {
    console.error("Erreur API tarifs entreprises GET:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST - Créer un nouveau tarif
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const {
      company_name,
      service_code,
      category,
      prix_base,
      prix_tech = 0
    } = data

    // Validation
    if (!company_name || !service_code || !category || prix_base === undefined) {
      return NextResponse.json({ 
        error: "company_name, service_code, category et prix_base sont requis" 
      }, { status: 400 })
    }

    const insertQuery = `
      INSERT INTO company_pricing (company_name, service_code, category, prix_base, prix_tech)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `

    const result = await query(insertQuery, [
      company_name,
      service_code,
      category,
      parseFloat(prix_base),
      parseFloat(prix_tech)
    ])

    return NextResponse.json({
      success: true,
      pricing: result.rows[0]
    })
  } catch (error) {
    console.error("Erreur API tarifs entreprises POST:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// PUT - Mettre à jour un tarif
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    const {
      id,
      company_name,
      service_code,
      category,
      prix_base,
      prix_tech = 0
    } = data

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    const updateQuery = `
      UPDATE company_pricing 
      SET 
        company_name = $2,
        service_code = $3,
        category = $4,
        prix_base = $5,
        prix_tech = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `

    const result = await query(updateQuery, [
      id,
      company_name,
      service_code,
      category,
      parseFloat(prix_base),
      parseFloat(prix_tech)
    ])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Tarif non trouvé" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      pricing: result.rows[0]
    })
  } catch (error) {
    console.error("Erreur API tarifs entreprises PUT:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// DELETE - Supprimer un tarif
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    const deleteQuery = `DELETE FROM company_pricing WHERE id = $1 RETURNING *`
    const result = await query(deleteQuery, [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Tarif non trouvé" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Tarif supprimé avec succès"
    })
  } catch (error) {
    console.error("Erreur API tarifs entreprises DELETE:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
