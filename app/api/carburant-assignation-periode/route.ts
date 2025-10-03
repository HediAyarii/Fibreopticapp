import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export const dynamic = 'force-dynamic'

// Créer une nouvelle assignation avec période
export async function POST(request: NextRequest) {
  try {
    const { 
      numero_carte, 
      employe_id, 
      employe_nom, 
      date_debut, 
      date_fin_prevue, 
      commentaires,
      assignee_par 
    } = await request.json()

    if (!numero_carte || !employe_id || !employe_nom || !date_debut) {
      return NextResponse.json({ 
        error: 'Données manquantes: numero_carte, employe_id, employe_nom et date_debut sont requis' 
      }, { status: 400 })
    }

    // Vérifier les conflits d'assignation
    const conflitsQuery = `
      SELECT * FROM detecter_conflits_assignation($1, $2, $3)
    `
    const conflits = await query(conflitsQuery, [
      numero_carte, 
      date_debut, 
      date_fin_prevue || '2099-12-31'
    ])

    if (conflits.rows.length > 0) {
      return NextResponse.json({ 
        error: 'Conflit détecté',
        conflits: conflits.rows,
        message: `La carte ${numero_carte} est déjà assignée pendant cette période`
      }, { status: 409 })
    }

    // Créer l'assignation
    const insertQuery = `
      INSERT INTO carburant_assignations (
        numero_carte, employe_id, employe_nom, date_debut, 
        date_fin_prevue, commentaires, statut
      ) VALUES ($1, $2, $3, $4, $5, $6, 'active')
      RETURNING *
    `

    const result = await query(insertQuery, [
      numero_carte,
      employe_id,
      employe_nom,
      date_debut,
      date_fin_prevue || null,
      commentaires || null
    ])

    return NextResponse.json({
      success: true,
      assignation: result.rows[0],
      message: `Carte ${numero_carte} assignée à ${employe_nom} du ${date_debut}${date_fin_prevue ? ` au ${date_fin_prevue}` : ''}`
    })

  } catch (error) {
    console.error('Erreur lors de l\'assignation de la carte:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de l\'assignation de la carte' 
    }, { status: 500 })
  }
}

// Récupérer les assignations avec filtres par période
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const numero_carte = searchParams.get('numero_carte')
    const employe_id = searchParams.get('employe_id')
    const date_debut = searchParams.get('date_debut')
    const date_fin = searchParams.get('date_fin')
    const statut = searchParams.get('statut') || 'active'

    let whereConditions = ['1=1']
    let params: any[] = []
    let paramIndex = 1

    if (numero_carte) {
      whereConditions.push(`numero_carte = $${paramIndex}`)
      params.push(numero_carte)
      paramIndex++
    }

    if (employe_id) {
      whereConditions.push(`employe_id = $${paramIndex}`)
      params.push(parseInt(employe_id))
      paramIndex++
    }

    if (statut) {
      whereConditions.push(`statut = $${paramIndex}`)
      params.push(statut)
      paramIndex++
    }

    // Filtrer par période si spécifiée
    if (date_debut && date_fin) {
      whereConditions.push(`
        (date_debut <= $${paramIndex + 1} AND 
         COALESCE(date_fin_reelle, date_fin_prevue, '2099-12-31'::DATE) >= $${paramIndex})
      `)
      params.push(date_debut, date_fin)
      paramIndex += 2
    }

    const selectQuery = `
      SELECT 
        ca.*,
        e.prenom,
        e.nom,
        e.matricule,
        c.montant as montant_carte,
        c.statut as statut_carte,
        CASE 
          WHEN ca.date_fin_reelle IS NOT NULL THEN 'terminee'
          WHEN ca.date_fin_prevue IS NOT NULL AND ca.date_fin_prevue < CURRENT_DATE THEN 'expiree'
          ELSE 'active'
        END as statut_reel
      FROM carburant_assignations ca
      LEFT JOIN employes e ON ca.employe_id = e.id
      LEFT JOIN carburant c ON ca.numero_carte = c.numero_carte
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ca.date_debut DESC, ca.created_at DESC
    `

    const result = await query(selectQuery, params)

    return NextResponse.json({
      success: true,
      assignations: result.rows,
      total: result.rows.length
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des assignations:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des assignations' 
    }, { status: 500 })
  }
}

// Terminer une assignation
export async function PUT(request: NextRequest) {
  try {
    const { 
      assignation_id, 
      date_fin_reelle, 
      motif_fin 
    } = await request.json()

    if (!assignation_id || !date_fin_reelle) {
      return NextResponse.json({ 
        error: 'assignation_id et date_fin_reelle sont requis' 
      }, { status: 400 })
    }

    const updateQuery = `
      UPDATE carburant_assignations 
      SET 
        date_fin_reelle = $1,
        motif_fin = $2,
        statut = 'inactive',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND statut = 'active'
      RETURNING *
    `

    const result = await query(updateQuery, [
      date_fin_reelle,
      motif_fin || 'Fin d\'assignation',
      assignation_id
    ])

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Assignation non trouvée ou déjà terminée' 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      assignation: result.rows[0],
      message: 'Assignation terminée avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de la fin d\'assignation:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la fin d\'assignation' 
    }, { status: 500 })
  }
}
