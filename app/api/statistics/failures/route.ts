import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { addNoCacheHeaders } from '@/lib/cache-headers'

export const dynamic = 'force-dynamic'

// GET - Récupérer les statistiques des interventions échouées
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const technicien = searchParams.get('technicien') || 'all'
    const entreprise = searchParams.get('entreprise') || 'all'
    const type = searchParams.get('type') || 'all'

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Dates de début et fin requises' }, { status: 400 })
    }

    // Convertir les dates au format PostgreSQL et valider
    let startDateFormatted, endDateFormatted
    
    try {
      const startDateObj = new Date(startDate)
      const endDateObj = new Date(endDate)
      
      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        return NextResponse.json({ error: 'Format de date invalide' }, { status: 400 })
      }
      
      startDateFormatted = startDateObj.toISOString().split('T')[0]
      endDateFormatted = endDateObj.toISOString().split('T')[0]
    } catch (error) {
      return NextResponse.json({ error: 'Erreur de format de date' }, { status: 400 })
    }

    const stats: any = {}

    try {
      // Construction des conditions de filtrage
      let enterpriseFilter = ''
      let typeFilter = ''
      
      if (entreprise !== 'all') {
        if (entreprise === 'AXECOM') {
          enterpriseFilter = `AND (grille ILIKE '%AXECOM MANCHE%' OR grille ILIKE '%B2B : AXECOM MANCHE%')`
        } else if (entreprise === 'ERT') {
          enterpriseFilter = `AND (grille IS NULL OR (grille NOT ILIKE '%AXECOM MANCHE%' AND grille NOT ILIKE '%B2B : AXECOM MANCHE%'))`
        }
      }
      
      if (type !== 'all') {
        typeFilter = `AND type_intervention = '${type}'`
      }

      // Statistiques générales des échecs ET clôtures terminées
      const failureStats = await query(`
        SELECT 
          statut,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
        FROM interventions 
        WHERE statut IS NOT NULL 
          AND statut != ''
          AND (statut ILIKE '%ECHEC%' OR statut = 'CLOTURE TERMINEE')
          AND date_rdv IS NOT NULL 
          AND date_rdv != ''
          AND (
            (date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' AND TO_DATE(date_rdv, 'DD.MM.YYYY') >= $1::date AND TO_DATE(date_rdv, 'DD.MM.YYYY') <= $2::date)
            OR (date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND date_rdv::date >= $1::date AND date_rdv::date <= $2::date)
            OR (date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' AND TO_DATE(date_rdv, 'DD/MM/YYYY') >= $1::date AND TO_DATE(date_rdv, 'DD/MM/YYYY') <= $2::date)
          )
          ${enterpriseFilter}
          ${typeFilter}
        GROUP BY statut
        ORDER BY count DESC
      `, [startDateFormatted, endDateFormatted])

      // Motifs d'échec les plus fréquents
      const failureReasons = await query(`
        SELECT 
          motif_echec,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
        FROM interventions 
        WHERE statut IS NOT NULL 
          AND statut != ''
          AND statut ILIKE '%ECHEC%'
          AND motif_echec IS NOT NULL 
          AND motif_echec != ''
          AND date_rdv IS NOT NULL 
          AND date_rdv != ''
          AND (
            (date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' AND TO_DATE(date_rdv, 'DD.MM.YYYY') >= $1::date AND TO_DATE(date_rdv, 'DD.MM.YYYY') <= $2::date)
            OR (date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND date_rdv::date >= $1::date AND date_rdv::date <= $2::date)
            OR (date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' AND TO_DATE(date_rdv, 'DD/MM/YYYY') >= $1::date AND TO_DATE(date_rdv, 'DD/MM/YYYY') <= $2::date)
          )
          ${enterpriseFilter}
          ${typeFilter}
        GROUP BY motif_echec
        ORDER BY count DESC
        LIMIT 10
      `, [startDateFormatted, endDateFormatted])

      // Statistiques par technicien
      let technicienFilter = ''
      let queryParams = [startDateFormatted, endDateFormatted]
      
      if (technicien !== 'all') {
        technicienFilter = `AND (nom_technicien ILIKE $3 OR prenom_technicien ILIKE $3 OR CONCAT(nom_technicien, ' ', prenom_technicien) ILIKE $3)`
        queryParams.push(`%${technicien}%`)
      }

      const failuresByTechnician = await query(`
        SELECT 
          nom_technicien,
          prenom_technicien,
          COUNT(*) as total_failures,
          COUNT(CASE WHEN statut = 'ECHEC TERMINE' THEN 1 END) as echec_terminer,
          COUNT(CASE WHEN motif_echec IS NOT NULL AND motif_echec != '' THEN 1 END) as with_reason,
          ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
        FROM interventions 
        WHERE statut IS NOT NULL 
          AND statut != ''
          AND statut ILIKE '%ECHEC%'
          AND date_rdv IS NOT NULL 
          AND date_rdv != ''
          AND (
            (date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' AND TO_DATE(date_rdv, 'DD.MM.YYYY') >= $1::date AND TO_DATE(date_rdv, 'DD.MM.YYYY') <= $2::date)
            OR (date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND date_rdv::date >= $1::date AND date_rdv::date <= $2::date)
            OR (date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' AND TO_DATE(date_rdv, 'DD/MM/YYYY') >= $1::date AND TO_DATE(date_rdv, 'DD/MM/YYYY') <= $2::date)
          )
          ${enterpriseFilter}
          ${typeFilter}
          ${technicienFilter}
        GROUP BY nom_technicien, prenom_technicien
        ORDER BY total_failures DESC
      `, queryParams)

      // Motifs détaillés par technicien (R1, R2, etc.)
      const motifsByTechnician = await query(`
        SELECT 
          nom_technicien,
          prenom_technicien,
          motif_echec,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY nom_technicien, prenom_technicien), 2) as percentage_technicien,
          ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage_total
        FROM interventions 
        WHERE statut IS NOT NULL 
          AND statut != ''
          AND statut ILIKE '%ECHEC%'
          AND motif_echec IS NOT NULL 
          AND motif_echec != ''
          AND date_rdv IS NOT NULL 
          AND date_rdv != ''
          AND (
            (date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' AND TO_DATE(date_rdv, 'DD.MM.YYYY') >= $1::date AND TO_DATE(date_rdv, 'DD.MM.YYYY') <= $2::date)
            OR (date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND date_rdv::date >= $1::date AND date_rdv::date <= $2::date)
            OR (date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' AND TO_DATE(date_rdv, 'DD/MM/YYYY') >= $1::date AND TO_DATE(date_rdv, 'DD/MM/YYYY') <= $2::date)
          )
          ${enterpriseFilter}
          ${typeFilter}
          ${technicienFilter}
        GROUP BY nom_technicien, prenom_technicien, motif_echec
        ORDER BY nom_technicien, prenom_technicien, count DESC
      `, queryParams)

      // Échecs par niveau
      const failuresByLevel = await query(`
        SELECT 
          echec_niveau_1,
          echec_niveau_2,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
        FROM interventions 
        WHERE statut IS NOT NULL 
          AND statut != ''
          AND statut ILIKE '%ECHEC%'
          AND (echec_niveau_1 IS NOT NULL AND echec_niveau_1 != '' OR echec_niveau_2 IS NOT NULL AND echec_niveau_2 != '')
          AND date_rdv IS NOT NULL 
          AND date_rdv != ''
          AND (
            (date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' AND TO_DATE(date_rdv, 'DD.MM.YYYY') >= $1::date AND TO_DATE(date_rdv, 'DD.MM.YYYY') <= $2::date)
            OR (date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND date_rdv::date >= $1::date AND date_rdv::date <= $2::date)
            OR (date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' AND TO_DATE(date_rdv, 'DD/MM/YYYY') >= $1::date AND TO_DATE(date_rdv, 'DD/MM/YYYY') <= $2::date)
          )
          ${enterpriseFilter}
          ${typeFilter}
          ${technicienFilter}
        GROUP BY echec_niveau_1, echec_niveau_2
        ORDER BY count DESC
      `, queryParams)

      // Évolution temporelle des succès (CLOTURE TERMINEE) par entreprise
      const temporalEvolution = await query(`
        SELECT 
          DATE_TRUNC('week', 
            CASE 
              WHEN date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' THEN TO_DATE(date_rdv, 'DD.MM.YYYY')
              WHEN date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN date_rdv::date
              WHEN date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' THEN TO_DATE(date_rdv, 'DD/MM/YYYY')
              ELSE NULL
            END
          ) as week,
          COUNT(CASE WHEN statut = 'CLOTURE TERMINEE' AND (grille ILIKE '%AXECOM MANCHE%' OR grille ILIKE '%B2B : AXECOM MANCHE%') THEN 1 END) as axecom_success,
          COUNT(CASE WHEN statut = 'CLOTURE TERMINEE' AND (grille IS NULL OR (grille NOT ILIKE '%AXECOM MANCHE%' AND grille NOT ILIKE '%B2B : AXECOM MANCHE%')) THEN 1 END) as ert_success,
          COUNT(CASE WHEN statut = 'CLOTURE TERMINEE' THEN 1 END) as total_success
        FROM interventions 
        WHERE statut IS NOT NULL 
          AND statut != ''
          AND statut = 'CLOTURE TERMINEE'
          AND date_rdv IS NOT NULL 
          AND date_rdv != ''
          AND (
            (date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' AND TO_DATE(date_rdv, 'DD.MM.YYYY') >= $1::date AND TO_DATE(date_rdv, 'DD.MM.YYYY') <= $2::date)
            OR (date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND date_rdv::date >= $1::date AND date_rdv::date <= $2::date)
            OR (date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' AND TO_DATE(date_rdv, 'DD/MM/YYYY') >= $1::date AND TO_DATE(date_rdv, 'DD/MM/YYYY') <= $2::date)
          )
          ${typeFilter}
          ${technicienFilter}
        GROUP BY DATE_TRUNC('week', 
          CASE 
            WHEN date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' THEN TO_DATE(date_rdv, 'DD.MM.YYYY')
            WHEN date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN date_rdv::date
            WHEN date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' THEN TO_DATE(date_rdv, 'DD/MM/YYYY')
            ELSE NULL
          END
        )
        ORDER BY week
      `, queryParams)

      // Total des échecs
      const totalFailures = await query(`
        SELECT COUNT(*) as total FROM interventions 
        WHERE statut IS NOT NULL 
          AND statut != ''
          AND statut ILIKE '%ECHEC%'
          AND date_rdv IS NOT NULL 
          AND date_rdv != ''
          AND (
            (date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' AND TO_DATE(date_rdv, 'DD.MM.YYYY') >= $1::date AND TO_DATE(date_rdv, 'DD.MM.YYYY') <= $2::date)
            OR (date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND date_rdv::date >= $1::date AND date_rdv::date <= $2::date)
            OR (date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' AND TO_DATE(date_rdv, 'DD/MM/YYYY') >= $1::date AND TO_DATE(date_rdv, 'DD/MM/YYYY') <= $2::date)
          )
          ${enterpriseFilter}
          ${typeFilter}
          ${technicienFilter}
      `, queryParams)

      // Statistiques par type de logement et entreprise (CLOTURE TERMINEE uniquement)
      const byHousingType = await query(`
        SELECT 
          CASE 
            WHEN grille ILIKE '%AXECOM MANCHE%' OR grille ILIKE '%B2B : AXECOM MANCHE%' THEN 'AXECOM'
            ELSE 'ERT'
          END as entreprise,
          CASE 
            WHEN type_logement ILIKE '%PAVILLON%' THEN 'Pavillon'
            WHEN type_logement ILIKE '%IMMEUBLE%' THEN 'Immeuble'
            ELSE 'Autre'
          END as type_logement,
          COUNT(*) as count
        FROM interventions 
        WHERE statut = 'CLOTURE TERMINEE'
          AND date_rdv IS NOT NULL 
          AND date_rdv != ''
          AND (
            (date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' AND TO_DATE(date_rdv, 'DD.MM.YYYY') >= $1::date AND TO_DATE(date_rdv, 'DD.MM.YYYY') <= $2::date)
            OR (date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND date_rdv::date >= $1::date AND date_rdv::date <= $2::date)
            OR (date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' AND TO_DATE(date_rdv, 'DD/MM/YYYY') >= $1::date AND TO_DATE(date_rdv, 'DD/MM/YYYY') <= $2::date)
          )
          ${typeFilter}
          ${technicienFilter}
        GROUP BY entreprise, type_logement
        ORDER BY entreprise, type_logement
      `, queryParams)

      // Convertir les chaînes en nombres pour les graphiques
      const processedFailureStats = failureStats.rows.map((row: any) => ({
        ...row,
        count: parseInt(row.count) || 0,
        percentage: parseFloat(row.percentage) || 0
      }))

      const processedFailureReasons = failureReasons.rows.map((row: any) => ({
        ...row,
        count: parseInt(row.count) || 0,
        percentage: parseFloat(row.percentage) || 0
      }))

      const processedFailuresByTechnician = failuresByTechnician.rows.map((row: any) => ({
        ...row,
        total_failures: parseInt(row.total_failures) || 0,
        echec_terminer: parseInt(row.echec_terminer) || 0,
        with_reason: parseInt(row.with_reason) || 0,
        percentage: parseFloat(row.percentage) || 0
      }))

      const processedMotifsByTechnician = motifsByTechnician.rows.map((row: any) => ({
        ...row,
        count: parseInt(row.count) || 0,
        percentage_technicien: parseFloat(row.percentage_technicien) || 0,
        percentage_total: parseFloat(row.percentage_total) || 0
      }))

      const processedFailuresByLevel = failuresByLevel.rows.map((row: any) => ({
        ...row,
        count: parseInt(row.count) || 0,
        percentage: parseFloat(row.percentage) || 0
      }))

      const processedTemporalEvolution = temporalEvolution.rows.map((row: any) => ({
        ...row,
        axecom_success: parseInt(row.axecom_success) || 0,
        ert_success: parseInt(row.ert_success) || 0,
        total_success: parseInt(row.total_success) || 0
      }))

      const processedByHousingType = byHousingType.rows.map((row: any) => ({
        ...row,
        count: parseInt(row.count) || 0
      }))

      stats.failures = {
        byStatus: processedFailureStats,
        byReason: processedFailureReasons,
        byTechnician: processedFailuresByTechnician,
        motifsByTechnician: processedMotifsByTechnician,
        byLevel: processedFailuresByLevel,
        temporalEvolution: processedTemporalEvolution,
        byHousingType: processedByHousingType,
        total: parseInt(totalFailures.rows[0]?.total || '0')
      }

    } catch (error) {
      console.log('⚠️ Erreur lors de la récupération des statistiques d\'échec:', error)
      stats.failures = {
        byStatus: [],
        byReason: [],
        byTechnician: [],
        motifsByTechnician: [],
        byLevel: [],
        temporalEvolution: [],
        byHousingType: [],
        total: 0
      }
    }

    const response = NextResponse.json({
      success: true,
      statistics: stats,
      period: {
        startDate,
        endDate,
        technicien,
        entreprise,
        type
      }
    })
    
    return addNoCacheHeaders(response)

  } catch (error) {
    console.error('Erreur récupération statistiques d\'échec:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
