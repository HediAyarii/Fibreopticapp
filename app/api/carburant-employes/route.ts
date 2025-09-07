import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeId = searchParams.get('employe_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    
    console.log('✅ Connexion PostgreSQL établie avec succès')
    
    let whereClause = 'WHERE c.employe_assigné IS NOT NULL'
    const params = []
    let paramIndex = 1
    
    if (employeId) {
      whereClause += ` AND c.employe_assigné = $${paramIndex}`
      params.push(employeId)
      paramIndex++
    }
    
    if (startDate && endDate) {
      whereClause += ` AND TO_DATE(c.date_livraison, 'DD.MM.YYYY') BETWEEN TO_DATE($${paramIndex}, 'DD.MM.YYYY') AND TO_DATE($${paramIndex + 1}, 'DD.MM.YYYY')`
      params.push(startDate, endDate)
      paramIndex += 2
    }
    
    const query = `
      SELECT 
        e.id as employe_id,
        e.nom as employe_nom,
        e.prenom as employe_prenom,
        e.matricule as employe_matricule,
        e.telephone as employe_telephone,
        e.email as employe_email,
        COUNT(DISTINCT c.numero_carte) as nombre_cartes_utilisees,
        COUNT(c.id) as nombre_transactions,
        SUM(CAST(COALESCE(c.ca_ttc, '0') AS DECIMAL)) as consommation_totale_ttc,
        AVG(CAST(COALESCE(c.ca_ttc, '0') AS DECIMAL)) as consommation_moyenne_ttc,
        MIN(c.date_livraison) as premiere_transaction,
        MAX(c.date_livraison) as derniere_transaction,
        STRING_AGG(DISTINCT c.numero_carte, ', ') as cartes_utilisees,
        STRING_AGG(DISTINCT c.immat_vehicule, ', ') as vehicules_utilises,
        STRING_AGG(DISTINCT c.numero_station, ', ') as stations_utilisees
      FROM carburant_consommation c
      LEFT JOIN employes e ON c.employe_assigné = e.id
      ${whereClause}
      GROUP BY 
        e.id, e.nom, e.prenom, e.matricule, e.telephone, e.email
      HAVING e.id IS NOT NULL
      ORDER BY 
        consommation_totale_ttc DESC
    `
    
    const startTime = Date.now()
    const pool = getPool()
    const result = await pool.query(query, params)
    const duration = Date.now() - startTime
    
    console.log(`📊 Query executed in ${duration}ms: ${query.substring(0, 100)}...`)
    
    // Transformer les données pour l'affichage
    const employeesConsumption = result.rows.map((row: any) => ({
      employe_id: row.employe_id,
      employe_nom: row.employe_nom,
      employe_prenom: row.employe_prenom,
      employe_matricule: row.employe_matricule,
      employe_telephone: row.employe_telephone,
      employe_email: row.employe_email,
      nombre_cartes_utilisees: parseInt(row.nombre_cartes_utilisees),
      nombre_transactions: parseInt(row.nombre_transactions),
      consommation_totale_ttc: parseFloat(row.consommation_totale_ttc || 0),
      consommation_moyenne_ttc: parseFloat(row.consommation_moyenne_ttc || 0),
      premiere_transaction: row.premiere_transaction,
      derniere_transaction: row.derniere_transaction,
      cartes_utilisees: row.cartes_utilisees ? row.cartes_utilisees.split(', ') : [],
      vehicules_utilises: row.vehicules_utilises ? row.vehicules_utilises.split(', ') : [],
      stations_utilisees: row.stations_utilisees ? row.stations_utilisees.split(', ') : []
    }))
    
    // Calculer les totaux globaux
    const totalConsumption = employeesConsumption.reduce((sum: number, emp: any) => 
      sum + emp.consommation_totale_ttc, 0
    )
    
    const totalTransactions = employeesConsumption.reduce((sum: number, emp: any) => 
      sum + emp.nombre_transactions, 0
    )
    
    return NextResponse.json({
      employees_consumption: employeesConsumption,
      summary: {
        total_consommation_ttc: totalConsumption,
        total_transactions: totalTransactions,
        nombre_employes: employeesConsumption.length,
        consommation_moyenne_par_employe: employeesConsumption.length > 0 ? totalConsumption / employeesConsumption.length : 0
      },
      filters: {
        employe_id: employeId,
        start_date: startDate,
        end_date: endDate
      }
    })
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la consommation par employé:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la consommation par employé' },
      { status: 500 }
    )
  }
}
