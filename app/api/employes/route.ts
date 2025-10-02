import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// Fonction utilitaire pour traiter les valeurs de date et numérique
function processValue(value: any, fieldType: 'date' | 'numeric' | 'text'): any {
  if (value === '' || value === undefined) {
    return null
  }
  
  if (fieldType === 'numeric') {
    // Pour les champs numériques, convertir en nombre ou null
    const numValue = parseFloat(value)
    return isNaN(numValue) ? null : numValue
  }
  
  return value
}

export async function GET() {
  try {
    // Récupérer les employés directement depuis les interventions
    const result = await query(`
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
        CONCAT('+33 6 ', LPAD(FLOOR(RANDOM() * 90 + 10)::TEXT, 2, '0'), ' ', LPAD(FLOOR(RANDOM() * 90 + 10)::TEXT, 2, '0'), ' ', LPAD(FLOOR(RANDOM() * 90 + 10)::TEXT, 2, '0'), ' ', LPAD(FLOOR(RANDOM() * 90 + 10)::TEXT, 2, '0')) as telephone,
        CURRENT_DATE as date_embauche,
        CURRENT_TIMESTAMP as created_at,
        COUNT(*) as nb_interventions
      FROM interventions 
      WHERE nom_technicien IS NOT NULL 
        AND prenom_technicien IS NOT NULL
        AND nom_technicien != 'nan'
        AND prenom_technicien != 'nan'
        AND nom_technicien != ''
        AND prenom_technicien != ''
      GROUP BY nom_technicien, prenom_technicien
      ORDER BY nb_interventions DESC, nom_technicien, prenom_technicien
    `)

    return NextResponse.json({
      success: true,
      employes: result.rows
    })
  } catch (error) {
    console.error('Erreur GET employes:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      prenom,
      nom,
      matricule,
      niveau_acces,
      statut,
      email,
      telephone,
      date_embauche
    } = await request.json()

    if (!prenom || !nom || !matricule) {
      return NextResponse.json({ error: 'Prénom, nom et matricule requis' }, { status: 400 })
    }

    // Vérifier que le matricule n'existe pas déjà
    const existingEmployee = await query(
      'SELECT id FROM employes WHERE matricule = $1',
      [matricule]
    )

    if (existingEmployee.rows.length > 0) {
      return NextResponse.json({ error: 'Ce matricule existe déjà' }, { status: 400 })
    }

    const result = await query(`
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      prenom,
      nom,
      matricule,
      niveau_acces || 'technicien',
      statut || 'actif',
      email || null,
      telephone || null,
      processValue(date_embauche, 'date'),
      new Date()
    ])

    return NextResponse.json({
      success: true,
      employe: result.rows[0],
      message: 'Employé créé avec succès'
    })

  } catch (error) {
    console.error('Erreur POST employe:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updateData } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }

    const updateFields = []
    const params = []
    let paramIndex = 1

    // Définir les types de champs
    const fieldTypes: { [key: string]: 'date' | 'numeric' | 'text' } = {
      date_embauche: 'date',
      salaire_base: 'numeric',
      taux_horaire: 'numeric',
      pourcentage_taxe: 'numeric',
      heures_travaillees: 'numeric',
      heures_supplementaires: 'numeric',
      prime_performance: 'numeric',
      penalites_total: 'numeric',
      date_derniere_evaluation: 'date'
    }

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        // Traiter les valeurs selon leur type
        const fieldType = fieldTypes[key] || 'text'
        const processedValue = processValue(value, fieldType)
        
        updateFields.push(`${key} = $${paramIndex}`)
        params.push(processedValue)
        paramIndex++
      }
    })

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'Aucune donnée à mettre à jour' }, { status: 400 })
    }

    params.push(id)
    const queryText = `
      UPDATE employes 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await query(queryText, params)

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Employé non trouvé' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      employe: result.rows[0],
      message: 'Employé mis à jour avec succès'
    })

  } catch (error) {
    console.error('Erreur PUT employe:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }

    const result = await query(
      'DELETE FROM employes WHERE id = $1 RETURNING *',
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Employé non trouvé' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Employé supprimé avec succès'
    })

  } catch (error) {
    console.error('Erreur DELETE employe:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}