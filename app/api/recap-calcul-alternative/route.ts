import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

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

    // Requête alternative avec approche différente pour le carburant
    const result = await query(`
      WITH interventions_data AS (
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
          ) as total_recette_technicien,
          SUM(
            CASE 
              WHEN i.statut = 'CLOTURE TERMINEE' THEN
                COALESCE(
                  (SELECT SUM(
                    CASE 
                      WHEN cp.prix_base IS NOT NULL THEN cp.prix_base
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
          ) as total_recette_entreprise
        FROM interventions i
        WHERE i.statut = 'CLOTURE TERMINEE'
          AND i.articles IS NOT NULL 
          AND i.articles != ''
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
      carburant_data AS (
        SELECT 
          e.nom as employe_nom,
          e.prenom as employe_prenom,
          CONCAT('TECH_', UPPER(SUBSTRING(e.nom, 1, 3)), UPPER(SUBSTRING(e.prenom, 1, 2))) as matricule,
          COUNT(cc.id) as nombre_transactions_carburant,
          SUM(COALESCE(CAST(REPLACE(cc.ca_ttc, ',', '.') AS DECIMAL(10,2)), 0)) as consommation_totale_carburant,
          AVG(COALESCE(CAST(REPLACE(cc.ca_ttc, ',', '.') AS DECIMAL(10,2)), 0)) as consommation_moyenne_carburant
        FROM employes e
        INNER JOIN carburant_consommation cc ON e.id = cc.employe_assigné
        WHERE cc.date_livraison IS NOT NULL 
          AND cc.date_livraison != ''
          AND cc.ca_ttc IS NOT NULL 
          AND cc.ca_ttc != ''
          AND cc.ca_ttc != '0'
          AND cc.ca_ttc ~ '^[0-9]'
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
             TO_DATE(cc.date_livraison, 'DD/MM/YYYY') <= $2::date)
          )
        GROUP BY e.nom, e.prenom
      )
      SELECT 
        COALESCE(id.employe_nom, cd.employe_nom) as employe_nom,
        COALESCE(id.employe_prenom, cd.employe_prenom) as employe_prenom,
        COALESCE(id.matricule, cd.matricule) as matricule,
        COALESCE(id.nombre_interventions, 0) as nombre_interventions,
        COALESCE(id.total_recette_technicien, 0) as total_recette_technicien,
        COALESCE(id.total_recette_entreprise, 0) as total_recette_entreprise,
        COALESCE(cd.nombre_transactions_carburant, 0) as nombre_transactions_carburant,
        COALESCE(cd.consommation_totale_carburant, 0) as consommation_totale_carburant,
        COALESCE(cd.consommation_moyenne_carburant, 0) as consommation_moyenne_carburant
      FROM interventions_data id
      FULL OUTER JOIN carburant_data cd ON id.employe_nom = cd.employe_nom AND id.employe_prenom = cd.employe_prenom
      ORDER BY COALESCE(id.total_recette_technicien, 0) DESC
    `, [startDate, effectiveEndDate])
    
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
      consommation_moyenne_carburant: Number(row.consommation_moyenne_carburant) || 0
    }))
    
    return NextResponse.json({ 
      success: true,
      recettesParTechnicien: recapData,
      total: recapData.length
    })
  } catch (error) {
    console.error("Erreur API récap calcul alternative GET:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
