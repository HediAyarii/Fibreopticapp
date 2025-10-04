import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const employeId = searchParams.get('employeId')

    // Construire la requête avec filtres optionnels
    let whereClause = "WHERE am.statut = 'active'"
    const queryParams: any[] = []
    let paramIndex = 1

    if (startDate) {
      whereClause += ` AND am.date_affectation >= $${paramIndex}`
      queryParams.push(startDate)
      paramIndex++
    }

    if (endDate) {
      whereClause += ` AND am.date_affectation <= $${paramIndex}`
      queryParams.push(endDate)
      paramIndex++
    }

    if (employeId) {
      whereClause += ` AND am.employe_id = $${paramIndex}`
      queryParams.push(parseInt(employeId))
      paramIndex++
    }

    const result = await query(`
      SELECT 
        e.id as employe_id,
        e.nom as employe_nom,
        e.prenom as employe_prenom,
        e.matricule as employe_matricule,
        COUNT(am.id) as nombre_affectations,
        SUM(am.quantite_assignee) as quantite_totale,
        SUM(COALESCE(m.prix_unitaire, 0) * am.quantite_assignee) as valeur_totale,
        MIN(am.date_affectation) as premiere_affectation,
        MAX(am.date_affectation) as derniere_affectation
      FROM employes e
      LEFT JOIN affectations_materiel am ON e.id = am.employe_id
      LEFT JOIN materiel m ON am.materiel_id = m.id
      ${whereClause}
      GROUP BY e.id, e.nom, e.prenom, e.matricule
      HAVING COUNT(am.id) > 0
      ORDER BY valeur_totale DESC, e.nom, e.prenom
    `, queryParams)
    
    // Convertir les valeurs numériques en nombres
    const employeeValues = result.rows.map((row: any) => ({
      ...row,
      nombre_affectations: Number(row.nombre_affectations) || 0,
      quantite_totale: Number(row.quantite_totale) || 0,
      valeur_totale: Number(row.valeur_totale) || 0
    }))
    
    return NextResponse.json({ employeeValues })
  } catch (error) {
    console.error("Erreur API valeur matériel par employé GET:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
