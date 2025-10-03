import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function POST() {
  try {
    // Récupérer les employés depuis les interventions
    const employeesResult = await query(`
      SELECT DISTINCT
        ROW_NUMBER() OVER (ORDER BY nom_technicien, prenom_technicien) as id,
        prenom_technicien as prenom,
        nom_technicien as nom,
        CONCAT('EMP', UPPER(SUBSTRING(nom_technicien, 1, 3)), UPPER(SUBSTRING(prenom_technicien, 1, 2))) as matricule,
        CASE 
          WHEN COUNT(*) >= 100 THEN 'chef_equipe'
          WHEN COUNT(*) >= 50 THEN 'technicien'
          ELSE 'technicien'
        END as niveau_acces,
        'actif' as statut,
        CONCAT(LOWER(prenom_technicien), '.', LOWER(REPLACE(nom_technicien, ' ', '')), '@finalfibre.com') as email,
        CONCAT('+33 6 ', LPAD(FLOOR(RANDOM() * 90 + 10)::TEXT, 2, '0'), ' ', LPAD(FLOOR(RANDOM() * 90 + 10)::TEXT, 2, '0'), ' ', LPAD(FLOOR(RANDOM() * 90 + 10)::TEXT, 2, '0'), ' ', LPAD(FLOOR(RANDOM() * 90 + 10)::TEXT, 2, '0')) as telephone
      FROM interventions 
      WHERE nom_technicien IS NOT NULL 
        AND prenom_technicien IS NOT NULL
        AND nom_technicien != 'nan'
        AND prenom_technicien != 'nan'
        AND nom_technicien != ''
        AND prenom_technicien != ''
      GROUP BY nom_technicien, prenom_technicien
      ORDER BY nom_technicien, prenom_technicien
    `)

    console.log('Employés trouvés dans interventions:', employeesResult.rows.length)

    // Insérer les employés dans la table employes
    let inserted = 0
    let skipped = 0

    for (const employee of employeesResult.rows) {
      try {
        // Vérifier si l'employé existe déjà
        const existing = await query(
          'SELECT id FROM employes WHERE nom = $1 AND prenom = $2',
          [employee.nom, employee.prenom]
        )

        if (existing.rows.length === 0) {
          // Insérer l'employé
          await query(`
            INSERT INTO employes (
              prenom,
              nom,
              matricule,
              niveau_acces,
              statut,
              email,
              telephone,
              date_embauche,
              created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, CURRENT_TIMESTAMP)
          `, [
            employee.prenom,
            employee.nom,
            employee.matricule,
            employee.niveau_acces,
            employee.statut,
            employee.email,
            employee.telephone
          ])
          inserted++
          console.log(`Employé inséré: ${employee.nom} ${employee.prenom}`)
        } else {
          skipped++
          console.log(`Employé déjà existant: ${employee.nom} ${employee.prenom}`)
        }
      } catch (error) {
        console.error(`Erreur insertion employé ${employee.nom} ${employee.prenom}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synchronisation terminée: ${inserted} employés insérés, ${skipped} déjà existants`,
      inserted,
      skipped,
      total: employeesResult.rows.length
    })
  } catch (error) {
    console.error("Erreur synchronisation employés:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
