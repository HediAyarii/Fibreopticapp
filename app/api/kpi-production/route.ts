import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateDebut = searchParams.get('date_debut') || '2025-01-01'
    const dateFin = searchParams.get('date_fin') || '2025-12-31'
    const grille = searchParams.get('grille') || 'tout' // axecom, ert, tout
    const typeIntervention = searchParams.get('type') || 'tout' // racc, sav, tout
    const perimetre = searchParams.get('perimetre') || 'tout' // b2b, b2c, tout
    const technologie = searchParams.get('technologie') || 'tout' // ftth, fttb, tout
    const groupBy = searchParams.get('group_by') || 'semaine' // semaine, mois

    // Construire les conditions de filtre
    let conditions = [`date_rdv IS NOT NULL`, `date_rdv != ''`, `date_rdv != 'nan'`, `date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'`]
    const params: any[] = [dateDebut, dateFin]

    // Filtre date
    conditions.push(`date_rdv::date >= $1::date AND date_rdv::date <= $2::date`)

    // Filtre grille
    if (grille === 'axecom') {
      conditions.push(`grille LIKE '%AXECOM%'`)
    } else if (grille === 'ert') {
      conditions.push(`grille NOT LIKE '%AXECOM%'`)
    }

    // Filtre type intervention
    if (typeIntervention === 'racc') {
      conditions.push(`type_intervention IN ('RACC', 'RECO', 'RECC')`)
    } else if (typeIntervention === 'sav') {
      conditions.push(`type_intervention = 'SAV'`)
    }

    // Filtre périmètre B2B/B2C
    if (perimetre === 'b2b') {
      conditions.push(`grille LIKE 'B2B%'`)
    } else if (perimetre === 'b2c') {
      conditions.push(`grille NOT LIKE 'B2B%'`)
    }

    // Filtre technologie FTTH/FTTB
    if (technologie === 'ftth') {
      conditions.push(`activite = 'FTTH'`)
    } else if (technologie === 'fttb') {
      conditions.push(`activite = 'FTTB'`)
    }

    const whereClause = conditions.join(' AND ')

    // Groupement par semaine ou mois
    const groupExpression = groupBy === 'mois' 
      ? `TO_CHAR(date_rdv::date, 'YYYY-MM')` 
      : `TO_CHAR(date_rdv::date, 'IYYY') || '-S' || LPAD(TO_CHAR(date_rdv::date, 'IW'), 2, '0')`

    // Requête principale - Stats par période
    const statsParPeriode = await query(`
      SELECT 
        ${groupExpression} as periode,
        COUNT(*) as total,
        SUM(CASE WHEN statut = 'CLOTURE TERMINEE' THEN 1 ELSE 0 END) as succes,
        SUM(CASE WHEN statut LIKE 'ECHEC%' THEN 1 ELSE 0 END) as echec,
        SUM(CASE WHEN statut = 'ANNULEE' THEN 1 ELSE 0 END) as annule,
        SUM(CASE WHEN statut IN ('PLANIFIEE', 'EN COURS', 'PRISE EN COMPTE', 'ATTRIBUEE') THEN 1 ELSE 0 END) as en_cours,
        SUM(CASE WHEN statut IN ('A COMPLETER', 'A CLOTURER', 'ECHEC A CLOTURER', 'VALIDATION CELLULE MULTI SAV') THEN 1 ELSE 0 END) as a_traiter,
        ROUND(SUM(CASE WHEN statut = 'CLOTURE TERMINEE' THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0)::numeric * 100, 1) as taux_reussite
      FROM interventions
      WHERE ${whereClause}
      GROUP BY ${groupExpression}
      ORDER BY periode
    `, params)

    // Stats par parcours (Conquête vs Migration) pour les courbes
    const statsParParcours = await query(`
      SELECT 
        ${groupExpression} as periode,
        CASE 
          WHEN parcours_type = 'Conquête' THEN 'Conquete'
          WHEN parcours_type = 'Migration' THEN 'Migration'
          WHEN parcours_type = 'Déménagement' THEN 'Demenagement'
          ELSE 'Autre'
        END as parcours,
        COUNT(*) as total,
        SUM(CASE WHEN statut = 'CLOTURE TERMINEE' THEN 1 ELSE 0 END) as succes,
        ROUND(SUM(CASE WHEN statut = 'CLOTURE TERMINEE' THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0)::numeric * 100, 1) as taux_reussite
      FROM interventions
      WHERE ${whereClause}
      GROUP BY ${groupExpression}, CASE 
          WHEN parcours_type = 'Conquête' THEN 'Conquete'
          WHEN parcours_type = 'Migration' THEN 'Migration'
          WHEN parcours_type = 'Déménagement' THEN 'Demenagement'
          ELSE 'Autre'
        END
      ORDER BY periode
    `, params)

    // Totaux globaux
    const totaux = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN statut = 'CLOTURE TERMINEE' THEN 1 ELSE 0 END) as succes,
        SUM(CASE WHEN statut LIKE 'ECHEC%' THEN 1 ELSE 0 END) as echec,
        SUM(CASE WHEN statut = 'ANNULEE' THEN 1 ELSE 0 END) as annule,
        SUM(CASE WHEN statut IN ('PLANIFIEE', 'EN COURS', 'PRISE EN COMPTE', 'ATTRIBUEE') THEN 1 ELSE 0 END) as en_cours,
        ROUND(SUM(CASE WHEN statut = 'CLOTURE TERMINEE' THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0)::numeric * 100, 1) as taux_reussite_global
      FROM interventions
      WHERE ${whereClause}
    `, params)

    // Transformer les données pour les graphiques
    const periodes = [...new Set(statsParPeriode.rows.map((r: any) => r.periode))]
    
    // Données pour le graphique linéaire (taux par parcours)
    const tauxParParcours: any = {}
    statsParParcours.rows.forEach((row: any) => {
      if (!tauxParParcours[row.periode]) {
        tauxParParcours[row.periode] = { periode: row.periode }
      }
      tauxParParcours[row.periode][row.parcours] = parseFloat(row.taux_reussite) || 0
      tauxParParcours[row.periode][`${row.parcours}_total`] = parseInt(row.total)
      tauxParParcours[row.periode][`${row.parcours}_succes`] = parseInt(row.succes)
    })

    // Fusionner avec les stats globales par période
    const chartData = statsParPeriode.rows.map((row: any) => ({
      periode: row.periode,
      total: parseInt(row.total),
      succes: parseInt(row.succes),
      echec: parseInt(row.echec),
      annule: parseInt(row.annule),
      en_cours: parseInt(row.en_cours),
      a_traiter: parseInt(row.a_traiter),
      taux_reussite: parseFloat(row.taux_reussite) || 0,
      taux_conquete: tauxParParcours[row.periode]?.Conquete || 0,
      taux_migration: tauxParParcours[row.periode]?.Migration || 0,
      conquete_total: tauxParParcours[row.periode]?.Conquete_total || 0,
      migration_total: tauxParParcours[row.periode]?.Migration_total || 0
    }))

    return NextResponse.json({
      success: true,
      data: chartData,
      totaux: totaux.rows[0],
      filtres: {
        date_debut: dateDebut,
        date_fin: dateFin,
        grille,
        type: typeIntervention,
        perimetre,
        group_by: groupBy
      }
    })

  } catch (error) {
    console.error("Erreur API kpi-production:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Erreur serveur" 
    }, { status: 500 })
  }
}
