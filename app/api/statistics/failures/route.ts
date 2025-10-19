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
      // Statistiques générales des échecs
      const failureStats = await query(`
        SELECT 
          statut,
          COUNT(*) as count,
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
          COUNT(CASE WHEN statut = 'ECHEC TERMINER' THEN 1 END) as echec_terminer,
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
          ${technicienFilter}
        GROUP BY echec_niveau_1, echec_niveau_2
        ORDER BY count DESC
      `, queryParams)

      // Évolution temporelle des échecs
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
          COUNT(*) as total_failures,
          COUNT(CASE WHEN statut = 'ECHEC TERMINER' THEN 1 END) as echec_terminer,
          COUNT(CASE WHEN motif_echec IS NOT NULL AND motif_echec != '' THEN 1 END) as with_reason
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
          ${technicienFilter}
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
        total_failures: parseInt(row.total_failures) || 0,
        echec_terminer: parseInt(row.echec_terminer) || 0,
        with_reason: parseInt(row.with_reason) || 0
      }))

      stats.failures = {
        byStatus: processedFailureStats,
        byReason: processedFailureReasons,
        byTechnician: processedFailuresByTechnician,
        motifsByTechnician: processedMotifsByTechnician,
        byLevel: processedFailuresByLevel,
        temporalEvolution: processedTemporalEvolution,
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
        total: 0
      }
    }

    const response = NextResponse.json({
      success: true,
      statistics: stats,
      period: {
        startDate,
        endDate,
        technicien
      }
    })
    
    return addNoCacheHeaders(response)

  } catch (error) {
    console.error('Erreur récupération statistiques d\'échec:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
