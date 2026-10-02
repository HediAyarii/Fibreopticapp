import { NextRequest, NextResponse } from 'next/server'
import { query, getClient } from '@/lib/database'
import {
  AssignationErreur,
  assignerCarte,
  commencer,
  messageErreurBase,
  verifierDate,
  type Resolution
} from '@/lib/carburant-assignations'

export const dynamic = 'force-dynamic'

// Créer une nouvelle assignation avec période.
// Si la carte est déjà prise, renvoie 409 { code: 'conflit', conflits } : le client
// renvoie alors la demande avec resolutions = { [assignation_id]: { action: 'liberer' }
// | { action: 'changer', carte } } pour chaque titulaire en conflit.
export async function POST(request: NextRequest) {
  const client = await getClient()
  try {
    const { numero_carte, employe_id, date_debut, date_fin_prevue, commentaires, resolutions } = await request.json()

    if (!numero_carte || !employe_id || !date_debut) {
      return NextResponse.json({
        error: 'Données manquantes: numero_carte, employe_id et date_debut sont requis'
      }, { status: 400 })
    }

    const periode = {
      debut: verifierDate(date_debut, 'Date de début'),
      fin: date_fin_prevue ? verifierDate(date_fin_prevue, 'Date de fin') : null
    }

    await commencer(client)
    const resultat = await assignerCarte(client, {
      carte: String(numero_carte).trim(),
      employeId: parseInt(employe_id),
      periode,
      commentaires,
      resolutions: resolutions as Record<string, Resolution> | undefined
    })
    await client.query('COMMIT')

    return NextResponse.json({
      success: true,
      assignation_id: resultat.id,
      actions: resultat.actions,
      message: resultat.actions.join('\n')
    })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    const erreur = error instanceof AssignationErreur ? error : messageErreurBase(error)
    if (erreur) {
      return NextResponse.json({ error: erreur.message, message: erreur.message, ...erreur.details }, { status: erreur.status })
    }
    console.error('Erreur lors de l\'assignation de la carte:', error)
    return NextResponse.json({
      error: 'Erreur lors de l\'assignation de la carte'
    }, { status: 500 })
  } finally {
    client.release()
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
      whereConditions.push(`ca.carte_id = $${paramIndex}`)
      params.push(numero_carte)
      paramIndex++
    }

    if (employe_id) {
      whereConditions.push(`ca.employe_id = $${paramIndex}`)
      params.push(parseInt(employe_id))
      paramIndex++
    }

    if (statut) {
      whereConditions.push(`ca.statut = $${paramIndex}`)
      params.push(statut)
      paramIndex++
    }

    // Filtrer par période si spécifiée
    if (date_debut && date_fin) {
      whereConditions.push(`
        (ca.date_assignation <= $${paramIndex + 1} AND 
         COALESCE(ca.date_fin, '2099-12-31'::DATE) >= $${paramIndex})
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
          WHEN ca.date_fin IS NOT NULL THEN 'terminee'
          WHEN ca.date_fin IS NOT NULL AND ca.date_fin < CURRENT_DATE THEN 'expiree'
          ELSE 'active'
        END as statut_reel
      FROM carburant_assignations ca
      LEFT JOIN employes e ON ca.employe_id = e.id
      LEFT JOIN carburant c ON ca.carte_id = c.numero_carte
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ca.date_assignation DESC, ca.created_at DESC
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
