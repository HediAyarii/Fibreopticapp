import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { AssignationErreur, verifierDate } from '@/lib/carburant-assignations'

export const dynamic = 'force-dynamic'

// Toutes les cartes connues (transactions + assignations) avec leurs titulaires
// sur la période [date_debut, date_fin[ (date_fin absente = sans fin).
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const aujourdhui = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' })
    const dateDebut = verifierDate(searchParams.get('date_debut') || aujourdhui, 'Date de début')
    const dateFinParam = searchParams.get('date_fin')
    const dateFin = dateFinParam ? verifierDate(dateFinParam, 'Date de fin') : null

    const result = await query(`
      WITH cartes AS (
        SELECT DISTINCT btrim(numero_carte) AS carte FROM carburant_consommation
        WHERE numero_carte IS NOT NULL AND btrim(numero_carte) NOT IN ('', 'nan')
        UNION
        SELECT DISTINCT carte_id FROM carburant_assignations
      )
      SELECT c.carte AS numero_carte,
             carburant_carte_peage(c.carte) AS peage,
             COALESCE(json_agg(json_build_object(
               'assignation_id', ca.id,
               'employe_id', ca.employe_id,
               'employe_nom', e.prenom || ' ' || e.nom,
               'date_debut', to_char(ca.date_assignation, 'YYYY-MM-DD'),
               'date_fin', to_char(ca.date_fin, 'YYYY-MM-DD')
             ) ORDER BY ca.date_assignation) FILTER (WHERE ca.id IS NOT NULL), '[]') AS titulaires
      FROM cartes c
      LEFT JOIN carburant_assignations ca
        ON ca.carte_id = c.carte
       AND ca.statut <> 'annulee'
       AND ca.date_assignation < COALESCE($2::timestamp, 'infinity')
       AND COALESCE(ca.date_fin, 'infinity') > $1::timestamp
      LEFT JOIN employes e ON e.id = ca.employe_id
      GROUP BY c.carte
    `, [dateDebut, dateFin])

    const cartes = result.rows.sort((a: any, b: any) =>
      String(a.numero_carte).localeCompare(String(b.numero_carte), undefined, { numeric: true })
    )

    return NextResponse.json({ success: true, date_debut: dateDebut, date_fin: dateFin, cartes })
  } catch (error) {
    if (error instanceof AssignationErreur) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Erreur lors de la récupération des cartes carburant:', error)
    return NextResponse.json({ error: 'Erreur lors de la récupération des cartes' }, { status: 500 })
  }
}
