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
      type_reclamation = 'probleme_technique',  // Valeur par défaut corrigée (doit être: article_manquant, probleme_technique, erreur_grille, autre)
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

    // Récupérer les infos du technicien
    const technicienResult = await query(
      `SELECT nom, prenom FROM employes WHERE id = $1`,
      [technicien_id]
    )
    
    const technicien = technicienResult.rows[0]

    // Créer la réclamation technique
    const result = await query(
      `INSERT INTO reclamations_techniques (
        intervention_id,
        num_inter,
        technicien_id,
        nom_technicien,
        prenom_technicien,
        type_reclamation,
        description,
        date_intervention,
        statut,
        date_creation
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'en_attente', NOW())
      RETURNING *`,
      [
        intervention_id,
        intervention.num_inter,
        technicien_id,
        technicien?.nom || '',
        technicien?.prenom || '',
        type_reclamation,
        description_probleme,
        intervention.date_rdv
      ]
    )

    const reclamation = result.rows[0]
    const numeroReclamation = `RT-${reclamation.id}`

    // Créer une notification pour le technicien (optionnel - la table peut ne pas exister)
    try {
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
    } catch (notifError) {
      console.log('⚠️ Table notifications non disponible, notification ignorée')
    }

    // Émettre l'événement Socket.IO pour notification en temps réel (optionnel)
    try {
      const socketioModule = await import('@/lib/socketio')
      if (socketioModule && socketioModule.sendReclamationTechniqueCreated) {
        socketioModule.sendReclamationTechniqueCreated(reclamation)
        console.log('✅ Événement Socket.IO émis: reclamation_technique_created')
      }
    } catch (socketError) {
      console.log('⚠️ Socket.IO non disponible')
    }

    // Envoyer notification SSE au technicien si connecté (optionnel)
    try {
      const { sendToTechnicien } = await import('@/app/api/sse/technicien/route')
      sendToTechnicien(technicien_id, 'reclamation_created', {
        numero_reclamation: numeroReclamation,
        reclamation_id: reclamation.id,
        message: 'Votre signalement a été enregistré avec succès'
      })
    } catch (error) {
      console.log('⚠️ SSE non disponible')
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
