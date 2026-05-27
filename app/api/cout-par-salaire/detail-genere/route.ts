import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const matricule = searchParams.get('matricule')
    const mois = searchParams.get('mois')
    const annee = searchParams.get('annee')

    if (!matricule || !mois || !annee) {
      return NextResponse.json({ error: "matricule, mois et annee sont requis" }, { status: 400 })
    }

    const moisInt = parseInt(mois)
    const anneeInt = parseInt(annee)

    // ─── Interventions ────────────────────────────────────────────────────────
    // Use the EXACT same date-priority CASE as revenue_by_matricule in the main route
    // so that the totals always match.
    const interventionsResult = await query(
      `
      WITH filtered AS (
        SELECT
          i.*,
          CASE
            WHEN i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND i.cloture_tech ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
              THEN EXTRACT(MONTH FROM i.cloture_tech::date)::int
            WHEN i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND i.cloture_tech ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}'
              THEN EXTRACT(MONTH FROM TO_DATE(SUBSTRING(i.cloture_tech FROM 1 FOR 10), 'DD/MM/YYYY'))::int
            WHEN i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND i.cloture_hotline ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
              THEN EXTRACT(MONTH FROM i.cloture_hotline::date)::int
            WHEN i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND i.cloture_hotline ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}'
              THEN EXTRACT(MONTH FROM TO_DATE(SUBSTRING(i.cloture_hotline FROM 1 FOR 10), 'DD/MM/YYYY'))::int
            WHEN i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND i.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
              THEN EXTRACT(MONTH FROM i.date_rdv::date)::int
            WHEN i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND i.date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}'
              THEN EXTRACT(MONTH FROM TO_DATE(i.date_rdv, 'DD/MM/YYYY'))::int
            ELSE NULL
          END AS mois_cloture,
          CASE
            WHEN i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND i.cloture_tech ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
              THEN EXTRACT(YEAR FROM i.cloture_tech::date)::int
            WHEN i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND i.cloture_tech ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}'
              THEN EXTRACT(YEAR FROM TO_DATE(SUBSTRING(i.cloture_tech FROM 1 FOR 10), 'DD/MM/YYYY'))::int
            WHEN i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND i.cloture_hotline ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
              THEN EXTRACT(YEAR FROM i.cloture_hotline::date)::int
            WHEN i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND i.cloture_hotline ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}'
              THEN EXTRACT(YEAR FROM TO_DATE(SUBSTRING(i.cloture_hotline FROM 1 FOR 10), 'DD/MM/YYYY'))::int
            WHEN i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND i.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
              THEN EXTRACT(YEAR FROM i.date_rdv::date)::int
            WHEN i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND i.date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}'
              THEN EXTRACT(YEAR FROM TO_DATE(i.date_rdv, 'DD/MM/YYYY'))::int
            ELSE NULL
          END AS annee_cloture
        FROM interventions i
        WHERE i.statut = 'CLOTURE TERMINEE'
          AND i.articles IS NOT NULL AND i.articles != ''
          AND CONCAT('TECH_', UPPER(SUBSTRING(SPLIT_PART(i.nom_technicien, ' ', 1), 1, 3)), UPPER(SUBSTRING(SPLIT_PART(i.prenom_technicien, ' ', 1), 1, 2))) = $1
      )
      SELECT
        f.id,
        f.num_inter,
        f.client,
        f.type_intervention,
        f.grille,
        f.articles,
        COALESCE(f.cloture_tech, f.cloture_hotline, f.date_rdv) AS date_cloture,
        COALESCE(
          (SELECT SUM(
            CASE
              WHEN TRIM(SPLIT_PART(article_item, 'x', 1)) = 'DEP_OFFE'
                   AND f.articles LIKE '%SAV%' THEN 0
              WHEN cp.prix_tech IS NOT NULL THEN
                cp.prix_tech * COALESCE(NULLIF(TRIM(SPLIT_PART(article_item, 'x', 2)), '')::INTEGER, 1)
              ELSE 0
            END
          )
          FROM unnest(string_to_array(f.articles, ',')) AS article_item
          LEFT JOIN company_pricing cp ON
            TRIM(SPLIT_PART(article_item, 'x', 1)) = cp.service_code
            AND cp.company_name = CASE
              WHEN f.grille LIKE '%AXECOM%' THEN 'AXECOM'
              ELSE 'ERT OUEST'
            END
            AND cp.category = CASE
              WHEN f.type_intervention IN ('RACC', 'RECO', 'RECC') THEN 'RACC'
              ELSE 'SAV'
            END
          WHERE article_item != 'nan' AND TRIM(article_item) != ''
          ), 0
        ) AS montant
      FROM filtered f
      WHERE f.mois_cloture = $2 AND f.annee_cloture = $3
      ORDER BY date_cloture DESC
      `,
      [matricule, moisInt, anneeInt]
    )

    // ─── Recla Free ───────────────────────────────────────────────────────────
    const reclaFreeResult = await query(
      `
      SELECT
        rf.id,
        rf.reference_client,
        rf.type_litige,
        rf.nature_travaux,
        rf.commentaire,
        rf.montant_technicien,
        rf.date_confirmation,
        rf.date
      FROM recla_free rf
      JOIN employes e ON rf.employe_id = e.id
      WHERE rf.confirmer = TRUE
        AND rf.date_confirmation IS NOT NULL
        AND e.matricule = $1
        AND EXTRACT(MONTH FROM rf.date_confirmation) = $2
        AND EXTRACT(YEAR FROM rf.date_confirmation) = $3
      ORDER BY rf.date_confirmation DESC
      `,
      [matricule, moisInt, anneeInt]
    )

    const interventions = interventionsResult.rows
    const reclasFree = reclaFreeResult.rows

    // ─── FTTO ─────────────────────────────────────────────────────────────────
    let fttoTickets: any[] = []
    try {
      const fttoResult = await query(
        `SELECT
           ft.id,
           ft.num_ticket,
           ft.date_ticket,
           ft.code_g2r,
           ft.ville,
           ft.code_article,
           ft.designation,
           ft.prix_unitaire,
           ft.quantite,
           ROUND(ft.prix_unitaire * ft.quantite, 2) AS total_ht,
           ROUND(ft.prix_unitaire * ft.quantite * 0.40, 2) AS part_technicien
         FROM ftto_tickets ft
         JOIN employes e ON ft.employe_id = e.id
         WHERE ft.date_ticket IS NOT NULL
           AND e.matricule = $1
           AND EXTRACT(MONTH FROM ft.date_ticket) = $2
           AND EXTRACT(YEAR FROM ft.date_ticket) = $3
         ORDER BY ft.date_ticket DESC`,
        [matricule, moisInt, anneeInt]
      )
      fttoTickets = fttoResult.rows
    } catch (_) { /* table may not exist yet */ }

    const totalInterventions = interventions.reduce((s: number, r: any) => s + Number(r.montant || 0), 0)
    const totalReclaFree = reclasFree.reduce((s: number, r: any) => s + Number(r.montant_technicien || 0), 0)
    const totalFtto = fttoTickets.reduce((s: number, r: any) => s + Number(r.part_technicien || 0), 0)

    return NextResponse.json({
      success: true,
      interventions,
      reclas_free: reclasFree,
      ftto_tickets: fttoTickets,
      total_interventions: totalInterventions,
      total_recla_free: totalReclaFree,
      total_ftto: totalFtto,
      total_genere: totalInterventions + totalReclaFree + totalFtto,
      nb_interventions: interventions.length,
      nb_reclas_free: reclasFree.length,
      nb_ftto: fttoTickets.length,
    })
  } catch (error) {
    console.error("Erreur GET detail-genere:", error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Erreur serveur", detail: msg }, { status: 500 })
  }
}
