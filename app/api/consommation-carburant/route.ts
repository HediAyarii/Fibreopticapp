import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET() {
  try {
    // Récupérer la consommation carburant par employé
    const result = await query(`
      SELECT 
        e.id as employe_id,
        e.nom,
        e.prenom,
        e.email,
        e.telephone,
        COUNT(c.id) as nombre_transactions,
        SUM(CAST(REPLACE(c.ca_ttc, ',', '.') AS DECIMAL(10,2))) as consommation_totale_ttc,
        AVG(CAST(REPLACE(c.ca_ttc, ',', '.') AS DECIMAL(10,2))) as consommation_moyenne_ttc,
        MIN(c.date_livraison) as premiere_consommation,
        MAX(c.date_livraison) as derniere_consommation,
        STRING_AGG(DISTINCT c.numero_carte, ', ') as cartes_utilisees
      FROM employes e
      LEFT JOIN carburant_consommation c ON e.id = c.employe_assigné
      WHERE c.employe_assigné IS NOT NULL
      GROUP BY e.id, e.nom, e.prenom, e.email, e.telephone
      ORDER BY consommation_totale_ttc DESC
    `)
    
    // Convertir les valeurs numériques en nombres
    const consommationParEmploye = result.rows.map(row => ({
      ...row,
      nombre_transactions: row.nombre_transactions ? Number(row.nombre_transactions) : 0,
      consommation_totale_ttc: row.consommation_totale_ttc ? Number(row.consommation_totale_ttc) : 0,
      consommation_moyenne_ttc: row.consommation_moyenne_ttc ? Number(row.consommation_moyenne_ttc) : 0
    }))
    
    return NextResponse.json({ consommationParEmploye })
  } catch (error) {
    console.error("Erreur API consommation carburant GET:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { employe_id, date_debut, date_fin } = await request.json()
    
    if (!employe_id) {
      return NextResponse.json({ error: "ID employé requis" }, { status: 400 })
    }
    
    let query_sql = `
      SELECT 
        c.*,
        e.nom,
        e.prenom
      FROM carburant_consommation c
      LEFT JOIN employes e ON c.employe_assigné = e.id
      WHERE c.employe_assigné = $1
    `
    
    const params = [employe_id]
    
    if (date_debut) {
      query_sql += ` AND c.date_livraison >= $${params.length + 1}`
      params.push(date_debut)
    }
    
    if (date_fin) {
      query_sql += ` AND c.date_livraison <= $${params.length + 1}`
      params.push(date_fin)
    }
    
    query_sql += ` ORDER BY c.date_livraison DESC`
    
    const result = await query(query_sql, params)
    
    // Convertir les valeurs numériques
    const transactions = result.rows.map(row => ({
      ...row,
      ca_ttc: row.ca_ttc ? Number(row.ca_ttc.replace(',', '.')) : 0,
      ca_ht: row.ca_ht ? Number(row.ca_ht.replace(',', '.')) : 0,
      tva: row.tva ? Number(row.tva.replace(',', '.')) : 0
    }))
    
    return NextResponse.json({ transactions })
  } catch (error) {
    console.error("Erreur API consommation carburant POST:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
