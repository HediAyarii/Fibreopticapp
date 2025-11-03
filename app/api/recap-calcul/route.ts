import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const employeId = searchParams.get('employeId')
    const grille = searchParams.get('grille')

    // Vérifier si au moins la date de début est fournie
    if (!startDate) {
      return NextResponse.json({ 
        success: true,
        recettesParTechnicien: [],
        total: 0
      })
    }

    // Si pas de date de fin, utiliser la date de début comme date de fin
    const effectiveEndDate = endDate || startDate

    // Vérifier si c'est une période future (seulement si la date de début est dans le futur)
    const startDateObj = new Date(startDate)
    const endDateObj = new Date(effectiveEndDate)
    const currentDate = new Date()
    
    // Si la date de début est dans le futur, retourner des données vides
    if (startDateObj > currentDate) {
      return NextResponse.json({ 
        success: true,
        recettesParTechnicien: [],
        total: 0
      })
    }

    // Construire les conditions de filtrage
    let employeFilter = ''
    let grilleFilter = ''
    let queryParams = [startDate, effectiveEndDate]
    let paramIndex = 3

    // Filtre par employé
    let selectedEmployee = null
    if (employeId && employeId !== 'all') {
      // Récupérer les informations de l'employé
      const employeResult = await query(`
        SELECT nom, prenom, matricule 
        FROM employes 
        WHERE id = $1
      `, [employeId])
      
      if (employeResult.rows.length > 0) {
        selectedEmployee = employeResult.rows[0]
        employeFilter = `AND i.nom_technicien = $${paramIndex} AND i.prenom_technicien = $${paramIndex + 1}`
        queryParams.push(selectedEmployee.nom, selectedEmployee.prenom)
        paramIndex += 2
      }
    }

    // Filtre par grille (ERT OUEST ou AXECOM)
    let grilleInterventionFilter = ''
    if (grille && grille !== 'tout') {
      if (grille === 'ert') {
        // Pour ERT : grille différente de AXECOM MANCHE et B2B : AXECOM MANCHE
        grilleInterventionFilter = `AND i.grille NOT IN ('AXECOM MANCHE', 'B2B : AXECOM MANCHE') AND i.grille IS NOT NULL AND i.grille != ''`
      } else if (grille === 'axecom') {
        // Pour AXECOM : grille = AXECOM MANCHE ou B2B : AXECOM MANCHE
        grilleInterventionFilter = `AND i.grille IN ('AXECOM MANCHE', 'B2B : AXECOM MANCHE')`
      }
    }

    // Construire la requête SQL avec les filtres
    const sqlQuery = `
      WITH employee_labels AS (
        SELECT 
          i.nom_technicien,
          i.prenom_technicien,
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM interventions i2 
              WHERE i2.nom_technicien = i.nom_technicien 
              AND i2.prenom_technicien = i.prenom_technicien
              AND i2.grille IN ('AXECOM MANCHE', 'B2B : AXECOM MANCHE')
              AND (
                (i2.cloture_tech IS NOT NULL AND i2.cloture_tech != '' AND i2.cloture_tech != 'nan' AND 
                 i2.cloture_tech ~ '^[0-9]' AND 
                 (i2.cloture_tech::date >= $1::date AND i2.cloture_tech::date <= $2::date)) OR
                (i2.cloture_hotline IS NOT NULL AND i2.cloture_hotline != '' AND i2.cloture_hotline != 'nan' AND 
                 i2.cloture_hotline ~ '^[0-9]' AND 
                 (i2.cloture_hotline::date >= $1::date AND i2.cloture_hotline::date <= $2::date)) OR
                (i2.cloture_tech IS NULL AND i2.cloture_hotline IS NULL AND 
                 i2.date_rdv IS NOT NULL AND i2.date_rdv != '' AND i2.date_rdv != 'nan' AND 
                 i2.date_rdv ~ '^[0-9]' AND 
                 (i2.date_rdv::date >= $1::date AND i2.date_rdv::date <= $2::date))
              )
            ) THEN 'AXECOM'
            ELSE NULL
          END as axecom_label,
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM interventions i3 
              WHERE i3.nom_technicien = i.nom_technicien 
              AND i3.prenom_technicien = i.prenom_technicien
              AND i3.grille NOT IN ('AXECOM MANCHE', 'B2B : AXECOM MANCHE')
              AND i3.grille IS NOT NULL
              AND i3.grille != ''
              AND (
                (i3.cloture_tech IS NOT NULL AND i3.cloture_tech != '' AND i3.cloture_tech != 'nan' AND 
                 i3.cloture_tech ~ '^[0-9]' AND 
                 (i3.cloture_tech::date >= $1::date AND i3.cloture_tech::date <= $2::date)) OR
                (i3.cloture_hotline IS NOT NULL AND i3.cloture_hotline != '' AND i3.cloture_hotline != 'nan' AND 
                 i3.cloture_hotline ~ '^[0-9]' AND 
                 (i3.cloture_hotline::date >= $1::date AND i3.cloture_hotline::date <= $2::date)) OR
                (i3.cloture_tech IS NULL AND i3.cloture_hotline IS NULL AND 
                 i3.date_rdv IS NOT NULL AND i3.date_rdv != '' AND i3.date_rdv != 'nan' AND 
                 i3.date_rdv ~ '^[0-9]' AND 
                 (i3.date_rdv::date >= $1::date AND i3.date_rdv::date <= $2::date))
              )
            ) THEN 'ERT'
            ELSE NULL
          END as ert_label
        FROM interventions i
        WHERE i.statut = 'CLOTURE TERMINEE'
          AND i.articles IS NOT NULL 
          AND i.articles != ''
          ${employeFilter}
          ${grilleInterventionFilter}
          AND (
            (i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND 
             i.cloture_tech ~ '^[0-9]' AND 
             (i.cloture_tech::date >= $1::date AND i.cloture_tech::date <= $2::date)) OR
            (i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND 
             i.cloture_hotline ~ '^[0-9]' AND 
             (i.cloture_hotline::date >= $1::date AND i.cloture_hotline::date <= $2::date)) OR
            (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND 
             i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND 
             i.date_rdv ~ '^[0-9]' AND 
             (i.date_rdv::date >= $1::date AND i.date_rdv::date <= $2::date))
          )
        GROUP BY i.nom_technicien, i.prenom_technicien
      ),
      interventions_data AS (
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
                      -- Exception: Si l'intervention contient à la fois DEP_OFFE et SAV, ignorer DEP_OFFE
                      WHEN TRIM(SPLIT_PART(article_item, 'x', 1)) = 'DEP_OFFE' 
                           AND i.articles LIKE '%SAV%' THEN 0
                      -- Sinon, calculer normalement
                      WHEN cp.prix_tech IS NOT NULL THEN cp.prix_tech
                      ELSE 0
                    END
                  )
                  FROM unnest(string_to_array(i.articles, ',')) as article_item
                  LEFT JOIN company_pricing cp ON 
                    TRIM(SPLIT_PART(article_item, 'x', 1)) = cp.service_code
                    AND cp.company_name = 'ERT OUEST'
                    AND cp.category = i.type_intervention
                    ${grilleFilter}
                  ), 0
                )
              ELSE 0
            END
          ) as total_recette_technicien,
          SUM(
            CASE 
              WHEN i.statut = 'CLOTURE TERMINEE' THEN
                COALESCE(
                  (SELECT SUM(
                    CASE 
                      -- Exception: Si l'intervention contient à la fois DEP_OFFE et SAV, ignorer DEP_OFFE
                      WHEN TRIM(SPLIT_PART(article_item, 'x', 1)) = 'DEP_OFFE' 
                           AND i.articles LIKE '%SAV%' THEN 0
                      -- Sinon, calculer normalement
                      WHEN cp.prix_base IS NOT NULL THEN cp.prix_base
                      ELSE 0
                    END
                  )
                  FROM unnest(string_to_array(i.articles, ',')) as article_item
                  LEFT JOIN company_pricing cp ON 
                    TRIM(SPLIT_PART(article_item, 'x', 1)) = cp.service_code
                    AND cp.company_name = 'ERT OUEST'
                    AND cp.category = i.type_intervention
                    ${grilleFilter}
                  ), 0
                )
              ELSE 0
            END
          ) as total_recette_entreprise
        FROM interventions i
        WHERE i.statut = 'CLOTURE TERMINEE'
          AND i.articles IS NOT NULL 
          AND i.articles != ''
          ${employeFilter}
          ${grilleInterventionFilter}
          AND (
            -- Filtrage par cloture_tech (avec vérification des valeurs valides)
            (i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND 
             i.cloture_tech ~ '^[0-9]' AND 
             (i.cloture_tech::date >= $1::date AND i.cloture_tech::date <= $2::date)) OR
            -- Filtrage par cloture_hotline (avec vérification des valeurs valides)
            (i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND 
             i.cloture_hotline ~ '^[0-9]' AND 
             (i.cloture_hotline::date >= $1::date AND i.cloture_hotline::date <= $2::date)) OR
            -- Filtrage par date_rdv si les autres sont NULL (avec vérification des valeurs valides)
            (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND 
             i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND 
             i.date_rdv ~ '^[0-9]' AND 
             (i.date_rdv::date >= $1::date AND i.date_rdv::date <= $2::date))
          )
        GROUP BY i.nom_technicien, i.prenom_technicien
      ),
      carburant_data AS (
        SELECT 
          e.nom as employe_nom,
          e.prenom as employe_prenom,
          CONCAT('TECH_', UPPER(SUBSTRING(e.nom, 1, 3)), UPPER(SUBSTRING(e.prenom, 1, 2))) as matricule,
          COUNT(cc.id) as nombre_transactions_carburant,
          SUM(COALESCE(CAST(REPLACE(cc.ca_ttc, ',', '.') AS DECIMAL(10,2)), 0)) as consommation_totale_carburant,
          AVG(COALESCE(CAST(REPLACE(cc.ca_ttc, ',', '.') AS DECIMAL(10,2)), 0)) as consommation_moyenne_carburant
        FROM employes e
        INNER JOIN carburant_assignations ca ON e.id = ca.employe_id
        INNER JOIN carburant_consommation cc ON ca.carte_id = cc.numero_carte
        WHERE cc.ca_ttc IS NOT NULL 
          AND cc.ca_ttc != ''
          AND cc.ca_ttc != '0'
          AND cc.ca_ttc ~ '^[0-9]'
          ${selectedEmployee ? `AND e.nom = '${selectedEmployee.nom}' AND e.prenom = '${selectedEmployee.prenom}'` : ''}
          AND (
            -- Essayer différents formats de date
            (cc.date_livraison ~ '^[0-9]{2}\.[0-9]{2}\.[0-9]{4}$' AND 
             TO_DATE(cc.date_livraison, 'DD.MM.YYYY') >= $1::date AND 
             TO_DATE(cc.date_livraison, 'DD.MM.YYYY') <= $2::date) OR
            (cc.date_livraison ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND 
             cc.date_livraison::date >= $1::date AND 
             cc.date_livraison::date <= $2::date) OR
            (cc.date_livraison ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' AND 
             TO_DATE(cc.date_livraison, 'DD/MM/YYYY') >= $1::date AND 
             TO_DATE(cc.date_livraison, 'DD/MM/YYYY') <= $2::date) OR
            -- Recherche par pattern pour mai 2024/2025
            (cc.date_livraison LIKE '%05.2024%' OR cc.date_livraison LIKE '%05/2024%' OR cc.date_livraison LIKE '%2024-05%' OR
             cc.date_livraison LIKE '%05.2025%' OR cc.date_livraison LIKE '%05/2025%' OR cc.date_livraison LIKE '%2025-05%')
          )
        GROUP BY e.nom, e.prenom
      ),
      materiel_data AS (
        SELECT 
          e.nom as employe_nom,
          e.prenom as employe_prenom,
          CONCAT('TECH_', UPPER(SUBSTRING(e.nom, 1, 3)), UPPER(SUBSTRING(e.prenom, 1, 2))) as matricule,
          COUNT(am.id) as nombre_affectations_materiel,
          SUM(am.quantite_assignee) as quantite_totale_materiel,
          SUM(COALESCE(m.prix_unitaire, 0) * am.quantite_assignee) as valeur_totale_materiel,
          AVG(COALESCE(m.prix_unitaire, 0)) as prix_moyen_materiel
        FROM employes e
        INNER JOIN affectations_materiel am ON e.id = am.employe_id
        INNER JOIN materiel m ON am.materiel_id = m.id
        WHERE am.statut = 'active'
          AND am.date_affectation >= $1::date 
          AND am.date_affectation <= $2::date
          ${selectedEmployee ? `AND e.nom = '${selectedEmployee.nom}' AND e.prenom = '${selectedEmployee.prenom}'` : ''}
        GROUP BY e.nom, e.prenom
      )
      SELECT 
        COALESCE(id.employe_nom, cd.employe_nom, md.employe_nom) as employe_nom,
        COALESCE(id.employe_prenom, cd.employe_prenom, md.employe_prenom) as employe_prenom,
        COALESCE(id.matricule, cd.matricule, md.matricule) as matricule,
        COALESCE(id.nombre_interventions, 0) as nombre_interventions,
        COALESCE(id.total_recette_technicien, 0) as total_recette_technicien,
        COALESCE(id.total_recette_entreprise, 0) as total_recette_entreprise,
        COALESCE(cd.nombre_transactions_carburant, 0) as nombre_transactions_carburant,
        COALESCE(cd.consommation_totale_carburant, 0) as consommation_totale_carburant,
        COALESCE(cd.consommation_moyenne_carburant, 0) as consommation_moyenne_carburant,
        COALESCE(md.nombre_affectations_materiel, 0) as nombre_affectations_materiel,
        COALESCE(md.quantite_totale_materiel, 0) as quantite_totale_materiel,
        COALESCE(md.valeur_totale_materiel, 0) as valeur_totale_materiel,
        COALESCE(md.prix_moyen_materiel, 0) as prix_moyen_materiel,
        COALESCE(el.ert_label, '') as ert_label,
        COALESCE(el.axecom_label, '') as axecom_label
      FROM interventions_data id
      FULL OUTER JOIN carburant_data cd ON id.employe_nom = cd.employe_nom AND id.employe_prenom = cd.employe_prenom
      FULL OUTER JOIN materiel_data md ON COALESCE(id.employe_nom, cd.employe_nom) = md.employe_nom AND COALESCE(id.employe_prenom, cd.employe_prenom) = md.employe_prenom
      LEFT JOIN employee_labels el ON COALESCE(id.employe_nom, cd.employe_nom, md.employe_nom) = el.nom_technicien 
                                   AND COALESCE(id.employe_prenom, cd.employe_prenom, md.employe_prenom) = el.prenom_technicien
      ${selectedEmployee ? `WHERE (id.employe_nom = '${selectedEmployee.nom}' AND id.employe_prenom = '${selectedEmployee.prenom}') OR (cd.employe_nom = '${selectedEmployee.nom}' AND cd.employe_prenom = '${selectedEmployee.prenom}') OR (md.employe_nom = '${selectedEmployee.nom}' AND md.employe_prenom = '${selectedEmployee.prenom}')` : ''}
      ${grille && grille !== 'tout' ? `${selectedEmployee ? 'AND' : 'WHERE'} (id.employe_nom IS NOT NULL AND id.employe_prenom IS NOT NULL)` : ''}
      ORDER BY COALESCE(id.total_recette_technicien, 0) DESC
    `

    // Exécuter la requête avec les filtres
    const result = await query(sqlQuery, queryParams)
    
    // Convertir les valeurs numériques en nombres
    const recapData = result.rows.map((row: any) => ({
      employe_id: -1, // Pas d'ID employé dans cette version simplifiée
      employe_nom: row.employe_nom,
      employe_prenom: row.employe_prenom,
      employe_matricule: row.matricule,
      nombre_interventions: Number(row.nombre_interventions) || 0,
      total_recette_technicien: Number(row.total_recette_technicien) || 0,
      total_recette_entreprise: Number(row.total_recette_entreprise) || 0,
      nombre_transactions_carburant: Number(row.nombre_transactions_carburant) || 0,
      consommation_totale_carburant: Number(row.consommation_totale_carburant) || 0,
      consommation_moyenne_carburant: Number(row.consommation_moyenne_carburant) || 0,
      nombre_affectations_materiel: Number(row.nombre_affectations_materiel) || 0,
      quantite_totale_materiel: Number(row.quantite_totale_materiel) || 0,
      valeur_totale_materiel: Number(row.valeur_totale_materiel) || 0,
      prix_moyen_materiel: Number(row.prix_moyen_materiel) || 0,
      ert_label: row.ert_label || '',
      axecom_label: row.axecom_label || ''
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
