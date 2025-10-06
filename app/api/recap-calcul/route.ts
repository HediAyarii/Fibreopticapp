import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const grille = searchParams.get('grille') // 'axecom', 'ert', 'tout'
    const employeId = searchParams.get('employeId')

    // Construire les filtres de date pour chaque table
    const queryParams: any[] = []
    let paramIndex = 1

    // Filtres pour interventions (date_rdv)
    let interventionsDateFilter = ""
    if (startDate) {
      interventionsDateFilter += ` AND i.date_rdv >= $${paramIndex}`
      queryParams.push(startDate)
      paramIndex++
    }
    if (endDate) {
      interventionsDateFilter += ` AND i.date_rdv <= $${paramIndex}`
      queryParams.push(endDate)
      paramIndex++
    }

    // Filtres pour carburant (date_livraison) - format DD.MM.YYYY
    let carburantDateFilter = ""
    if (startDate) {
      // Convertir 2025-05-01 en 01.05.2025
      const startDateFormatted = new Date(startDate).toLocaleDateString('de-DE')
      carburantDateFilter += ` AND cc.date_livraison >= $${paramIndex}`
      queryParams.push(startDateFormatted)
      paramIndex++
    }
    if (endDate) {
      // Convertir 2025-05-31 en 31.05.2025
      const endDateFormatted = new Date(endDate).toLocaleDateString('de-DE')
      carburantDateFilter += ` AND cc.date_livraison <= $${paramIndex}`
      queryParams.push(endDateFormatted)
      paramIndex++
    }

    // Filtres pour matériel (date_affectation)
    let materielDateFilter = ""
    if (startDate) {
      materielDateFilter += ` AND am.date_affectation >= $${paramIndex}`
      queryParams.push(startDate)
      paramIndex++
    }
    if (endDate) {
      materielDateFilter += ` AND am.date_affectation <= $${paramIndex}`
      queryParams.push(endDate)
      paramIndex++
    }

    // Filtres pour impôts (utiliser mois/année)
    let impotsDateFilter = ""
    if (startDate) {
      const startDateObj = new Date(startDate)
      const startMonth = startDateObj.getMonth() + 1
      const startYear = startDateObj.getFullYear()
      impotsDateFilter += ` AND cps.mois >= ${startMonth} AND cps.annee >= ${startYear}`
    }
    if (endDate) {
      const endDateObj = new Date(endDate)
      const endMonth = endDateObj.getMonth() + 1
      const endYear = endDateObj.getFullYear()
      impotsDateFilter += ` AND cps.mois <= ${endMonth} AND cps.annee <= ${endYear}`
    }

    // Filtres pour charges (pas de date spécifique, on garde tous)
    let chargesDateFilter = ""

    // Filtres pour pénalités (date_penalite)
    let penalitesDateFilter = ""
    if (startDate) {
      penalitesDateFilter += ` AND p.date_penalite >= $${paramIndex}`
      queryParams.push(startDate)
      paramIndex++
    }
    if (endDate) {
      penalitesDateFilter += ` AND p.date_penalite <= $${paramIndex}`
      queryParams.push(endDate)
      paramIndex++
    }

    // Filtre par grille
    let grilleFilter = ""
    if (grille && grille !== 'tout') {
      grilleFilter = ` AND i.grille = $${paramIndex}`
      queryParams.push(grille)
      paramIndex++
    }

    // Filtre par employé
    let employeFilter = ""
    if (employeId) {
      employeFilter = ` AND e.id = $${paramIndex}`
      queryParams.push(parseInt(employeId))
      paramIndex++
    }

    // Requête principale pour récupérer le récap par employé
    const result = await query(`
      WITH recettes_par_employe AS (
        SELECT 
          e.id as employe_id,
          e.nom as employe_nom,
          e.prenom as employe_prenom,
          e.matricule as employe_matricule,
          COALESCE(SUM(
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
          ), 0) as recettes_generes
        FROM employes e
        LEFT JOIN interventions i ON (
          LOWER(e.prenom) = LOWER(i.prenom_technicien) AND 
          LOWER(e.nom) = LOWER(i.nom_technicien)
        )
        WHERE 1=1 ${interventionsDateFilter} ${grilleFilter} ${employeFilter}
        GROUP BY e.id, e.nom, e.prenom, e.matricule
      ),
      carburant_par_employe AS (
        SELECT 
          e.id as employe_id,
          -- Récupérer la consommation carburant en utilisant la même logique que l'interface
          -- via les assignations de cartes et les transactions carburant
          COALESCE(SUM(
            CASE 
              WHEN TO_DATE(cc.date_livraison, 'DD.MM.YYYY') >= ca.date_assignation 
               AND TO_DATE(cc.date_livraison, 'DD.MM.YYYY') <= COALESCE(ca.date_fin, CURRENT_DATE)
              THEN CAST(REPLACE(cc.ca_ttc, ',', '.') AS DECIMAL)
              ELSE 0
            END
          ), 0) as cout_carburant
        FROM employes e
        LEFT JOIN carburant_assignations ca ON e.id = ca.employe_id
        LEFT JOIN carburant_consommation cc ON ca.carte_id = cc.numero_carte
        WHERE (ca.statut = 'active' OR ca.date_fin IS NOT NULL) ${carburantDateFilter} ${employeFilter}
        GROUP BY e.id
      ),
      materiel_par_employe AS (
        SELECT 
          e.id as employe_id,
          COALESCE(SUM(am.quantite_assignee * m.prix_unitaire), 0) as cout_materiel
        FROM employes e
        LEFT JOIN affectations_materiel am ON e.id = am.employe_id
        LEFT JOIN materiel m ON am.materiel_id = m.id
        WHERE am.statut = 'active' ${materielDateFilter} ${employeFilter}
        GROUP BY e.id
      ),
      impots_par_employe AS (
        SELECT 
          e.id as employe_id,
          -- Récupérer les impôts depuis la table cout_par_salaire selon la période
          COALESCE(SUM(cps.impot), 0) as cout_impots
        FROM employes e
        LEFT JOIN cout_par_salaire cps ON (
          -- Correspondance normale
          (LOWER(TRIM(e.nom)) = LOWER(TRIM(cps.nom)) AND LOWER(TRIM(e.prenom)) = LOWER(TRIM(cps.prenom))) OR
          -- Correspondance inversée (HAMDI BEN CHEDLI vs BENCHEDLI HAMDI)
          (LOWER(TRIM(e.nom)) = LOWER(TRIM(cps.prenom)) AND LOWER(TRIM(e.prenom)) = LOWER(TRIM(cps.nom))) OR
          -- Correspondance avec normalisation des espaces et tirets
          (LOWER(REPLACE(REPLACE(TRIM(e.nom), ' ', ''), '-', '')) = LOWER(REPLACE(REPLACE(TRIM(cps.nom), ' ', ''), '-', '')) AND 
           LOWER(REPLACE(REPLACE(TRIM(e.prenom), ' ', ''), '-', '')) = LOWER(REPLACE(REPLACE(TRIM(cps.prenom), ' ', ''), '-', ''))) OR
          -- Correspondance inversée avec normalisation
          (LOWER(REPLACE(REPLACE(TRIM(e.nom), ' ', ''), '-', '')) = LOWER(REPLACE(REPLACE(TRIM(cps.prenom), ' ', ''), '-', '')) AND 
           LOWER(REPLACE(REPLACE(TRIM(e.prenom), ' ', ''), '-', '')) = LOWER(REPLACE(REPLACE(TRIM(cps.nom), ' ', ''), '-', '')))
        )
        WHERE 1=1 ${employeFilter}
        GROUP BY e.id
      ),
      penalites_par_employe AS (
        SELECT 
          e.id as employe_id,
          COALESCE(SUM(p.montant), 0) as cout_penalites
        FROM employes e
        LEFT JOIN penalites p ON e.id = p.employe_id
        WHERE 1=1 ${penalitesDateFilter} ${employeFilter}
        GROUP BY e.id
      )
      SELECT 
        r.employe_id,
        r.employe_nom,
        r.employe_prenom,
        r.employe_matricule,
        r.recettes_generes,
        COALESCE(c.cout_carburant, 0) as cout_carburant,
        COALESCE(m.cout_materiel, 0) as cout_materiel,
        COALESCE(i.cout_impots, 0) as cout_impots,
        COALESCE(p.cout_penalites, 0) as cout_penalites,
        (
          COALESCE(c.cout_carburant, 0) + 
          COALESCE(m.cout_materiel, 0) + 
          COALESCE(i.cout_impots, 0) + 
          COALESCE(p.cout_penalites, 0)
        ) as total_couts,
        (
          r.recettes_generes - 
          COALESCE(c.cout_carburant, 0) - 
          COALESCE(m.cout_materiel, 0) - 
          COALESCE(i.cout_impots, 0) - 
          COALESCE(p.cout_penalites, 0)
        ) as benefice_net,
        CASE 
          WHEN r.recettes_generes > 0 THEN 
            ROUND(
              (
                (r.recettes_generes - 
                 COALESCE(c.cout_carburant, 0) - 
                 COALESCE(m.cout_materiel, 0) - 
                 COALESCE(i.cout_impots, 0) - 
                 COALESCE(p.cout_penalites, 0)
                ) / r.recettes_generes * 100
              )::numeric, 2
            )
          ELSE 0 
        END as marge_beneficiaire
      FROM recettes_par_employe r
      LEFT JOIN carburant_par_employe c ON r.employe_id = c.employe_id
      LEFT JOIN materiel_par_employe m ON r.employe_id = m.employe_id
      LEFT JOIN impots_par_employe i ON r.employe_id = i.employe_id
      LEFT JOIN penalites_par_employe p ON r.employe_id = p.employe_id
      WHERE r.recettes_generes > 0 OR 
            COALESCE(c.cout_carburant, 0) > 0 OR 
            COALESCE(m.cout_materiel, 0) > 0 OR 
            COALESCE(i.cout_impots, 0) > 0 OR 
            COALESCE(p.cout_penalites, 0) > 0
      ORDER BY benefice_net DESC, r.employe_nom, r.employe_prenom
    `, queryParams)
    
    // Convertir les valeurs numériques en nombres
    const recapData = result.rows.map((row: any) => ({
      ...row,
      recettes_generes: Number(row.recettes_generes) || 0,
      cout_carburant: Number(row.cout_carburant) || 0,
      cout_materiel: Number(row.cout_materiel) || 0,
      cout_impots: Number(row.cout_impots) || 0,
      cout_penalites: Number(row.cout_penalites) || 0,
      total_couts: Number(row.total_couts) || 0,
      benefice_net: Number(row.benefice_net) || 0,
      marge_beneficiaire: Number(row.marge_beneficiaire) || 0
    }))
    
    return NextResponse.json({ recapData })
  } catch (error) {
    console.error("Erreur API récap calcul GET:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
