import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeId = searchParams.get('employe_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const grille = searchParams.get('grille')

    // Construire la requête SQL pour calculer les recettes
    let queryText = `
      WITH intervention_revenue AS (
        SELECT 
          i.id as intervention_id,
          i.num_inter,
          i.client,
          i.date_rdv,
          i.prenom_technicien,
          i.nom_technicien,
          i.cloture_tech,
          i.cloture_hotline,
          i.articles,
          i.statut,
          i.type_intervention,
          emp.id as employe_id,
          emp.nom as employe_nom,
          emp.prenom as employe_prenom,
          emp.matricule,
          -- Calculer les recettes basées sur les articles
          CASE 
            WHEN i.statut = 'CLOTURE TERMINEE' THEN
              COALESCE(
                (SELECT SUM(
                  CASE 
                    -- Exception: Si l'intervention contient à la fois DEP_OFFE et SAV, ignorer DEP_OFFE
                    WHEN TRIM(SPLIT_PART(article_item, 'x', 1)) = 'DEP_OFFE' 
                         AND i.articles LIKE '%SAV%' THEN 0
                    -- Calculer avec quantité
                    WHEN cp.prix_tech IS NOT NULL THEN 
                      cp.prix_tech * COALESCE(NULLIF(TRIM(SPLIT_PART(article_item, 'x', 2)), '')::INTEGER, 1)
                    ELSE 0
                  END
                )
                FROM unnest(string_to_array(i.articles, ',')) as article_item
                LEFT JOIN company_pricing cp ON 
                  TRIM(SPLIT_PART(article_item, 'x', 1)) = cp.service_code
                  AND cp.company_name = CASE 
                    WHEN i.grille LIKE '%AXECOM%' THEN 'AXECOM'
                    ELSE 'ERT OUEST'
                  END
                  AND cp.category = CASE 
                    WHEN i.type_intervention IN ('RACC', 'RECO', 'RECC') THEN 'RACC'
                    ELSE 'SAV'
                  END
                WHERE article_item != 'nan' 
                  AND TRIM(article_item) != ''
                ), 0
              )
            ELSE 0
          END as recette_technicien,
          CASE 
            WHEN i.statut = 'CLOTURE TERMINEE' THEN
              COALESCE(
                (SELECT SUM(
                  CASE 
                    -- Exception: Si l'intervention contient à la fois DEP_OFFE et SAV, ignorer DEP_OFFE
                    WHEN TRIM(SPLIT_PART(article_item, 'x', 1)) = 'DEP_OFFE' 
                         AND i.articles LIKE '%SAV%' THEN 0
                    -- Calculer avec quantité
                    WHEN cp.prix_base IS NOT NULL THEN 
                      cp.prix_base * COALESCE(NULLIF(TRIM(SPLIT_PART(article_item, 'x', 2)), '')::INTEGER, 1)
                    ELSE 0
                  END
                )
                FROM unnest(string_to_array(i.articles, ',')) as article_item
                LEFT JOIN company_pricing cp ON 
                  TRIM(SPLIT_PART(article_item, 'x', 1)) = cp.service_code
                  AND cp.company_name = CASE 
                    WHEN i.grille LIKE '%AXECOM%' THEN 'AXECOM'
                    ELSE 'ERT OUEST'
                  END
                  AND cp.category = CASE 
                    WHEN i.type_intervention IN ('RACC', 'RECO', 'RECC') THEN 'RACC'
                    ELSE 'SAV'
                  END
                WHERE article_item != 'nan' 
                  AND TRIM(article_item) != ''
                ), 0
              )
            ELSE 0
          END as recette_entreprise
        FROM interventions i
        LEFT JOIN employes e ON (
          LOWER(e.prenom) = LOWER(i.prenom_technicien) AND 
          LOWER(e.nom) = LOWER(i.nom_technicien)
        )
        -- Créer un employé fictif si aucun employé n'est trouvé
        LEFT JOIN LATERAL (
          SELECT 
            COALESCE(e.id, -1) as id,
            COALESCE(e.nom, i.nom_technicien) as nom,
            COALESCE(e.prenom, i.prenom_technicien) as prenom,
            COALESCE(e.matricule, CONCAT('TECH_', UPPER(SUBSTRING(i.nom_technicien, 1, 3)), UPPER(SUBSTRING(i.prenom_technicien, 1, 2)))) as matricule
        ) emp ON true
        WHERE i.statut = 'CLOTURE TERMINEE'
          AND i.articles IS NOT NULL 
          AND i.articles != ''
    `

    const params = []
    const conditions = []

    if (employeId) {
      conditions.push(`emp.id = $${params.length + 1}`)
      params.push(parseInt(employeId))
    }

    if (dateFrom) {
      conditions.push(`(
        (i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND 
         i.cloture_tech ~ '^[0-9]' AND i.cloture_tech::date >= $${params.length + 1}::date) OR
        (i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND 
         i.cloture_hotline ~ '^[0-9]' AND i.cloture_hotline::date >= $${params.length + 1}::date) OR
        (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND 
         i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND 
         i.date_rdv ~ '^[0-9]' AND i.date_rdv::date >= $${params.length + 1}::date)
      )`)
      params.push(dateFrom)
    }

    if (dateTo) {
      conditions.push(`(
        (i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND 
         i.cloture_tech ~ '^[0-9]' AND i.cloture_tech::date <= $${params.length + 1}::date) OR
        (i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND 
         i.cloture_hotline ~ '^[0-9]' AND i.cloture_hotline::date <= $${params.length + 1}::date) OR
        (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND 
         i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND 
         i.date_rdv ~ '^[0-9]' AND i.date_rdv::date <= $${params.length + 1}::date)
      )`)
      params.push(dateTo)
    }

    if (grille) {
      if (grille === 'AXECOM MANCHE') {
        conditions.push(`i.grille LIKE '%AXECOM MANCHE%'`)
      } else if (grille === 'ERT') {
        conditions.push(`(i.grille IS NOT NULL AND i.grille != '' AND i.grille NOT LIKE '%AXECOM MANCHE%')`)
      }
    }

    if (conditions.length > 0) {
      queryText += ` AND ${conditions.join(' AND ')}`
    }

    queryText += `
      )
      SELECT 
        employe_id,
        employe_nom,
        employe_prenom,
        matricule,
        COUNT(*) as nombre_interventions,
        SUM(recette_technicien) as total_recette_technicien,
        SUM(recette_entreprise) as total_recette_entreprise,
        SUM(recette_technicien + recette_entreprise) as total_recette_generale,
        -- Détail des interventions
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'intervention_id', intervention_id,
            'num_inter', num_inter,
            'client', client,
            'date_rdv', date_rdv,
            'statut', statut,
            'type_intervention', type_intervention,
            'articles', articles,
            'recette_technicien', recette_technicien,
            'recette_entreprise', recette_entreprise,
            'recette_totale', recette_technicien + recette_entreprise
          ) ORDER BY date_rdv DESC
        ) as interventions_detail
      FROM intervention_revenue
      GROUP BY employe_id, employe_nom, employe_prenom, matricule
      ORDER BY total_recette_generale DESC
    `

    console.log("📊 Calcul des recettes générées...")
    const result = await query(queryText, params)

    // Calculer les totaux globaux
    const totalStats = {
      total_interventions: result.rows.reduce((sum: number, row: any) => sum + parseInt(row.nombre_interventions), 0),
      total_recette_technicien: result.rows.reduce((sum: number, row: any) => sum + parseFloat(row.total_recette_technicien || 0), 0),
      total_recette_entreprise: result.rows.reduce((sum: number, row: any) => sum + parseFloat(row.total_recette_entreprise || 0), 0),
      total_recette_generale: result.rows.reduce((sum: number, row: any) => sum + parseFloat(row.total_recette_generale || 0), 0)
    }

    return NextResponse.json({
      success: true,
      revenue_data: result.rows,
      total_stats: totalStats,
      filters: {
        employe_id: employeId,
        date_from: dateFrom,
        date_to: dateTo
      }
    })

  } catch (error) {
    console.error("Erreur API revenue-calculation GET:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Erreur serveur lors du calcul des recettes" 
    }, { status: 500 })
  }
}
