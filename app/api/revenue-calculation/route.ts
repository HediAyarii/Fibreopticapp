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
    `

    const params = []
    const conditions = []

    if (employeId) {
      conditions.push(`emp.id = $${params.length + 1}`)
      params.push(parseInt(employeId))
    }

    if (dateFrom) {
      // PRIORITÉ: cloture_tech en priorité, sinon cloture_hotline (évite la double comptabilisation)
      conditions.push(`(
        CASE 
          -- Si cloture_tech est valide, l'utiliser en priorité
          WHEN i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND i.cloture_tech ~ '^[0-9]' THEN
            CASE
              WHEN i.cloture_tech ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN i.cloture_tech::date >= $${params.length + 1}::date
              WHEN i.cloture_tech ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN TO_DATE(SUBSTRING(i.cloture_tech FROM 1 FOR 10), 'DD/MM/YYYY') >= $${params.length + 1}::date
              ELSE FALSE
            END
          -- Sinon, utiliser cloture_hotline
          WHEN i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND i.cloture_hotline ~ '^[0-9]' THEN
            CASE
              WHEN i.cloture_hotline ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN i.cloture_hotline::date >= $${params.length + 1}::date
              WHEN i.cloture_hotline ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN TO_DATE(SUBSTRING(i.cloture_hotline FROM 1 FOR 10), 'DD/MM/YYYY') >= $${params.length + 1}::date
              ELSE FALSE
            END
          ELSE FALSE
        END
      )`)
      params.push(dateFrom)
    }

    if (dateTo) {
      // PRIORITÉ: cloture_tech en priorité, sinon cloture_hotline (évite la double comptabilisation)
      conditions.push(`(
        CASE 
          -- Si cloture_tech est valide, l'utiliser en priorité
          WHEN i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND i.cloture_tech ~ '^[0-9]' THEN
            CASE
              WHEN i.cloture_tech ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN i.cloture_tech::date <= $${params.length + 1}::date
              WHEN i.cloture_tech ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN TO_DATE(SUBSTRING(i.cloture_tech FROM 1 FOR 10), 'DD/MM/YYYY') <= $${params.length + 1}::date
              ELSE FALSE
            END
          -- Sinon, utiliser cloture_hotline
          WHEN i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND i.cloture_hotline ~ '^[0-9]' THEN
            CASE
              WHEN i.cloture_hotline ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN i.cloture_hotline::date <= $${params.length + 1}::date
              WHEN i.cloture_hotline ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN TO_DATE(SUBSTRING(i.cloture_hotline FROM 1 FOR 10), 'DD/MM/YYYY') <= $${params.length + 1}::date
              ELSE FALSE
            END
          ELSE FALSE
        END
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

    // Récupérer les recla free confirmées par employe_id dans la même période
    // IMPORTANT: Utilise date_confirmation pour déterminer la période de facturation
    let reclaFreeByEmployee: Record<number, number> = {}
    let reclaFreeEntByEmployee: Record<number, number> = {}
    try {
      const rfConditions: string[] = ['rf.confirmer = TRUE', 'e.id IS NOT NULL', 'rf.date_confirmation IS NOT NULL']
      const rfParams: any[] = []
      let rfIdx = 1
      if (employeId) {
        rfConditions.push(`e.id = $${rfIdx++}`)
        rfParams.push(parseInt(employeId))
      }
      if (dateFrom) {
        // Utiliser date_confirmation pour déterminer la période
        rfConditions.push(`DATE(rf.date_confirmation) >= $${rfIdx++}::date`)
        rfParams.push(dateFrom)
      }
      if (dateTo) {
        // Utiliser date_confirmation pour déterminer la période
        rfConditions.push(`DATE(rf.date_confirmation) <= $${rfIdx++}::date`)
        rfParams.push(dateTo)
      }
      const rfResult = await query(`
        SELECT e.id as employe_id,
          COALESCE(SUM(rf.montant_technicien), 0) as total_recla_free_tech,
          COALESCE(SUM(rf.montant_entreprise), 0) as total_recla_free_ent
        FROM recla_free rf
        JOIN employes e ON rf.employe_id = e.id
        WHERE ${rfConditions.join(' AND ')}
        GROUP BY e.id
      `, rfParams)
      for (const row of rfResult.rows) {
        reclaFreeByEmployee[Number(row.employe_id)] = parseFloat(row.total_recla_free_tech) || 0
        reclaFreeEntByEmployee[Number(row.employe_id)] = parseFloat(row.total_recla_free_ent) || 0
      }
    } catch (rfErr) {
      // Si la table n'existe pas encore, on ignore
      console.warn("recla_free table not ready yet:", rfErr)
    }

    // Récupérer les FTTO par employe_id dans la même période
    let fttoTechByEmployee: Record<number, number> = {}
    let fttoEntByEmployee: Record<number, number> = {}
    try {
      const ftConditions: string[] = ['ft.employe_id IS NOT NULL', 'ft.date_ticket IS NOT NULL']
      const ftParams: any[] = []
      let ftIdx = 1
      if (employeId) {
        ftConditions.push(`ft.employe_id = $${ftIdx++}`)
        ftParams.push(parseInt(employeId))
      }
      if (dateFrom) {
        ftConditions.push(`ft.date_ticket::date >= $${ftIdx++}::date`)
        ftParams.push(dateFrom)
      }
      if (dateTo) {
        ftConditions.push(`ft.date_ticket::date <= $${ftIdx++}::date`)
        ftParams.push(dateTo)
      }
      const ftResult = await query(`
        SELECT ft.employe_id,
          COALESCE(SUM(ROUND(ft.prix_unitaire * ft.quantite * 0.40, 2)), 0) as total_ftto_tech,
          COALESCE(SUM(ROUND(ft.prix_unitaire * ft.quantite * 0.60, 2)), 0) as total_ftto_ent
        FROM ftto_tickets ft
        WHERE ${ftConditions.join(' AND ')}
        GROUP BY ft.employe_id
      `, ftParams)
      for (const row of ftResult.rows) {
        fttoTechByEmployee[Number(row.employe_id)] = parseFloat(row.total_ftto_tech) || 0
        fttoEntByEmployee[Number(row.employe_id)] = parseFloat(row.total_ftto_ent) || 0
      }
    } catch (ftErr) {
      console.warn("ftto_tickets table not ready yet:", ftErr)
    }

    const revenue_data = result.rows.map((row: any) => {
      const reclaFreeTech = reclaFreeByEmployee[Number(row.employe_id)] || 0
      const reclaFreeEnt = reclaFreeEntByEmployee[Number(row.employe_id)] || 0
      const fttoTech = fttoTechByEmployee[Number(row.employe_id)] || 0
      const fttoEnt = fttoEntByEmployee[Number(row.employe_id)] || 0
      const origTech = parseFloat(row.total_recette_technicien || 0)
      const origEnt = parseFloat(row.total_recette_entreprise || 0)
      const origGen = parseFloat(row.total_recette_generale || 0)
      return {
        ...row,
        total_recette_technicien: origTech + reclaFreeTech + fttoTech,
        total_recette_entreprise: origEnt + reclaFreeEnt + fttoEnt,
        total_recette_generale: origGen + reclaFreeTech + reclaFreeEnt + fttoTech + fttoEnt,
        total_recla_free_confirmee: reclaFreeTech,
        total_ftto_technicien: fttoTech,
        total_ftto_entreprise: fttoEnt,
      }
    })

    // Ajouter les techniciens qui ont des recla_free et/ou FTTO mais aucune intervention dans la période
    const existingEmployeeIds = new Set(result.rows.map((r: any) => Number(r.employe_id)))

    // Collecter tous les employe_id non-interventions qui ont RF ou FTTO
    const extraEmpIds = new Set<number>([
      ...Object.keys(reclaFreeByEmployee).map(Number),
      ...Object.keys(fttoTechByEmployee).map(Number),
    ])

    for (const empId of extraEmpIds) {
      if (existingEmployeeIds.has(empId)) continue
      const reclaFreeTechAmount = reclaFreeByEmployee[empId] || 0
      const reclaFreeEntAmount = reclaFreeEntByEmployee[empId] || 0
      const fttoTech = fttoTechByEmployee[empId] || 0
      const fttoEnt = fttoEntByEmployee[empId] || 0
      if (reclaFreeTechAmount === 0 && fttoTech === 0) continue
      try {
        const empResult = await query(
          `SELECT id, nom, prenom, matricule FROM employes WHERE id = $1`,
          [empId]
        )
        if (empResult.rows.length > 0) {
          const emp = empResult.rows[0]
          revenue_data.push({
            employe_id: emp.id,
            employe_nom: emp.nom,
            employe_prenom: emp.prenom,
            matricule: emp.matricule,
            nombre_interventions: 0,
            total_recette_technicien: reclaFreeTechAmount + fttoTech,
            total_recette_entreprise: reclaFreeEntAmount + fttoEnt,
            total_recette_generale: reclaFreeTechAmount + reclaFreeEntAmount + fttoTech + fttoEnt,
            total_recla_free_confirmee: reclaFreeTechAmount,
            total_ftto_technicien: fttoTech,
            total_ftto_entreprise: fttoEnt,
            interventions_detail: [],
          })
        }
      } catch (e) { /* ignore */ }
    }

    // Calculer les totaux globaux APRÈS revenue_data complet (inclut les lignes recla_free virtuelles)
    const totalStats = {
      total_interventions: revenue_data.reduce((sum: number, row: any) => sum + (parseInt(row.nombre_interventions) || 0), 0),
      total_recette_technicien: revenue_data.reduce((sum: number, row: any) => sum + (parseFloat(row.total_recette_technicien) || 0), 0),
      total_recette_entreprise: revenue_data.reduce((sum: number, row: any) => sum + (parseFloat(row.total_recette_entreprise) || 0), 0),
      total_recette_generale: revenue_data.reduce((sum: number, row: any) => sum + (parseFloat(row.total_recette_generale) || 0), 0),
    }

    return NextResponse.json({
      success: true,
      revenue_data,
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
