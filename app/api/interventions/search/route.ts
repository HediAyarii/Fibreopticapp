import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    if (!searchTerm) {
      return NextResponse.json({ error: "Terme de recherche requis" }, { status: 400 })
    }

    // Rechercher les interventions qui commencent par le terme saisi
    const result = await query(`
      SELECT i.*, e.id as employe_id, e.nom, e.prenom, e.matricule
      FROM interventions i
      LEFT JOIN employes e ON (
        LOWER(e.prenom) = LOWER(i.prenom_technicien) AND 
        LOWER(e.nom) = LOWER(i.nom_technicien)
      )
      WHERE i.num_inter LIKE $1
      ORDER BY i.num_inter
      LIMIT $2
    `, [`${searchTerm}%`, limit])

    const interventions = result.rows.map(intervention => ({
      id: intervention.id,
      num_inter: intervention.num_inter,
      client: intervention.client,
      date_rdv: intervention.date_rdv,
      cloture_tech: intervention.cloture_tech,
      cloture_hotline: intervention.cloture_hotline,
      prenom_technicien: intervention.prenom_technicien,
      nom_technicien: intervention.nom_technicien,
      employe_id: intervention.employe_id,
      employe_nom: intervention.nom,
      employe_prenom: intervention.prenom,
      employe_matricule: intervention.matricule,
      statut: intervention.statut,
      type_intervention: intervention.type_intervention
    }))

    return NextResponse.json({
      success: true,
      interventions: interventions,
      count: interventions.length,
      searchTerm: searchTerm
    })
  } catch (error) {
    console.error("Erreur API recherche interventions:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}