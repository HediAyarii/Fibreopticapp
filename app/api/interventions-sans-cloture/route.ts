import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

// Condition: intervention clôturée terminée SANS date de clôture valide
const SANS_CLOTURE = `
  (cloture_tech IS NULL OR cloture_tech = '' OR cloture_tech = 'nan' OR cloture_tech !~ '^[0-9]')
  AND (cloture_hotline IS NULL OR cloture_hotline = '' OR cloture_hotline = 'nan' OR cloture_hotline !~ '^[0-9]')
`

// Recette technicien (même logique que recap-calcul / cout-par-salaire)
const RECETTE_TECH = `
  COALESCE((SELECT SUM(
    CASE
      WHEN TRIM(SPLIT_PART(article_item, 'x', 1)) = 'DEP_OFFE' AND i.articles LIKE '%SAV%' THEN 0
      WHEN cp.prix_tech IS NOT NULL THEN cp.prix_tech * COALESCE(NULLIF(TRIM(SPLIT_PART(article_item, 'x', 2)), '')::INTEGER, 1)
      ELSE 0
    END)
    FROM unnest(string_to_array(i.articles, ',')) as article_item
    LEFT JOIN company_pricing cp ON
      TRIM(SPLIT_PART(article_item, 'x', 1)) = cp.service_code
      AND cp.company_name = CASE WHEN i.grille LIKE '%AXECOM%' THEN 'AXECOM' ELSE 'ERT OUEST' END
      AND cp.category = CASE WHEN i.type_intervention IN ('RACC', 'RECO', 'RECC') THEN 'RACC' ELSE 'SAV' END
    WHERE article_item != 'nan' AND TRIM(article_item) != ''
  ), 0)
`

// GET - Lister les interventions clôturées terminées sans date de clôture
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const technicien = searchParams.get('technicien')
    const mois = searchParams.get('mois') // format 'YYYY-MM'

    const whereClauses: string[] = [
      `i.statut = 'CLOTURE TERMINEE'`,
      `i.articles IS NOT NULL AND i.articles != '' AND i.articles != 'nan'`,
      SANS_CLOTURE
    ]
    const params: any[] = []
    let paramIndex = 1

    // Filtre par mois sur date_rdv (date_rdv en texte, formats mixtes YYYY-MM-DD et DD/MM/YYYY)
    if (mois && /^\d{4}-\d{2}$/.test(mois)) {
      const debut = `${mois}-01`
      whereClauses.push(`
        i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND (
          (i.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' AND i.date_rdv::date >= $${paramIndex}::date AND i.date_rdv::date < ($${paramIndex}::date + INTERVAL '1 month'))
          OR (i.date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' AND TO_DATE(SUBSTRING(i.date_rdv FROM 1 FOR 10), 'DD/MM/YYYY') >= $${paramIndex}::date AND TO_DATE(SUBSTRING(i.date_rdv FROM 1 FOR 10), 'DD/MM/YYYY') < ($${paramIndex}::date + INTERVAL '1 month'))
        )`)
      params.push(debut)
      paramIndex++
    }

    if (technicien && technicien !== 'all') {
      whereClauses.push(`LOWER(CONCAT(i.prenom_technicien, ' ', i.nom_technicien)) = LOWER($${paramIndex})`)
      params.push(technicien)
      paramIndex++
    }

    if (search) {
      whereClauses.push(`(i.num_inter ILIKE $${paramIndex} OR i.client ILIKE $${paramIndex} OR CONCAT(i.prenom_technicien,' ',i.nom_technicien) ILIKE $${paramIndex})`)
      params.push(`%${search}%`)
      paramIndex++
    }

    const result = await query(`
      SELECT
        i.id,
        i.num_inter,
        i.nom_technicien,
        i.prenom_technicien,
        i.client,
        i.date_rdv,
        i.type_intervention,
        i.articles,
        i.grille,
        i.ville,
        ${RECETTE_TECH} as recette_technicien
      FROM interventions i
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY i.date_rdv DESC NULLS LAST, i.num_inter
    `, params)

    return NextResponse.json({
      success: true,
      interventions: result.rows,
      total: result.rows.length
    })
  } catch (error) {
    console.error("Erreur GET interventions-sans-cloture:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// PUT - Classer une intervention dans un mois en lui assignant une date de clôture
// body: { id, date_cloture: 'YYYY-MM-DD' }  (date_cloture = date_rdv ou choisie par l'admin)
export async function PUT(request: NextRequest) {
  try {
    const { id, date_cloture } = await request.json()

    if (!id || !date_cloture) {
      return NextResponse.json({ error: "id et date_cloture requis" }, { status: 400 })
    }

    // On renseigne cloture_tech (utilisé en priorité par toutes les vues de recette)
    const result = await query(`
      UPDATE interventions
      SET cloture_tech = $1
      WHERE id = $2
        AND statut = 'CLOTURE TERMINEE'
        AND ${SANS_CLOTURE}
      RETURNING id, num_inter, cloture_tech
    `, [date_cloture, id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Intervention non trouvée ou déjà clôturée" }, { status: 404 })
    }

    return NextResponse.json({ success: true, intervention: result.rows[0] })
  } catch (error) {
    console.error("Erreur PUT interventions-sans-cloture:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
