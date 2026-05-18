import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { ensureReclaFreeTable } from "@/lib/ensure-recla-free-table"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await ensureReclaFreeTable()
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

    // Construire la requête SQL avec les filtres - REGROUPEMENT PAR MATRICULE pour éviter les doublons
    const sqlQuery = `
      WITH employee_mapping AS (
        -- Mapper les noms des interventions aux employés via correspondance nom/prénom normalisée
        SELECT DISTINCT
          i.nom_technicien,
          i.prenom_technicien,
          e.id as employe_id,
          e.nom as employe_nom_officiel,
          e.prenom as employe_prenom_officiel,
          e.matricule as employe_matricule
        FROM interventions i
        LEFT JOIN employes e ON (
          -- Correspondance exacte insensible à la casse
          (LOWER(TRIM(i.nom_technicien)) = LOWER(TRIM(e.nom)) AND LOWER(TRIM(SPLIT_PART(i.prenom_technicien, ',', 1))) = LOWER(TRIM(e.prenom)))
          OR
          -- Correspondance avec le premier mot du nom
          (LOWER(TRIM(SPLIT_PART(i.nom_technicien, ' ', 1))) = LOWER(TRIM(e.nom)) AND LOWER(TRIM(SPLIT_PART(i.prenom_technicien, ',', 1))) = LOWER(TRIM(e.prenom)))
          OR
          -- Correspondance inversée nom/prénom
          (LOWER(TRIM(i.nom_technicien)) = LOWER(TRIM(e.prenom)) AND LOWER(TRIM(SPLIT_PART(i.prenom_technicien, ',', 1))) = LOWER(TRIM(e.nom)))
        )
        WHERE e.statut = 'actif' OR e.statut IS NULL
      ),
      employee_labels AS (
        SELECT 
          em.employe_matricule as matricule,
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM interventions i2 
              JOIN employee_mapping em2 ON i2.nom_technicien = em2.nom_technicien AND i2.prenom_technicien = em2.prenom_technicien
              WHERE em2.employe_matricule = em.employe_matricule
              AND i2.grille IN ('AXECOM MANCHE', 'B2B : AXECOM MANCHE')
              AND (
                -- Utiliser cloture_tech ou cloture_hotline (cohérence avec Coût par Salaire)
                (i2.cloture_tech IS NOT NULL AND i2.cloture_tech != '' AND i2.cloture_tech != 'nan' AND i2.cloture_tech ~ '^[0-9]' AND
                  CASE
                    WHEN i2.cloture_tech ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN i2.cloture_tech::date
                    WHEN i2.cloture_tech ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN TO_DATE(SUBSTRING(i2.cloture_tech FROM 1 FOR 10), 'DD/MM/YYYY')
                  END BETWEEN $1::date AND $2::date
                ) OR
                (i2.cloture_hotline IS NOT NULL AND i2.cloture_hotline != '' AND i2.cloture_hotline != 'nan' AND i2.cloture_hotline ~ '^[0-9]' AND
                  CASE
                    WHEN i2.cloture_hotline ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN i2.cloture_hotline::date
                    WHEN i2.cloture_hotline ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN TO_DATE(SUBSTRING(i2.cloture_hotline FROM 1 FOR 10), 'DD/MM/YYYY')
                  END BETWEEN $1::date AND $2::date
                )
              )
            ) THEN 'AXECOM'
            ELSE NULL
          END as axecom_label,
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM interventions i3 
              JOIN employee_mapping em3 ON i3.nom_technicien = em3.nom_technicien AND i3.prenom_technicien = em3.prenom_technicien
              WHERE em3.employe_matricule = em.employe_matricule
              AND i3.grille NOT IN ('AXECOM MANCHE', 'B2B : AXECOM MANCHE')
              AND i3.grille IS NOT NULL
              AND i3.grille != ''
              AND (
                -- Utiliser cloture_tech ou cloture_hotline (cohérence avec Coût par Salaire)
                (i3.cloture_tech IS NOT NULL AND i3.cloture_tech != '' AND i3.cloture_tech != 'nan' AND i3.cloture_tech ~ '^[0-9]' AND
                  CASE
                    WHEN i3.cloture_tech ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN i3.cloture_tech::date
                    WHEN i3.cloture_tech ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN TO_DATE(SUBSTRING(i3.cloture_tech FROM 1 FOR 10), 'DD/MM/YYYY')
                  END BETWEEN $1::date AND $2::date
                ) OR
                (i3.cloture_hotline IS NOT NULL AND i3.cloture_hotline != '' AND i3.cloture_hotline != 'nan' AND i3.cloture_hotline ~ '^[0-9]' AND
                  CASE
                    WHEN i3.cloture_hotline ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN i3.cloture_hotline::date
                    WHEN i3.cloture_hotline ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN TO_DATE(SUBSTRING(i3.cloture_hotline FROM 1 FOR 10), 'DD/MM/YYYY')
                  END BETWEEN $1::date AND $2::date
                )
              )
            ) THEN 'ERT'
            ELSE NULL
          END as ert_label
        FROM employee_mapping em
        WHERE em.employe_matricule IS NOT NULL
        GROUP BY em.employe_matricule
      ),
      interventions_data AS (
        SELECT 
          -- Utiliser le nom/prénom officiel de l'employé
          COALESCE(em.employe_nom_officiel, i.nom_technicien) as employe_nom,
          COALESCE(em.employe_prenom_officiel, i.prenom_technicien) as employe_prenom,
          -- Utiliser le vrai matricule de la table employés
          COALESCE(em.employe_matricule, CONCAT('TECH_', UPPER(SUBSTRING(i.nom_technicien, 1, 3)), UPPER(SUBSTRING(i.prenom_technicien, 1, 2)))) as matricule,
          em.employe_id,
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
            END
          ) as total_recette_entreprise
        FROM interventions i
        LEFT JOIN employee_mapping em ON i.nom_technicien = em.nom_technicien AND i.prenom_technicien = em.prenom_technicien
        WHERE i.statut = 'CLOTURE TERMINEE'
          AND i.articles IS NOT NULL 
          AND i.articles != ''
          ${employeFilter}
          ${grilleInterventionFilter}
          AND (
            -- Utiliser CASE pour déterminer la date effective (priorité: cloture_tech > cloture_hotline)
            -- NOTE: On n'utilise PAS date_rdv comme fallback pour être cohérent avec Coût par Salaire
            CASE
              -- Si cloture_tech existe et est valide, l'utiliser
              WHEN i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND i.cloture_tech ~ '^[0-9]' THEN
                CASE
                  WHEN i.cloture_tech ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN i.cloture_tech::date
                  WHEN i.cloture_tech ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN TO_DATE(SUBSTRING(i.cloture_tech FROM 1 FOR 10), 'DD/MM/YYYY')
                  ELSE NULL
                END
              -- Sinon si cloture_hotline existe et est valide, l'utiliser
              WHEN i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND i.cloture_hotline ~ '^[0-9]' THEN
                CASE
                  WHEN i.cloture_hotline ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN i.cloture_hotline::date
                  WHEN i.cloture_hotline ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN TO_DATE(SUBSTRING(i.cloture_hotline FROM 1 FOR 10), 'DD/MM/YYYY')
                  ELSE NULL
                END
              ELSE NULL
            END BETWEEN $1::date AND $2::date
          )
        -- REGROUPER PAR MATRICULE pour fusionner les variations de noms
        GROUP BY COALESCE(em.employe_matricule, CONCAT('TECH_', UPPER(SUBSTRING(i.nom_technicien, 1, 3)), UPPER(SUBSTRING(i.prenom_technicien, 1, 2)))),
                 COALESCE(em.employe_nom_officiel, i.nom_technicien),
                 COALESCE(em.employe_prenom_officiel, i.prenom_technicien),
                 em.employe_id
      ),
      carburant_data AS (
        SELECT 
          e.nom as employe_nom,
          e.prenom as employe_prenom,
          e.matricule as matricule,
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
          ${selectedEmployee ? `AND e.matricule = '${selectedEmployee.matricule}'` : ''}
          AND (
            -- Format dd.MM.yyyy
            (cc.date_livraison ~ '^[0-9]{2}\.[0-9]{2}\.[0-9]{4}$' AND 
             TO_DATE(cc.date_livraison, 'DD.MM.YYYY') >= $1::date AND 
             TO_DATE(cc.date_livraison, 'DD.MM.YYYY') <= $2::date) OR
            -- Format yyyy-MM-dd
            (cc.date_livraison ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND 
             cc.date_livraison::date >= $1::date AND 
             cc.date_livraison::date <= $2::date) OR
            -- Format dd/MM/yyyy
            (cc.date_livraison ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' AND 
             TO_DATE(cc.date_livraison, 'DD/MM/YYYY') >= $1::date AND 
             TO_DATE(cc.date_livraison, 'DD/MM/YYYY') <= $2::date)
          )
        GROUP BY e.nom, e.prenom, e.matricule
      ),
      materiel_data AS (
        SELECT 
          e.nom as employe_nom,
          e.prenom as employe_prenom,
          e.matricule as matricule,
          COUNT(am.id) as nombre_affectations_materiel,
          SUM(am.quantite_assignee) as quantite_totale_materiel,
          SUM(COALESCE(m.prix_unitaire, 0) * am.quantite_assignee) as valeur_totale_materiel,
          AVG(COALESCE(m.prix_unitaire, 0)) as prix_moyen_materiel
        FROM employes e
        INNER JOIN affectations_materiel am ON e.id = am.employe_id
        INNER JOIN materiel m ON am.materiel_id = m.id
        WHERE am.statut = 'active'
          ${selectedEmployee ? `AND e.matricule = '${selectedEmployee.matricule}'` : ''}
          AND am.date_affectation::date >= $1::date 
          AND am.date_affectation::date <= $2::date
        GROUP BY e.nom, e.prenom, e.matricule
      ),
      recla_free_data AS (
        SELECT
          e.matricule,
          e.id as employe_id,
          e.nom as employe_nom,
          e.prenom as employe_prenom,
          COALESCE(SUM(rf.montant_technicien), 0) as total_recla_free_confirmee,
          COALESCE(SUM(rf.montant_entreprise), 0) as total_recla_free_entreprise
        FROM recla_free rf
        JOIN employes e ON rf.employe_id = e.id
        WHERE rf.confirmer = TRUE
          AND rf.date_confirmation IS NOT NULL
          AND rf.date_confirmation::date >= $1::date
          AND rf.date_confirmation::date <= $2::date
          ${selectedEmployee ? `AND e.matricule = '${selectedEmployee.matricule}'` : ''}
        GROUP BY e.matricule, e.id, e.nom, e.prenom
      )
      SELECT 
        COALESCE(id.employe_nom, cd.employe_nom, md.employe_nom, rfd.employe_nom) as employe_nom,
        COALESCE(id.employe_prenom, cd.employe_prenom, md.employe_prenom, rfd.employe_prenom) as employe_prenom,
        COALESCE(id.matricule, cd.matricule, md.matricule, rfd.matricule) as matricule,
        COALESCE(id.employe_id, rfd.employe_id, -1) as employe_id,
        COALESCE(id.nombre_interventions, 0) as nombre_interventions,
        COALESCE(id.total_recette_technicien, 0) + COALESCE(rfd.total_recla_free_confirmee, 0) as total_recette_technicien,
        COALESCE(id.total_recette_entreprise, 0) + COALESCE(rfd.total_recla_free_entreprise, 0) as total_recette_entreprise,
        COALESCE(rfd.total_recla_free_confirmee, 0) as total_recla_free_confirmee,
        COALESCE(rfd.total_recla_free_entreprise, 0) as total_recla_free_entreprise,
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
      FULL OUTER JOIN carburant_data cd ON id.matricule = cd.matricule
      FULL OUTER JOIN materiel_data md ON COALESCE(id.matricule, cd.matricule) = md.matricule
      FULL OUTER JOIN recla_free_data rfd ON COALESCE(id.matricule, cd.matricule, md.matricule) = rfd.matricule
      LEFT JOIN employee_labels el ON COALESCE(id.matricule, cd.matricule, md.matricule, rfd.matricule) = el.matricule
      ${selectedEmployee ? `WHERE id.matricule = '${selectedEmployee.matricule}' OR cd.matricule = '${selectedEmployee.matricule}' OR md.matricule = '${selectedEmployee.matricule}' OR rfd.matricule = '${selectedEmployee.matricule}'` : ''}
      ORDER BY (COALESCE(id.total_recette_technicien, 0) + COALESCE(rfd.total_recla_free_confirmee, 0)) DESC
    `

    // Exécuter la requête avec les filtres
    const result = await query(sqlQuery, queryParams)
    
    // Convertir les valeurs numériques en nombres
    const recapData = result.rows.map((row: any) => {
      // Cas spécial: ZOBAIR MOULAHI (TECH_ZOBMO) est toujours ERT
      const isZobairMoulahi = 
        (row.employe_nom?.toUpperCase() === 'MOULAHI' && row.employe_prenom?.toUpperCase() === 'ZOBAIR') ||
        (row.employe_nom?.toUpperCase() === 'ZOBAIR' && row.employe_prenom?.toUpperCase() === 'MOULAHI')
      
      return {
        employe_id: Number(row.employe_id) || -1,
        employe_nom: row.employe_nom,
        employe_prenom: row.employe_prenom,
        employe_matricule: row.matricule,
        nombre_interventions: Number(row.nombre_interventions) || 0,
        total_recette_technicien: Number(row.total_recette_technicien) || 0,
        total_recette_entreprise: Number(row.total_recette_entreprise) || 0,
        total_recla_free_confirmee: Number(row.total_recla_free_confirmee) || 0,
        total_recla_free_entreprise: Number(row.total_recla_free_entreprise) || 0,
        nombre_transactions_carburant: Number(row.nombre_transactions_carburant) || 0,
        consommation_totale_carburant: Number(row.consommation_totale_carburant) || 0,
        consommation_moyenne_carburant: Number(row.consommation_moyenne_carburant) || 0,
        nombre_affectations_materiel: Number(row.nombre_affectations_materiel) || 0,
        quantite_totale_materiel: Number(row.quantite_totale_materiel) || 0,
        valeur_totale_materiel: Number(row.valeur_totale_materiel) || 0,
        prix_moyen_materiel: Number(row.prix_moyen_materiel) || 0,
        ert_label: isZobairMoulahi ? 'ERT' : (row.ert_label || ''),
        axecom_label: isZobairMoulahi ? '' : (row.axecom_label || '')
      }
    })
    
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
