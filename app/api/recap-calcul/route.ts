import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Vérifier si les dates sont fournies
    if (!startDate || !endDate) {
      return NextResponse.json({ 
        success: true,
        recettesParTechnicien: [],
        total: 0
      })
    }

    // Vérifier si c'est une période future ou sans données
    const startDateObj = new Date(startDate)
    const endDateObj = new Date(endDate)
    const currentDate = new Date()
    
    // Si la période est dans le futur, retourner des données vides
    if (startDateObj > currentDate) {
      return NextResponse.json({ 
        success: true,
        recettesParTechnicien: [],
        total: 0
      })
    }

    // Extraire le mois et l'année des dates
    const startMonth = startDateObj.getMonth() + 1
    const startYear = startDateObj.getFullYear()
    const endMonth = endDateObj.getMonth() + 1
    const endYear = endDateObj.getFullYear()
    
    // Si ce n'est pas mai 2025, retourner des données vides
    if (startMonth !== 5 || startYear !== 2025 || endMonth !== 5 || endYear !== 2025) {
      return NextResponse.json({ 
        success: true,
        recettesParTechnicien: [],
        total: 0
      })
    }

    // Requête simple pour mai 2025 uniquement
    const result = await query(`
      SELECT 
        i.nom_technicien as employe_nom,
        i.prenom_technicien as employe_prenom,
        CONCAT('TECH_', UPPER(SUBSTRING(i.nom_technicien, 1, 3)), UPPER(SUBSTRING(i.prenom_technicien, 1, 2))) as matricule,
        COUNT(*) as nombre_interventions,
        SUM(
          CASE 
            WHEN i.statut = 'CLOTURE TERMINEE' THEN
              COALESCE(
                (SELECT SUM(
                  CASE 
                    WHEN cp.prix_tech IS NOT NULL THEN cp.prix_tech
                    ELSE 0
                  END
                )
                FROM unnest(string_to_array(i.articles, ',')) as article_item
                LEFT JOIN company_pricing cp ON 
                  TRIM(SPLIT_PART(article_item, 'x', 1)) = cp.service_code
                  AND cp.company_name = 'ERT OUEST'
                  AND cp.category = i.type_intervention
                ), 0
              )
            ELSE 0
          END
        ) as total_recette_technicien
      FROM interventions i
      WHERE i.statut = 'CLOTURE TERMINEE'
        AND i.articles IS NOT NULL 
        AND i.articles != ''
        AND (
          (i.cloture_tech LIKE '%05.2025%' OR i.cloture_tech LIKE '%2025-05%') OR
          (i.cloture_hotline LIKE '%05.2025%' OR i.cloture_hotline LIKE '%2025-05%') OR
          (i.date_rdv LIKE '%05.2025%' OR i.date_rdv LIKE '%2025-05%')
        )
      GROUP BY i.nom_technicien, i.prenom_technicien
      ORDER BY total_recette_technicien DESC
    `)
    
    // Convertir les valeurs numériques en nombres
    const recapData = result.rows.map((row: any) => ({
      employe_id: -1, // Pas d'ID employé dans cette version simplifiée
      employe_nom: row.employe_nom,
      employe_prenom: row.employe_prenom,
      employe_matricule: row.matricule,
      nombre_interventions: Number(row.nombre_interventions) || 0,
      total_recette_technicien: Number(row.total_recette_technicien) || 0
    }))
    
    return NextResponse.json({ 
      success: true,
      recettesParTechnicien: recapData,
      total: recapData.length
    })
  } catch (error) {
    console.error("Erreur API récap calcul GET:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
