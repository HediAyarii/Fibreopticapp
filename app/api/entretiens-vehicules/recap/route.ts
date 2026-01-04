import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

// API pour récupérer les entretiens avec l'appartenance grille des employés assignés
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const grille = searchParams.get('grille') // 'ert', 'axecom', ou 'tout'

    if (!startDate || !endDate) {
      return NextResponse.json({
        success: true,
        entretiens: [],
        total: 0,
        totalFiltre: 0
      })
    }

    // Récupérer les entretiens avec les informations du véhicule et de l'employé assigné
    const entretiensResult = await query(`
      SELECT 
        ev.id,
        ev.vehicule_id,
        ev.date_entretien,
        ev.cout_entretien,
        ev.cout,
        ev.type_entretien,
        ev.description,
        v.matricule as vehicule_matricule,
        v.marque,
        v.modele,
        av.employe_id,
        e.nom as employe_nom,
        e.prenom as employe_prenom,
        e.matricule as employe_matricule
      FROM entretiens_vehicules ev
      LEFT JOIN vehicules v ON ev.vehicule_id = v.id
      LEFT JOIN assignations_vehicules av ON v.id = av.vehicule_id 
        AND av.statut = 'active'
        AND av.date_assignation <= $2::date
        AND (av.date_fin IS NULL OR av.date_fin >= $1::date)
      LEFT JOIN employes e ON av.employe_id = e.id
      WHERE ev.date_entretien >= $1::date 
        AND ev.date_entretien <= $2::date
      ORDER BY ev.date_entretien DESC
    `, [startDate, endDate])

    const entretiens = entretiensResult.rows

    // Pour chaque entretien, déterminer l'appartenance grille de l'employé
    const entretiensAvecGrille = await Promise.all(
      entretiens.map(async (entretien: any) => {
        let grilleEmploye = 'aucune' // 'ert', 'axecom', 'both', 'aucune'
        let coefficient = 1 // Coefficient à appliquer selon le filtre

        if (entretien.employe_matricule) {
          // Vérifier les interventions de l'employé pour déterminer sa grille
          const grilleResult = await query(`
            SELECT 
              CASE WHEN COUNT(CASE WHEN i.grille IN ('AXECOM MANCHE', 'B2B : AXECOM MANCHE') THEN 1 END) > 0 THEN true ELSE false END as has_axecom,
              CASE WHEN COUNT(CASE WHEN i.grille NOT IN ('AXECOM MANCHE', 'B2B : AXECOM MANCHE') AND i.grille IS NOT NULL AND i.grille != '' THEN 1 END) > 0 THEN true ELSE false END as has_ert
            FROM interventions i
            JOIN employes e ON (
              (LOWER(TRIM(i.nom_technicien)) = LOWER(TRIM(e.nom)) AND LOWER(TRIM(SPLIT_PART(i.prenom_technicien, ',', 1))) = LOWER(TRIM(e.prenom)))
              OR
              (LOWER(TRIM(SPLIT_PART(i.nom_technicien, ' ', 1))) = LOWER(TRIM(e.nom)) AND LOWER(TRIM(SPLIT_PART(i.prenom_technicien, ',', 1))) = LOWER(TRIM(e.prenom)))
            )
            WHERE e.matricule = $1
              AND i.date_rdv IS NOT NULL 
              AND i.date_rdv != '' 
              AND i.date_rdv != 'nan'
              AND i.date_rdv ~ '^[0-9]'
              AND (
                (i.date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') >= $2::date AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') <= $3::date) OR
                (i.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' AND i.date_rdv::date >= $2::date AND i.date_rdv::date <= $3::date)
              )
          `, [entretien.employe_matricule, startDate, endDate])

          const hasAxecom = grilleResult.rows[0]?.has_axecom || false
          const hasErt = grilleResult.rows[0]?.has_ert || false

          if (hasAxecom && hasErt) {
            grilleEmploye = 'both'
          } else if (hasAxecom) {
            grilleEmploye = 'axecom'
          } else if (hasErt) {
            grilleEmploye = 'ert'
          } else {
            grilleEmploye = 'aucune'
          }
        }

        // Déterminer le coefficient selon la grille sélectionnée
        if (grille && grille !== 'tout') {
          if (grilleEmploye === 'both' || grilleEmploye === 'aucune') {
            // Employé appartient aux deux ou à aucune → 50% pour chaque
            coefficient = 0.5
          } else if (grille === 'ert' && grilleEmploye === 'axecom') {
            // Filtre ERT mais employé AXECOM uniquement → 0%
            coefficient = 0
          } else if (grille === 'axecom' && grilleEmploye === 'ert') {
            // Filtre AXECOM mais employé ERT uniquement → 0%
            coefficient = 0
          } else {
            // Correspondance exacte → 100%
            coefficient = 1
          }
        }

        const coutBase = parseFloat(entretien.cout_entretien) || parseFloat(entretien.cout) || 0
        const coutFiltre = coutBase * coefficient

        return {
          ...entretien,
          grille_employe: grilleEmploye,
          coefficient: coefficient,
          cout_base: coutBase,
          cout_filtre: coutFiltre
        }
      })
    )

    // Calculer les totaux
    const totalBase = entretiensAvecGrille.reduce((sum, e) => sum + e.cout_base, 0)
    const totalFiltre = entretiensAvecGrille.reduce((sum, e) => sum + e.cout_filtre, 0)

    return NextResponse.json({
      success: true,
      entretiens: entretiensAvecGrille,
      total: totalBase,
      totalFiltre: totalFiltre,
      grille: grille || 'tout'
    })

  } catch (error: any) {
    console.error('Erreur API entretiens recap:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
