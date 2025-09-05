import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month' // month, week, year
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    
    console.log('✅ Connexion PostgreSQL établie avec succès')
    
    // Construire la requête selon la période
    let dateGrouping = ''
    let dateFormat = ''
    
    switch (period) {
      case 'week':
        dateGrouping = 'DATE_TRUNC(\'week\', c.date_livraison)'
        dateFormat = 'TO_CHAR(DATE_TRUNC(\'week\', c.date_livraison), \'YYYY-"W"WW\')'
        break
      case 'year':
        dateGrouping = 'DATE_TRUNC(\'year\', c.date_livraison)'
        dateFormat = 'TO_CHAR(DATE_TRUNC(\'year\', c.date_livraison), \'YYYY\')'
        break
      default: // month
        dateGrouping = 'DATE_TRUNC(\'month\', c.date_livraison)'
        dateFormat = 'TO_CHAR(DATE_TRUNC(\'month\', c.date_livraison), \'YYYY-MM\')'
    }
    
    let whereClause = ''
    const params = []
    
    if (startDate && endDate) {
      whereClause = 'WHERE c.date_livraison BETWEEN $1 AND $2'
      params.push(startDate, endDate)
    }
    
    const query = `
      SELECT 
        ${dateFormat} as periode,
        e.id as employe_id,
        e.nom as employe_nom,
        e.prenom as employe_prenom,
        e.matricule as employe_matricule,
        COUNT(DISTINCT c.numero_carte) as nombre_cartes,
        COUNT(c.id) as nombre_transactions,
        SUM(CAST(COALESCE(c.ca_ttc, 0) AS DECIMAL)) as consommation_totale,
        AVG(CAST(COALESCE(c.ca_ttc, 0) AS DECIMAL)) as consommation_moyenne,
        MIN(c.date_livraison) as premiere_transaction,
        MAX(c.date_livraison) as derniere_transaction,
        ${dateGrouping} as periode_date
      FROM carburant_consommation c
      LEFT JOIN employes e ON c.employe_assigné = e.id
      ${whereClause}
      GROUP BY 
        ${dateGrouping},
        e.id, e.nom, e.prenom, e.matricule
      HAVING e.id IS NOT NULL
      ORDER BY 
        periode_date DESC,
        consommation_totale DESC
    `
    
    const startTime = Date.now()
    const pool = getPool()
    const result = await pool.query(query, params)
    const duration = Date.now() - startTime
    
    console.log(`📊 Query executed in ${duration}ms: ${query.substring(0, 100)}...`)
    
    // Grouper les résultats par période pour faciliter l'affichage
    const groupedData = result.rows.reduce((acc: any, row: any) => {
      if (!acc[row.periode]) {
        acc[row.periode] = {
          periode: row.periode,
          periode_date: row.periode_date,
          employes: []
        }
      }
      
      acc[row.periode].employes.push({
        employe_id: row.employe_id,
        employe_nom: row.employe_nom,
        employe_prenom: row.employe_prenom,
        employe_matricule: row.employe_matricule,
        nombre_cartes: parseInt(row.nombre_cartes),
        nombre_transactions: parseInt(row.nombre_transactions),
        consommation_totale: parseFloat(row.consommation_totale || 0),
        consommation_moyenne: parseFloat(row.consommation_moyenne || 0),
        premiere_transaction: row.premiere_transaction,
        derniere_transaction: row.derniere_transaction
      })
      
      return acc
    }, {})
    
    // Calculer les totaux globaux
    const totalConsumption = result.rows.reduce((sum: number, row: any) => 
      sum + parseFloat(row.consommation_totale || 0), 0
    )
    
    const totalTransactions = result.rows.reduce((sum: number, row: any) => 
      sum + parseInt(row.nombre_transactions), 0
    )
    
    return NextResponse.json({
      grouped_data: Object.values(groupedData),
      summary: {
        total_consommation: totalConsumption,
        total_transactions: totalTransactions,
        nombre_periodes: Object.keys(groupedData).length,
        nombre_employes: result.rows.length
      },
      period: period,
      filters: {
        start_date: startDate,
        end_date: endDate
      }
    })
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des données groupées:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données groupées' },
      { status: 500 }
    )
  }
}
