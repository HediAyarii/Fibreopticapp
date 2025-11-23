import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { assignationId, vehiculeId, testDate, scenario } = await request.json()

    if (!assignationId || !vehiculeId || !testDate || !scenario) {
      return NextResponse.json(
        { success: false, error: 'Données manquantes' },
        { status: 400 }
      )
    }

    const testDateObj = new Date(testDate)
    const now = new Date()
    
    // Calculer le dernier jour du mois actuel
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
    
    // Déterminer le statut selon le scénario
    let statut_km = 'a_jour'
    let message = ''
    
    const daysDiff = Math.floor((testDateObj.getTime() - lastDayOfMonth.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff <= -3 && daysDiff > -4) {
      // J-3
      statut_km = 'a_jour'
      message = '⚠️ ALERTE J-3: Dans 3 jours, vous devrez mettre à jour le kilométrage'
    } else if (daysDiff <= -2 && daysDiff > -3) {
      // J-2
      statut_km = 'a_jour'
      message = '⚠️ ALERTE J-2: Dans 2 jours, mise à jour de kilométrage requise'
    } else if (daysDiff <= -1 && daysDiff > -2) {
      // J-1
      statut_km = 'a_jour'
      message = '⚠️⚠️ ALERTE J-1: DEMAIN - Mise à jour du kilométrage obligatoire'
    } else if (daysDiff === 0) {
      // Jour J - dernier jour du mois
      statut_km = 'retard_j0'
      message = '🚨 AUJOURD\'HUI - DERNIER JOUR pour mettre à jour le kilométrage'
    } else if (daysDiff === 1) {
      // J+1 - 1er jour de grâce
      statut_km = 'retard_j1'
      message = '🚨 RETARD J+1: Période de grâce (1/3). Mettez à jour MAINTENANT'
    } else if (daysDiff === 2) {
      // J+2 - 2ème jour de grâce
      statut_km = 'retard_j2'
      message = '🚨🚨 RETARD J+2: Période de grâce (2/3). Mise à jour URGENTE'
    } else if (daysDiff === 3) {
      // J+3 - dernier jour de grâce
      statut_km = 'retard_j3'
      message = '🚨🚨🚨 RETARD J+3: DERNIER JOUR avant blocage'
    } else if (daysDiff >= 4) {
      // J+4 et plus - BLOCAGE
      statut_km = 'bloque'
      message = '🔒 ACCÈS BLOQUÉ: Le kilométrage n\'a pas été mis à jour. Votre accès est suspendu.'
    }

    // Mettre à jour le statut dans la base de données (simulation)
    await query(
      `UPDATE assignations_vehicules 
       SET statut_km = $1, 
           date_derniere_maj = $2
       WHERE id = $3`,
      [statut_km, scenario === 'J+4' ? null : now.toISOString(), assignationId]
    )

    // Récupérer les infos de l'assignation pour notification
    const assignationResult = await query(
      `SELECT av.*, e.nom, e.prenom, e.email, v.matricule, v.marque, v.modele
       FROM assignations_vehicules av
       JOIN employes e ON av.employe_id = e.id
       JOIN vehicules v ON av.vehicule_id = v.id
       WHERE av.id = $1`,
      [assignationId]
    )

    const assignation = assignationResult.rows[0]

    return NextResponse.json({
      success: true,
      message,
      statut_km,
      scenario,
      testDate: testDateObj.toLocaleDateString('fr-FR'),
      assignation: {
        technicien: `${assignation.prenom} ${assignation.nom}`,
        vehicule: `${assignation.marque} ${assignation.modele} (${assignation.matricule})`,
        email: assignation.email
      },
      notification: {
        type: statut_km === 'bloque' ? 'BLOCAGE' : 'ALERTE',
        urgence: daysDiff >= 0 ? 'HAUTE' : 'NORMALE',
        action_requise: statut_km !== 'a_jour'
      }
    })

  } catch (error) {
    console.error('Erreur test KM alerts:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur serveur' 
      },
      { status: 500 }
    )
  }
}
