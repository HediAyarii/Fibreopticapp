// Créer une API helper pour valider les interventions avec des informations utiles
import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const interventionId = searchParams.get('id')
    
    if (!interventionId) {
      return NextResponse.json({ error: "ID intervention requis" }, { status: 400 })
    }

    // Rechercher l'intervention
    const result = await query(`
      SELECT i.*, e.id as employe_id, e.nom, e.prenom, e.matricule
      FROM interventions i
      LEFT JOIN employes e ON (
        LOWER(e.prenom) = LOWER(i.prenom_technicien) AND 
        LOWER(e.nom) = LOWER(i.nom_technicien)
      )
      WHERE i.id = $1
    `, [interventionId])

    if (result.rows.length === 0) {
      // L'intervention n'existe pas, chercher des suggestions similaires
      const suggestions = await query(`
        SELECT id, num_inter, client, statut
        FROM interventions
        WHERE CAST(id AS TEXT) LIKE $1 
           OR num_inter LIKE $2
        ORDER BY ABS(id - $3)
        LIMIT 5
      `, [`%${interventionId}%`, `%${interventionId}%`, parseInt(interventionId) || 0])

      return NextResponse.json({
        exists: false,
        intervention_id: interventionId,
        message: `L'intervention avec l'ID ${interventionId} n'existe pas encore dans la base de données.`,
        suggestion: "Cette intervention pourrait être créée plus tard. Vous pouvez continuer avec cet ID.",
        similar_interventions: suggestions.rows,
        can_proceed: true
      })
    }

    const intervention = result.rows[0]
    return NextResponse.json({
      exists: true,
      intervention: {
        id: intervention.id,
        num_inter: intervention.num_inter,
        client: intervention.client,
        date_rdv: intervention.date_rdv,
        statut: intervention.statut,
        type_intervention: intervention.type_intervention,
        technicien: intervention.prenom_technicien && intervention.nom_technicien 
          ? `${intervention.prenom_technicien} ${intervention.nom_technicien}`
          : null,
        employe_id: intervention.employe_id,
        employe_info: intervention.nom && intervention.prenom
          ? `${intervention.prenom} ${intervention.nom} (${intervention.matricule})`
          : null
      },
      message: `Intervention trouvée: ${intervention.num_inter} - ${intervention.client}`,
      can_proceed: true
    })

  } catch (error) {
    console.error("Erreur API validation intervention:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { intervention_id } = body
    
    if (!intervention_id) {
      return NextResponse.json({ error: "ID intervention requis" }, { status: 400 })
    }

    // Même logique que GET mais accessible via POST pour les formulaires
    return GET(request)
    
  } catch (error) {
    console.error("Erreur API validation intervention POST:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}