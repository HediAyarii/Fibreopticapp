import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const grille = searchParams.get('grille') // 'axecom', 'ert', ou 'tout'

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Les dates de début et fin sont requises' },
        { status: 400 }
      )
    }

    // Construire le filtre de grille (avec alias 'i' pour la première requête)
    let grilleFilter = ''
    // Filtre sans alias pour la deuxième requête
    let grilleFilterNoAlias = ''
    
    if (grille === 'axecom') {
      grilleFilter = "AND i.grille LIKE '%AXECOM%'"
      grilleFilterNoAlias = "AND grille LIKE '%AXECOM%'"
    } else if (grille === 'ert') {
      grilleFilter = "AND (i.grille NOT LIKE '%AXECOM%' OR i.grille IS NULL)"
      grilleFilterNoAlias = "AND (grille NOT LIKE '%AXECOM%' OR grille IS NULL)"
    }

    // Requête pour récupérer les articles agrégés par grille
    // Exclure DEP OFF si l'intervention contient aussi SAV (comme dans recap-calcul)
    const sqlQuery = `
      WITH filtered_articles AS (
        SELECT 
          i.num_inter,
          i.grille,
          i.articles,
          article_item,
          -- Vérifier si l'intervention contient SAV
          CASE WHEN i.articles ILIKE '%SAV%' THEN true ELSE false END as has_sav
        FROM interventions i,
             unnest(string_to_array(i.articles, ',')) as article_item
        WHERE i.statut = 'CLOTURE TERMINEE'
          AND i.articles IS NOT NULL 
          AND i.articles != ''
          AND i.articles != 'nan'
          AND article_item != 'nan'
          AND TRIM(article_item) != ''
          AND i.date_rdv IS NOT NULL 
          AND i.date_rdv != ''
          AND i.date_rdv::date >= $1::date 
          AND i.date_rdv::date <= $2::date
          ${grilleFilter}
      )
      SELECT 
        CASE WHEN grille LIKE '%AXECOM%' THEN 'AXECOM' ELSE 'ERT' END as grille_type,
        TRIM(SPLIT_PART(article_item, ' x', 1)) as code_article,
        COUNT(DISTINCT num_inter) as nb_interventions,
        SUM(COALESCE(NULLIF(TRIM(SPLIT_PART(article_item, ' x', 2)), '')::INTEGER, 1)) as quantite_totale
      FROM filtered_articles
      WHERE 
        -- Si l'article est DEP OFF et l'intervention contient SAV, on l'ignore
        NOT (TRIM(SPLIT_PART(article_item, ' x', 1)) ILIKE '%DEP%OFF%' AND has_sav = true)
      GROUP BY 
        CASE WHEN grille LIKE '%AXECOM%' THEN 'AXECOM' ELSE 'ERT' END,
        TRIM(SPLIT_PART(article_item, ' x', 1))
      ORDER BY grille_type, quantite_totale DESC
    `

    const result = await query(sqlQuery, [startDate, endDate])

    // Organiser les données par grille
    const articlesByGrille: {
      AXECOM: { code_article: string; nb_interventions: number; quantite_totale: number }[];
      ERT: { code_article: string; nb_interventions: number; quantite_totale: number }[];
    } = {
      AXECOM: [],
      ERT: []
    }

    let totalQuantiteAxecom = 0
    let totalQuantiteErt = 0
    let totalInterventionsAxecom = 0
    let totalInterventionsErt = 0

    result.rows.forEach((row: any) => {
      const item = {
        code_article: row.code_article,
        nb_interventions: parseInt(row.nb_interventions),
        quantite_totale: parseInt(row.quantite_totale)
      }

      if (row.grille_type === 'AXECOM') {
        articlesByGrille.AXECOM.push(item)
        totalQuantiteAxecom += item.quantite_totale
        totalInterventionsAxecom += item.nb_interventions
      } else {
        articlesByGrille.ERT.push(item)
        totalQuantiteErt += item.quantite_totale
        totalInterventionsErt += item.nb_interventions
      }
    })

    // Récupérer le total d'interventions par grille
    const statsQuery = `
      SELECT 
        CASE WHEN grille LIKE '%AXECOM%' THEN 'AXECOM' ELSE 'ERT' END as grille_type,
        COUNT(DISTINCT num_inter) as total_interventions
      FROM interventions
      WHERE statut = 'CLOTURE TERMINEE'
        AND articles IS NOT NULL 
        AND articles != ''
        AND articles != 'nan'
        AND date_rdv IS NOT NULL 
        AND date_rdv != ''
        AND date_rdv::date >= $1::date 
        AND date_rdv::date <= $2::date
        ${grilleFilterNoAlias}
      GROUP BY CASE WHEN grille LIKE '%AXECOM%' THEN 'AXECOM' ELSE 'ERT' END
    `

    const statsResult = await query(statsQuery, [startDate, endDate])
    
    const stats = {
      AXECOM: { totalInterventions: 0 },
      ERT: { totalInterventions: 0 }
    }

    statsResult.rows.forEach((row: any) => {
      if (row.grille_type === 'AXECOM') {
        stats.AXECOM.totalInterventions = parseInt(row.total_interventions)
      } else {
        stats.ERT.totalInterventions = parseInt(row.total_interventions)
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        articlesByGrille,
        totals: {
          AXECOM: {
            quantite: totalQuantiteAxecom,
            interventions: stats.AXECOM.totalInterventions
          },
          ERT: {
            quantite: totalQuantiteErt,
            interventions: stats.ERT.totalInterventions
          }
        },
        filters: {
          startDate,
          endDate,
          grille: grille || 'tout'
        }
      }
    })
  } catch (error: any) {
    console.error('Erreur API recap-articles:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
