import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const grille = searchParams.get('grille') // 'axecom', 'ert', ou 'tout'
    const codeArticle = searchParams.get('codeArticle')

    if (!startDate || !endDate || !codeArticle) {
      return NextResponse.json(
        { success: false, error: 'Les paramètres startDate, endDate et codeArticle sont requis' },
        { status: 400 }
      )
    }

    // Construire le filtre de grille (accepter majuscules et minuscules)
    let grilleFilter = ''
    const grilleLower = grille?.toLowerCase()
    if (grilleLower === 'axecom') {
      grilleFilter = "AND i.grille LIKE '%AXECOM%'"
    } else if (grilleLower === 'ert') {
      grilleFilter = "AND (i.grille NOT LIKE '%AXECOM%' OR i.grille IS NULL)"
    }

    // Requête pour récupérer les interventions contenant cet article
    // Si l'article est DEP OFF et l'intervention contient SAV, on ne l'inclut pas
    const isDepOff = codeArticle.toUpperCase().includes('DEP') && codeArticle.toUpperCase().includes('OFF')
    
    const sqlQuery = `
      SELECT DISTINCT
        i.num_inter,
        i.date_rdv,
        i.nom_technicien,
        i.prenom_technicien,
        i.client,
        i.type_intervention,
        i.grille,
        i.articles,
        i.statut,
        i.ville,
        i.code_postal,
        CASE WHEN i.grille LIKE '%AXECOM%' THEN 'AXECOM' ELSE 'ERT' END as grille_type,
        -- Extraire la quantité de l'article spécifique
        (
          SELECT COALESCE(NULLIF(TRIM(SPLIT_PART(art, ' x', 2)), '')::INTEGER, 1)
          FROM unnest(string_to_array(i.articles, ',')) as art
          WHERE TRIM(SPLIT_PART(art, ' x', 1)) = $3
          LIMIT 1
        ) as quantite_article,
        -- Vérifier si l'intervention contient SAV
        CASE WHEN i.articles ILIKE '%SAV%' THEN true ELSE false END as has_sav
      FROM interventions i
      WHERE i.statut = 'CLOTURE TERMINEE'
        AND i.articles IS NOT NULL 
        AND i.articles != ''
        AND i.articles != 'nan'
        AND i.date_rdv IS NOT NULL 
        AND i.date_rdv != ''
        AND i.date_rdv::date >= $1::date 
        AND i.date_rdv::date <= $2::date
        AND EXISTS (
          SELECT 1 FROM unnest(string_to_array(i.articles, ',')) as article_item
          WHERE TRIM(SPLIT_PART(article_item, ' x', 1)) = $3
        )
        ${grilleFilter}
        ${isDepOff ? "AND NOT (i.articles ILIKE '%SAV%')" : ""}
      ORDER BY i.date_rdv DESC, i.num_inter
    `

    const result = await query(sqlQuery, [startDate, endDate, codeArticle])

    // Mapper les données pour le frontend
    const data = result.rows.map((row: any) => ({
      id: row.num_inter,
      nd: row.client || '-',
      date: row.date_rdv,
      technicien: `${row.prenom_technicien || ''} ${row.nom_technicien || ''}`.trim() || '-',
      adresse: `${row.ville || ''} ${row.code_postal || ''}`.trim() || '-',
      type_intervention: row.type_intervention || '-',
      quantite: row.quantite_article || 1,
      statut: row.statut || '-'
    }))

    return NextResponse.json({
      success: true,
      data,
      count: data.length,
      filters: {
        startDate,
        endDate,
        grille: grille || 'tout',
        codeArticle
      }
    })
  } catch (error: any) {
    console.error('Erreur API recap-articles/details:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
