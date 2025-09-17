import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

// GET - Récupérer les frais d'entreprise
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const company = searchParams.get('company')
    const employeId = searchParams.get('employe_id')
    const statut = searchParams.get('statut')

    let queryText = `
      SELECT 
        fe.*,
        e.nom as employe_nom,
        e.prenom as employe_prenom,
        e.matricule as employe_matricule,
        cp.prix_base,
        cp.prix_tech,
        (cp.prix_base + cp.prix_tech) as prix_reference
      FROM frais_entreprise fe
      LEFT JOIN employes e ON fe.employe_id = e.id
      LEFT JOIN company_pricing cp ON (
        fe.company_name = cp.company_name AND 
        fe.service_code = cp.service_code AND 
        fe.category = cp.category
      )
      WHERE 1=1
    `
    const params: any[] = []
    let paramIndex = 1

    if (company) {
      queryText += ` AND fe.company_name = $${paramIndex}`
      params.push(company)
      paramIndex++
    }

    if (employeId) {
      queryText += ` AND fe.employe_id = $${paramIndex}`
      params.push(employeId)
      paramIndex++
    }

    if (statut) {
      queryText += ` AND fe.statut = $${paramIndex}`
      params.push(statut)
      paramIndex++
    }

    queryText += ` ORDER BY fe.date_facture DESC, fe.created_at DESC`

    const result = await query(queryText, params)
    
    return NextResponse.json({
      success: true,
      frais: result.rows,
      count: result.rows.length
    })
  } catch (error) {
    console.error("Erreur API frais entreprise GET:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST - Créer un nouveau frais d'entreprise
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const {
      company_name,
      service_code,
      category,
      numero_facture,
      date_facture,
      fournisseur,
      type_frais,
      montant_ht,
      montant_ttc,
      tva = 20.00,
      description,
      statut = 'en_attente',
      employe_id,
      projet_reference,
      justificatifs = [],
      commentaires
    } = data

    // Validation
    if (!company_name || !service_code || !category || !numero_facture || !date_facture || !fournisseur || !type_frais || !montant_ht || !montant_ttc) {
      return NextResponse.json({ 
        error: "Tous les champs obligatoires doivent être remplis" 
      }, { status: 400 })
    }

    const insertQuery = `
      INSERT INTO frais_entreprise (
        company_name, service_code, category, numero_facture, date_facture,
        fournisseur, type_frais, montant_ht, montant_ttc, tva, description,
        statut, employe_id, projet_reference, justificatifs, commentaires
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `

    const result = await query(insertQuery, [
      company_name,
      service_code,
      category,
      numero_facture,
      date_facture,
      fournisseur,
      type_frais,
      parseFloat(montant_ht),
      parseFloat(montant_ttc),
      parseFloat(tva),
      description,
      statut,
      employe_id || null,
      projet_reference,
      justificatifs,
      commentaires
    ])

    return NextResponse.json({
      success: true,
      frais: result.rows[0]
    })
  } catch (error) {
    console.error("Erreur API frais entreprise POST:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// PUT - Mettre à jour un frais d'entreprise
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    const {
      id,
      company_name,
      service_code,
      category,
      numero_facture,
      date_facture,
      fournisseur,
      type_frais,
      montant_ht,
      montant_ttc,
      tva,
      description,
      statut,
      employe_id,
      projet_reference,
      justificatifs,
      commentaires
    } = data

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    const updateQuery = `
      UPDATE frais_entreprise 
      SET 
        company_name = $2,
        service_code = $3,
        category = $4,
        numero_facture = $5,
        date_facture = $6,
        fournisseur = $7,
        type_frais = $8,
        montant_ht = $9,
        montant_ttc = $10,
        tva = $11,
        description = $12,
        statut = $13,
        employe_id = $14,
        projet_reference = $15,
        justificatifs = $16,
        commentaires = $17,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `

    const result = await query(updateQuery, [
      id,
      company_name,
      service_code,
      category,
      numero_facture,
      date_facture,
      fournisseur,
      type_frais,
      parseFloat(montant_ht),
      parseFloat(montant_ttc),
      parseFloat(tva),
      description,
      statut,
      employe_id || null,
      projet_reference,
      justificatifs,
      commentaires
    ])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Frais non trouvé" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      frais: result.rows[0]
    })
  } catch (error) {
    console.error("Erreur API frais entreprise PUT:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// DELETE - Supprimer un frais d'entreprise
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    const deleteQuery = `DELETE FROM frais_entreprise WHERE id = $1 RETURNING *`
    const result = await query(deleteQuery, [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Frais non trouvé" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Frais supprimé avec succès"
    })
  } catch (error) {
    console.error("Erreur API frais entreprise DELETE:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
