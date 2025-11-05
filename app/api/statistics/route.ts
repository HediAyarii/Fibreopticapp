import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { addNoCacheHeaders } from '@/lib/cache-headers'

export const dynamic = 'force-dynamic'

// GET - Récupérer les statistiques selon la période
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const type = searchParams.get('type') || 'all'

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Dates de début et fin requises' }, { status: 400 })
    }

    // Convertir les dates au format PostgreSQL et valider
    let startDateFormatted, endDateFormatted
    
    try {
      const startDateObj = new Date(startDate)
      const endDateObj = new Date(endDate)
      
      // Vérifier que les dates sont valides
      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        return NextResponse.json({ error: 'Format de date invalide' }, { status: 400 })
      }
      
      startDateFormatted = startDateObj.toISOString().split('T')[0]
      endDateFormatted = endDateObj.toISOString().split('T')[0]
    } catch (error) {
      return NextResponse.json({ error: 'Erreur de format de date' }, { status: 400 })
    }

    const stats: any = {}

    // Statistiques des interventions
    if (type === 'all' || type === 'interventions') {
      try {
        // Requête avec filtrage par date_rdv (date de rendez-vous)
        const interventionsStats = await query(`
          SELECT 
            statut,
            COUNT(*) as count,
            ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
          FROM interventions 
          WHERE statut IS NOT NULL 
            AND statut != ''
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

        const totalInterventions = await query(`
          SELECT COUNT(*) as total FROM interventions 
          WHERE statut IS NOT NULL 
            AND statut != ''
            AND date_rdv IS NOT NULL 
            AND date_rdv != ''
            AND (
              (date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' AND TO_DATE(date_rdv, 'DD.MM.YYYY') >= $1::date AND TO_DATE(date_rdv, 'DD.MM.YYYY') <= $2::date)
              OR (date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND date_rdv::date >= $1::date AND date_rdv::date <= $2::date)
              OR (date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' AND TO_DATE(date_rdv, 'DD/MM/YYYY') >= $1::date AND TO_DATE(date_rdv, 'DD/MM/YYYY') <= $2::date)
            )
        `, [startDateFormatted, endDateFormatted])

        // Convertir les chaînes en nombres pour Recharts
        const processedData = interventionsStats.rows.map((row: any) => ({
          ...row,
          count: parseInt(row.count) || 0,
          percentage: parseFloat(row.percentage) || 0
        }))

        stats.interventions = {
          byStatus: processedData,
          total: parseInt(totalInterventions.rows[0]?.total || '0')
        }
      } catch (error) {
        console.log('⚠️ Table interventions non disponible:', error)
        stats.interventions = {
          byStatus: [],
          total: 0
        }
      }
    }

    // Statistiques du carburant
    if (type === 'all' || type === 'fuel') {
      try {
        const fuelStats = await query(`
          SELECT 
            DATE_TRUNC('month', created_at) as month,
            SUM(CAST(quantite AS DECIMAL)) as total_liters,
            SUM(CAST(ca_ttc AS DECIMAL)) as total_cost,
            COUNT(*) as consumption_count
          FROM carburant_consommation 
          WHERE created_at >= $1::date 
            AND created_at <= $2::date
          GROUP BY DATE_TRUNC('month', created_at)
          ORDER BY month
        `, [startDateFormatted, endDateFormatted])

        const fuelByEmployee = await query(`
          SELECT 
            e.nom,
            e.prenom,
            SUM(CAST(cc.quantite AS DECIMAL)) as total_liters,
            SUM(CAST(cc.ca_ttc AS DECIMAL)) as total_cost
          FROM carburant_consommation cc
          JOIN employes e ON cc.employe_assigné = e.id
          WHERE cc.created_at >= $1::date 
            AND cc.created_at <= $2::date
          GROUP BY e.id, e.nom, e.prenom
          ORDER BY total_cost DESC
          LIMIT 10
        `, [startDateFormatted, endDateFormatted])

        stats.fuel = {
          monthly: fuelStats.rows,
          byEmployee: fuelByEmployee.rows
        }
      } catch (error) {
        console.log('⚠️ Table carburant_consommation non disponible:', error)
        stats.fuel = {
          monthly: [],
          byEmployee: []
        }
      }
    }

    // Statistiques des pénalités
    if (type === 'all' || type === 'penalties') {
      try {
        const penaltiesStats = await query(`
          SELECT 
            CASE 
              WHEN j_plus_1 = TRUE THEN 'J+1 (60€)'
              WHEN j_plus_n = TRUE THEN 'J+N (140€)'
              ELSE type_penalite
            END as statut,
            COUNT(*) as count,
            SUM(montant) as total_amount,
            ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
          FROM penalites 
          WHERE date_attribution >= $1::date AND date_attribution < ($2::date + INTERVAL '1 day')
          GROUP BY 
            CASE 
              WHEN j_plus_1 = TRUE THEN 'J+1 (60€)'
              WHEN j_plus_n = TRUE THEN 'J+N (140€)'
              ELSE type_penalite
            END
          ORDER BY count DESC
        `, [startDateFormatted, endDateFormatted])

        // Convertir les chaînes en nombres pour Recharts
        const processedPenaltiesStats = penaltiesStats.rows.map((row: any) => ({
          ...row,
          count: parseInt(row.count) || 0,
          total_amount: parseFloat(row.total_amount) || 0,
          percentage: parseFloat(row.percentage) || 0
        }))

        const penaltiesByEmployee = await query(`
          SELECT 
            e.nom,
            e.prenom,
            COUNT(p.id) as penalty_count,
            SUM(p.montant) as total_amount,
            SUM(CASE WHEN p.j_plus_1 = TRUE THEN 1 ELSE 0 END) as j_plus_1_count,
            SUM(CASE WHEN p.j_plus_n = TRUE THEN 1 ELSE 0 END) as j_plus_n_count
          FROM penalites p
          JOIN employes e ON p.employe_id = e.id
          WHERE p.date_attribution >= $1::date AND p.date_attribution < ($2::date + INTERVAL '1 day')
          GROUP BY e.id, e.nom, e.prenom
          ORDER BY total_amount DESC
          LIMIT 10
        `, [startDateFormatted, endDateFormatted])

        // Convertir les chaînes en nombres pour l'affichage
        const processedPenaltiesByEmployee = penaltiesByEmployee.rows.map((row: any) => ({
          ...row,
          penalty_count: parseInt(row.penalty_count) || 0,
          total_amount: parseFloat(row.total_amount) || 0,
          j_plus_1_count: parseInt(row.j_plus_1_count) || 0,
          j_plus_n_count: parseInt(row.j_plus_n_count) || 0
        }))

        stats.penalties = {
          byStatus: processedPenaltiesStats,
          byEmployee: processedPenaltiesByEmployee
        }
      } catch (error) {
        console.log('⚠️ Table penalites non disponible:', error)
        stats.penalties = {
          byStatus: [],
          byEmployee: []
        }
      }
    }

    // Statistiques des réclamations
    if (type === 'all' || type === 'claims') {
      try {
        const claimsStats = await query(`
          SELECT 
            statut,
            COUNT(*) as count,
            ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
          FROM reclamations 
          WHERE created_at >= $1 AND created_at <= $2
          GROUP BY statut
          ORDER BY count DESC
        `, [startDateFormatted, endDateFormatted])

        const claimsByType = await query(`
          SELECT 
            type_reclamation,
            COUNT(*) as count,
            ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
          FROM reclamations 
          WHERE created_at >= $1 AND created_at <= $2
          GROUP BY type_reclamation
          ORDER BY count DESC
        `, [startDateFormatted, endDateFormatted])

        const claimsByPriority = await query(`
          SELECT 
            priorite,
            COUNT(*) as count,
            ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
          FROM reclamations 
          WHERE created_at >= $1 AND created_at <= $2
          GROUP BY priorite
          ORDER BY count DESC
        `, [startDateFormatted, endDateFormatted])

        stats.claims = {
          byStatus: claimsStats.rows,
          byType: claimsByType.rows,
          byPriority: claimsByPriority.rows
        }
      } catch (error) {
        console.log('⚠️ Table reclamations non disponible:', error)
        stats.claims = {
          byStatus: [],
          byType: [],
          byPriority: []
        }
      }
    }

    // Statistiques des revenus
    if (type === 'all' || type === 'revenue') {
      try {
        const revenueStats = await query(`
          SELECT 
            DATE_TRUNC('month', 
              CASE 
                WHEN date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' THEN TO_DATE(date_rdv, 'DD.MM.YYYY')
                WHEN date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN date_rdv::date
                WHEN date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' THEN TO_DATE(date_rdv, 'DD/MM/YYYY')
                ELSE NULL
              END
            ) as month,
            COUNT(*) as intervention_count,
            SUM(CASE WHEN statut = 'CLOTURE TERMINEE' THEN 1 ELSE 0 END) as completed_count,
            ROUND(SUM(CASE WHEN statut = 'CLOTURE TERMINEE' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as completion_rate
          FROM interventions 
          WHERE date_rdv IS NOT NULL 
            AND date_rdv != ''
            AND (
              (date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' AND TO_DATE(date_rdv, 'DD.MM.YYYY') >= $1::date AND TO_DATE(date_rdv, 'DD.MM.YYYY') <= $2::date)
              OR (date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND date_rdv::date >= $1::date AND date_rdv::date <= $2::date)
              OR (date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' AND TO_DATE(date_rdv, 'DD/MM/YYYY') >= $1::date AND TO_DATE(date_rdv, 'DD/MM/YYYY') <= $2::date)
            )
          GROUP BY DATE_TRUNC('month', 
            CASE 
              WHEN date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' THEN TO_DATE(date_rdv, 'DD.MM.YYYY')
              WHEN date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN date_rdv::date
              WHEN date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' THEN TO_DATE(date_rdv, 'DD/MM/YYYY')
              ELSE NULL
            END
          )
          ORDER BY month
        `, [startDateFormatted, endDateFormatted])

        const revenueByType = await query(`
          SELECT 
            type_intervention,
            COUNT(*) as count,
            SUM(CASE WHEN statut = 'CLOTURE TERMINEE' THEN 1 ELSE 0 END) as completed,
            ROUND(SUM(CASE WHEN statut = 'CLOTURE TERMINEE' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as completion_rate
          FROM interventions 
          WHERE date_rdv IS NOT NULL 
            AND date_rdv != ''
            AND (
              (date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' AND TO_DATE(date_rdv, 'DD.MM.YYYY') >= $1::date AND TO_DATE(date_rdv, 'DD.MM.YYYY') <= $2::date)
              OR (date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND date_rdv::date >= $1::date AND date_rdv::date <= $2::date)
              OR (date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' AND TO_DATE(date_rdv, 'DD/MM/YYYY') >= $1::date AND TO_DATE(date_rdv, 'DD/MM/YYYY') <= $2::date)
            )
          GROUP BY type_intervention
          ORDER BY count DESC
        `, [startDateFormatted, endDateFormatted])

        stats.revenue = {
          monthly: revenueStats.rows,
          byType: revenueByType.rows
        }
      } catch (error) {
        console.log('⚠️ Table interventions non disponible pour les revenus:', error)
        stats.revenue = {
          monthly: [],
          byType: []
        }
      }
    }

    const response = NextResponse.json({
      success: true,
      statistics: stats,
      period: {
        startDate,
        endDate
      }
    })
    
    return addNoCacheHeaders(response)

  } catch (error) {
    console.error('Erreur récupération statistiques:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
