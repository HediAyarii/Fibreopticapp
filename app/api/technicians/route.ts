import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const grille = searchParams.get('grille')
    const dateStart = searchParams.get('dateStart')
    const dateEnd = searchParams.get('dateEnd')

    // Construire les filtres optionnels
    const whereClauses: string[] = []
    const params: any[] = []
    let paramIndex = 1

    // Filtre par grille
    if (grille && grille !== 'all') {
      if (grille === 'AXECOM MANCHE' || grille === 'axecom') {
        whereClauses.push(`grille ILIKE '%AXECOM MANCHE%'`)
      } else if (grille === 'ERT' || grille === 'ert') {
        whereClauses.push(`(grille NOT ILIKE '%AXECOM MANCHE%' AND grille IS NOT NULL AND grille != '')`)
      }
    }

    // Filtre par période (optionnel)
    // date_rdv est en TEXTE avec formats mixtes (YYYY-MM-DD et DD/MM/YYYY) -> parsing explicite
    // (une comparaison de texte brute exclurait à tort les dates au format DD/MM/YYYY)
    if (dateStart) {
      whereClauses.push(`date_rdv IS NOT NULL AND date_rdv != '' AND date_rdv != 'nan' AND (
        (date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' AND date_rdv::date >= $${paramIndex}::date)
        OR (date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' AND TO_DATE(SUBSTRING(date_rdv FROM 1 FOR 10), 'DD/MM/YYYY') >= $${paramIndex}::date)
      )`)
      params.push(dateStart)
      paramIndex++
    }
    if (dateEnd) {
      whereClauses.push(`date_rdv IS NOT NULL AND date_rdv != '' AND date_rdv != 'nan' AND (
        (date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' AND date_rdv::date <= $${paramIndex}::date)
        OR (date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' AND TO_DATE(SUBSTRING(date_rdv FROM 1 FOR 10), 'DD/MM/YYYY') <= $${paramIndex}::date)
      )`)
      params.push(dateEnd)
      paramIndex++
    }

    // Exclure les techniciens vides
    whereClauses.push(`nom_technicien IS NOT NULL AND nom_technicien != '' AND nom_technicien != 'nan'`)

    const whereClause = whereClauses.length > 0 ? ' WHERE ' + whereClauses.join(' AND ') : ''

    // Récupérer tous les techniciens uniques
    const result = await query(`
      SELECT DISTINCT 
        nom_technicien,
        prenom_technicien,
        CONCAT(prenom_technicien, ' ', nom_technicien) as nom_complet,
        grille,
        COUNT(*) as nombre_interventions
      FROM interventions
      ${whereClause}
      GROUP BY nom_technicien, prenom_technicien, grille
      ORDER BY nom_technicien, prenom_technicien
    `, params)

    // Formatter les résultats
    const technicians = result.rows.map(row => ({
      nom: row.nom_technicien,
      prenom: row.prenom_technicien,
      nomComplet: row.nom_complet?.trim() || `${row.prenom_technicien} ${row.nom_technicien}`.trim(),
      grille: row.grille,
      nombreInterventions: parseInt(row.nombre_interventions)
    }))

    // Créer une liste unique de techniciens (sans doublon par grille)
    const uniqueTechnicians = Array.from(
      new Map(technicians.map(t => [t.nomComplet, t])).values()
    ).sort((a, b) => a.nomComplet.localeCompare(b.nomComplet))

    return NextResponse.json({
      technicians: uniqueTechnicians,
      total: uniqueTechnicians.length,
      // Aussi retourner la liste avec détails par grille
      details: technicians
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des techniciens:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des techniciens' },
      { status: 500 }
    )
  }
}
