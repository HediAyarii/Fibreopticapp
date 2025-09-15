import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '50')

    let queryText = `
      SELECT 
        i.id,
        i.num_inter,
        i.client,
        i.nom_technicien,
        i.prenom_technicien,
        i.date_rdv,
        i.type_intervention,
        i.statut,
        i.created_at
      FROM interventions i
      WHERE 1=1
    `
    
    const params: any[] = []
    
    if (search) {
      queryText += ` AND (
        i.num_inter ILIKE $${params.length + 1} OR 
        i.client ILIKE $${params.length + 1} OR
        i.nom_technicien ILIKE $${params.length + 1} OR
        i.prenom_technicien ILIKE $${params.length + 1}
      )`
      params.push(`%${search}%`)
    }
    
    queryText += ` ORDER BY i.created_at DESC LIMIT $${params.length + 1}`
    params.push(limit)

    const result = await query(queryText, params)
    
    return NextResponse.json({
      interventions: result.rows,
      total: result.rows.length,
    })
  } catch (error) {
    console.error("Erreur GET interventions search:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
