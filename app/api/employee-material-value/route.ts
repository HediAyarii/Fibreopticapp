import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const employeId = searchParams.get('employeId')
    const grille = searchParams.get('grille') // ERT ou AXECOM

    // Construire la requête avec filtres optionnels
    let whereClause = "WHERE am.statut = 'active'"
    const queryParams: any[] = []
    let paramIndex = 1

    // Ajouter les dates par défaut si non fournies
    const effectiveStartDate = startDate || '2020-01-01'
    const effectiveEndDate = endDate || '2030-12-31'
    queryParams.push(effectiveStartDate, effectiveEndDate)
    paramIndex += 2

    if (startDate) {
      whereClause += ` AND am.date_affectation >= $1`
    }

    if (endDate) {
      whereClause += ` AND am.date_affectation <= $2`
    }

    if (employeId) {
      whereClause += ` AND am.employe_id = $${paramIndex}`
      queryParams.push(parseInt(employeId))
      paramIndex++
    }

    const result = await query(`
      WITH employee_labels AS (
        SELECT 
          i.nom_technicien,
          i.prenom_technicien,
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM interventions i2 
              WHERE i2.nom_technicien = i.nom_technicien 
              AND i2.prenom_technicien = i.prenom_technicien
              AND i2.grille IN ('AXECOM MANCHE', 'B2B : AXECOM MANCHE')
              AND (
                (i2.cloture_tech IS NOT NULL AND i2.cloture_tech != '' AND i2.cloture_tech != 'nan' AND 
                 i2.cloture_tech ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' AND 
                 (i2.cloture_tech::date >= $1::date AND i2.cloture_tech::date <= $2::date)) OR
                (i2.cloture_hotline IS NOT NULL AND i2.cloture_hotline != '' AND i2.cloture_hotline != 'nan' AND 
                 i2.cloture_hotline ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' AND 
                 (i2.cloture_hotline::date >= $1::date AND i2.cloture_hotline::date <= $2::date)) OR
                (i2.cloture_tech IS NULL AND i2.cloture_hotline IS NULL AND 
                 i2.date_rdv IS NOT NULL AND i2.date_rdv != '' AND i2.date_rdv != 'nan' AND 
                 i2.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' AND 
                 (i2.date_rdv::date >= $1::date AND i2.date_rdv::date <= $2::date))
              )
            ) THEN 'AXECOM'
            ELSE NULL
          END as axecom_label,
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM interventions i3 
              WHERE i3.nom_technicien = i.nom_technicien 
              AND i3.prenom_technicien = i.prenom_technicien
              AND i3.grille NOT IN ('AXECOM MANCHE', 'B2B : AXECOM MANCHE')
              AND i3.grille IS NOT NULL
              AND i3.grille != ''
              AND (
                (i3.cloture_tech IS NOT NULL AND i3.cloture_tech != '' AND i3.cloture_tech != 'nan' AND 
                 i3.cloture_tech ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' AND 
                 (i3.cloture_tech::date >= $1::date AND i3.cloture_tech::date <= $2::date)) OR
                (i3.cloture_hotline IS NOT NULL AND i3.cloture_hotline != '' AND i3.cloture_hotline != 'nan' AND 
                 i3.cloture_hotline ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' AND 
                 (i3.cloture_hotline::date >= $1::date AND i3.cloture_hotline::date <= $2::date)) OR
                (i3.cloture_tech IS NULL AND i3.cloture_hotline IS NULL AND 
                 i3.date_rdv IS NOT NULL AND i3.date_rdv != '' AND i3.date_rdv != 'nan' AND 
                 i3.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' AND 
                 (i3.date_rdv::date >= $1::date AND i3.date_rdv::date <= $2::date))
              )
            ) THEN 'ERT'
            ELSE NULL
          END as ert_label
        FROM interventions i
        WHERE i.statut = 'CLOTURE TERMINEE'
          AND i.articles IS NOT NULL 
          AND i.articles != ''
          AND (
            (i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND 
             i.cloture_tech ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' AND 
             (i.cloture_tech::date >= $1::date AND i.cloture_tech::date <= $2::date)) OR
            (i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND 
             i.cloture_hotline ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' AND 
             (i.cloture_hotline::date >= $1::date AND i.cloture_hotline::date <= $2::date)) OR
            (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND 
             i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND 
             i.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' AND 
             (i.date_rdv::date >= $1::date AND i.date_rdv::date <= $2::date))
          )
        GROUP BY i.nom_technicien, i.prenom_technicien
      )
      SELECT 
        e.id as employe_id,
        e.nom as employe_nom,
        e.prenom as employe_prenom,
        e.matricule as employe_matricule,
        COUNT(am.id) as nombre_affectations,
        SUM(am.quantite_assignee) as quantite_totale,
        SUM(COALESCE(m.prix_unitaire, 0) * am.quantite_assignee) as valeur_totale,
        MIN(am.date_affectation) as premiere_affectation,
        MAX(am.date_affectation) as derniere_affectation,
        COALESCE(el.ert_label, '') as ert_label,
        COALESCE(el.axecom_label, '') as axecom_label
      FROM employes e
      LEFT JOIN affectations_materiel am ON e.id = am.employe_id
      LEFT JOIN materiel m ON am.materiel_id = m.id
      LEFT JOIN employee_labels el ON e.nom = el.nom_technicien AND e.prenom = el.prenom_technicien
      ${whereClause}
      GROUP BY e.id, e.nom, e.prenom, e.matricule, el.ert_label, el.axecom_label
      HAVING COUNT(am.id) > 0
      ORDER BY valeur_totale DESC, e.nom, e.prenom
    `, queryParams)
    
    // Filtrer par grille côté serveur
    let filteredRows = result.rows
    if (grille === 'ERT') {
      filteredRows = result.rows.filter((row: any) => row.ert_label === 'ERT')
    } else if (grille === 'AXECOM') {
      filteredRows = result.rows.filter((row: any) => row.axecom_label === 'AXECOM')
    }
    
    // Convertir les valeurs numériques en nombres
    const employeeValues = filteredRows.map((row: any) => ({
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
