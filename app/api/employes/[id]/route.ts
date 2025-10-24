import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employeeId = parseInt(params.id)
    
    if (isNaN(employeeId)) {
      return NextResponse.json({ error: 'ID employé invalide' }, { status: 400 })
    }

    // Récupérer les informations de l'employé
    const result = await query(`
      SELECT 
        id,
        prenom,
        nom,
        matricule,
        niveau_acces,
        statut,
        email,
        telephone,
        date_embauche,
        salaire_base,
        taux_horaire,
        pourcentage_taxe,
        heures_travaillees,
        heures_supplementaires,
        prime_performance,
        penalites_total,
        date_derniere_evaluation,
        rib_salaire,
        rib2,
        created_at,
        updated_at
      FROM employes 
      WHERE id = $1
    `, [employeeId])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Employé non trouvé' }, { status: 404 })
    }

    const employee = result.rows[0]

    return NextResponse.json({
      success: true,
      employe: employee
    })
  } catch (error) {
    console.error('Erreur GET employé par ID:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}





