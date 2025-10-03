import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export const dynamic = 'force-dynamic'

// Détecter les conflits d'assignation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const numero_carte = searchParams.get('numero_carte')
    const date_debut = searchParams.get('date_debut')
    const date_fin = searchParams.get('date_fin')

    if (numero_carte && date_debut && date_fin) {
      // Vérifier les conflits pour une assignation spécifique
      const conflitsQuery = `
        SELECT * FROM detecter_conflits_assignation($1, $2, $3)
      `
      
      const result = await query(conflitsQuery, [numero_carte, date_debut, date_fin])
      
      return NextResponse.json({
        success: true,
        conflits: result.rows,
        has_conflicts: result.rows.length > 0,
        numero_carte,
        periode: `${date_debut} → ${date_fin}`
      })

    } else {
      // Récupérer tous les conflits existants
      const allConflitsQuery = `
        SELECT 
          cc.*,
          ca1.employe_nom as employe_1_nom,
          ca1.date_debut as date_debut_1,
          ca1.date_fin_prevue as date_fin_1,
          ca2.employe_nom as employe_2_nom,
          ca2.date_debut as date_debut_2,
          ca2.date_fin_prevue as date_fin_2,
          e.prenom || ' ' || e.nom as resolu_par_nom
        FROM carburant_conflits cc
        LEFT JOIN carburant_assignations ca1 ON cc.assignation_1_id = ca1.id
        LEFT JOIN carburant_assignations ca2 ON cc.assignation_2_id = ca2.id
        LEFT JOIN employes e ON cc.resolu_par = e.id
        ORDER BY cc.created_at DESC
      `
      
      const result = await query(allConflitsQuery)
      
      return NextResponse.json({
        success: true,
        conflits: result.rows,
        total: result.rows.length
      })
    }

  } catch (error) {
    console.error('Erreur lors de la détection des conflits:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la détection des conflits' 
    }, { status: 500 })
  }
}

// Créer un conflit manuellement
export async function POST(request: NextRequest) {
  try {
    const { 
      numero_carte,
      assignation_1_id,
      assignation_2_id,
      date_debut_conflit,
      date_fin_conflit,
      motif
    } = await request.json()

    if (!numero_carte || !assignation_1_id || !assignation_2_id) {
      return NextResponse.json({ 
        error: 'numero_carte, assignation_1_id et assignation_2_id sont requis' 
      }, { status: 400 })
    }

    const insertQuery = `
      INSERT INTO carburant_conflits (
        numero_carte,
        assignation_1_id,
        assignation_2_id,
        date_debut_conflit,
        date_fin_conflit,
        statut
      ) VALUES ($1, $2, $3, $4, $5, 'detecte')
      RETURNING *
    `

    const result = await query(insertQuery, [
      numero_carte,
      assignation_1_id,
      assignation_2_id,
      date_debut_conflit,
      date_fin_conflit
    ])

    return NextResponse.json({
      success: true,
      conflit: result.rows[0],
      message: `Conflit créé pour la carte ${numero_carte}`
    })

  } catch (error) {
    console.error('Erreur lors de la création du conflit:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la création du conflit' 
    }, { status: 500 })
  }
}

// Résoudre un conflit
export async function PUT(request: NextRequest) {
  try {
    const { 
      conflit_id,
      resolution,
      resolu_par,
      statut = 'resolu'
    } = await request.json()

    if (!conflit_id || !resolution) {
      return NextResponse.json({ 
        error: 'conflit_id et resolution sont requis' 
      }, { status: 400 })
    }

    const updateQuery = `
      UPDATE carburant_conflits 
      SET 
        resolution = $1,
        resolu_par = $2,
        statut = $3,
        date_resolution = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `

    const result = await query(updateQuery, [
      resolution,
      resolu_par || null,
      statut,
      conflit_id
    ])

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Conflit non trouvé' 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      conflit: result.rows[0],
      message: 'Conflit résolu avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de la résolution du conflit:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la résolution du conflit' 
    }, { status: 500 })
  }
}
