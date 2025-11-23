import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { 
      intervention_num, 
      intervention_id,
      technicien_id, 
      description_probleme, 
      type_reclamation = 'technique',
      priorite = 'moyenne'
    } = body

    if (!intervention_num || !technicien_id || !description_probleme) {
      return NextResponse.json(
        { error: 'Données manquantes (intervention, technicien, description)' },
        { status: 400 }
      )
    }

    // Récupérer les informations de l'intervention
    const interventionResult = await query(
      `SELECT num_inter, client, type_intervention, date_rdv 
       FROM interventions 
       WHERE num_inter = $1 OR id = $2`,
      [intervention_num, intervention_id || 0]
    )

    if (interventionResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Intervention non trouvée' },
        { status: 404 }
      )
    }

    const intervention = interventionResult.rows[0]

    // Générer un numéro de réclamation unique
    const timestamp = Date.now()
    const numeroReclamation = `#${timestamp}`

    // Créer la réclamation technique
    const result = await query(
      `INSERT INTO reclamations (
        numero_reclamation,
        nom_client,
        type_reclamation,
        statut,
        priorite,
        date_creation,
        date_reclamation,
        description_probleme,
        numero_intervention,
        intervention_client,
        date_intervention,
        employe_id,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *`,
      [
        numeroReclamation,
        intervention.client,
        type_reclamation,
        'ouverte',
        priorite,
        description_probleme,
        intervention.num_inter,
        intervention.client,
        intervention.date_rdv,
        technicien_id
      ]
    )

    const reclamation = result.rows[0]

    // Créer une notification pour le technicien
    await query(
      `INSERT INTO notifications (
        employe_id,
        titre,
        message,
        type,
        date_envoi,
        lu,
        created_at
      ) VALUES ($1, $2, $3, $4, NOW(), false, NOW())`,
      [
        technicien_id,
        'Réclamation enregistrée',
        `Votre signalement pour l'intervention ${intervention.num_inter} a été enregistré sous le numéro ${numeroReclamation}. Vous serez notifié une fois qu'il sera traité.`,
        'info'
      ]
    )

    // Envoyer notification SSE au technicien si connecté
    try {
      const { sendToTechnicien } = await import('@/app/api/sse/technicien/route')
      sendToTechnicien(technicien_id, 'reclamation_created', {
        numero_reclamation: numeroReclamation,
        reclamation_id: reclamation.id,
        message: 'Votre signalement a été enregistré avec succès'
      })
    } catch (error) {
      console.log('SSE non disponible, notification en base uniquement')
    }

    return NextResponse.json({
      success: true,
      message: 'Réclamation créée avec succès',
      numero_reclamation: numeroReclamation,
      reclamation_id: reclamation.id
    })

  } catch (error: any) {
    console.error('Erreur lors du signalement:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}
