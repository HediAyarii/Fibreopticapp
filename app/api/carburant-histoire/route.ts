import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeId = searchParams.get('employe_id')
    
    console.log('✅ Connexion PostgreSQL établie avec succès')
    
    let query = `
      SELECT 
        ca.id as assignation_id,
        ca.numero_carte,
        ca.employe_id,
        ca.employe_nom,
        ca.date_assignation,
        ca.date_fin,
        ca.statut as assignation_statut,
        e.nom as employe_nom_complet,
        e.prenom as employe_prenom_complet,
        e.matricule,
        c.montant as carte_montant,
        c.date_livraison as carte_date_livraison,
        c.statut as carte_statut,
        COALESCE(consommation.total_consomme, 0) as total_consomme,
        COALESCE(consommation.nombre_transactions, 0) as nombre_transactions
      FROM carburant_assignations ca
      LEFT JOIN employes e ON ca.employe_id = e.id
      LEFT JOIN carburant c ON ca.numero_carte = c.numero_carte
      LEFT JOIN (
        SELECT 
          numero_carte,
          SUM(montant) as total_consomme,
          COUNT(*) as nombre_transactions
        FROM consommation_carburant 
        GROUP BY numero_carte
      ) consommation ON ca.numero_carte = consommation.numero_carte
    `
    
    const params = []
    
    if (employeId) {
      query += ` WHERE ca.employe_id = $1`
      params.push(employeId)
    }
    
    query += ` ORDER BY ca.date_assignation DESC, ca.created_at DESC`
    
    const startTime = Date.now()
    const pool = getPool()
    const result = await pool.query(query, params)
    const duration = Date.now() - startTime
    
    console.log(`📊 Query executed in ${duration}ms: ${query.substring(0, 100)}...`)
    
    // Calculer la consommation totale par employé
    const employeConsumption = {}
    result.rows.forEach(row => {
      if (!employeConsumption[row.employe_id]) {
        employeConsumption[row.employe_id] = {
          employe_id: row.employe_id,
          employe_nom: row.employe_nom_complet,
          employe_prenom: row.employe_prenom_complet,
          matricule: row.matricule,
          total_consomme_toutes_cartes: 0,
          nombre_cartes_utilisees: 0,
          historique_cartes: []
        }
      }
      
      employeConsumption[row.employe_id].total_consomme_toutes_cartes += parseFloat(row.total_consomme || 0)
      employeConsumption[row.employe_id].nombre_cartes_utilisees += 1
      employeConsumption[row.employe_id].historique_cartes.push({
        numero_carte: row.numero_carte,
        date_assignation: row.date_assignation,
        date_fin: row.date_fin,
        statut: row.assignation_statut,
        consommation_carte: parseFloat(row.total_consomme || 0),
        nombre_transactions: row.nombre_transactions
      })
    })
    
    return NextResponse.json({
      assignations: result.rows,
      consommation_par_employe: Object.values(employeConsumption)
    })
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de l\'historique:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'historique' },
      { status: 500 }
    )
  }
}
