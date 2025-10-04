import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { sendPenaliteNotification } from "@/lib/socketio"
import webpush from 'web-push'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeId = searchParams.get('employe_id')
    
    let queryText = `
      SELECT p.*, 
             e.nom as employe_nom, e.prenom as employe_prenom,
             i.num_inter, i.client as intervention_client,
             r.numero_reclamation,
             m.nom_equipement
      FROM penalites p 
      LEFT JOIN employes e ON p.employe_id = e.id 
      LEFT JOIN interventions i ON p.intervention_concernee = i.id
      LEFT JOIN reclamations r ON p.reclamation_concernee = r.id
      LEFT JOIN materiel m ON p.materiel_concerne = m.id
    `
    let params: any[] = []
    
    if (employeId) {
      queryText += ' WHERE p.employe_id = $1'
      params = [employeId]
    }
    
    queryText += ' ORDER BY p.date_attribution DESC'
    
    const result = await query(queryText, params)
    return NextResponse.json({ penalites: result.rows })
  } catch (error) {
    console.error("Erreur API pénalités GET:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Nouvelle route pour rechercher une intervention par numéro
export async function PATCH(request: NextRequest) {
  try {
    const { num_inter } = await request.json()

    if (!num_inter) {
      return NextResponse.json({ error: "Numéro d'intervention requis" }, { status: 400 })
    }

    // Rechercher l'intervention et récupérer les informations du technicien
    const result = await query(`
      SELECT i.*, e.id as employe_id, e.nom, e.prenom, e.matricule
      FROM interventions i
      LEFT JOIN employes e ON (
        LOWER(e.prenom) = LOWER(i.prenom_technicien) AND 
        LOWER(e.nom) = LOWER(i.nom_technicien)
      )
      WHERE i.num_inter LIKE $1
      ORDER BY i.num_inter
      LIMIT 10
    `, [`${num_inter}%`])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Aucune intervention trouvée" }, { status: 404 })
    }

    // Retourner toutes les interventions trouvées
    const interventions = []
    for (const intervention of result.rows) {
      // Vérifier si une pénalité existe déjà pour cette intervention
      const existingPenalty = await query(
        'SELECT id FROM penalites WHERE intervention_concernee = $1 AND type_penalite = $2',
        [intervention.id, 'dossier_non_cloture']
      )

      interventions.push({
        id: intervention.id,
        num_inter: intervention.num_inter,
        client: intervention.client,
        date_rdv: intervention.date_rdv,
        cloture_tech: intervention.cloture_tech,
        cloture_hotline: intervention.cloture_hotline,
        prenom_technicien: intervention.prenom_technicien,
        nom_technicien: intervention.nom_technicien,
        employe_id: intervention.employe_id,
        employe_nom: intervention.nom,
        employe_prenom: intervention.prenom,
        employe_matricule: intervention.matricule,
        has_existing_penalty: existingPenalty.rows.length > 0
      })
    }

    return NextResponse.json({
      success: true,
      interventions: interventions,
      count: interventions.length
    })
  } catch (error) {
    console.error("Erreur API recherche intervention:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      numero_penalite,
      employe_id,
      motif,
      montant,
      manager_approbateur,
      commentaires,
      reclamation_concernee,
      materiel_concerne,
      num_inter,
      auto_calculate,
      date_attribution
    } = await request.json()

    let intervention_concernee = null
    let type_penalite = 'dossier_non_cloture' // Toujours défini sur dossier non clôturé

    if (!employe_id && !num_inter) {
      return NextResponse.json({ error: "ID employé ou numéro d'intervention requis" }, { status: 400 })
    }

    let finalEmployeId = employe_id
    let finalMontant = montant
    let finalMotif = motif

    // Si auto_calculate est activé et qu'un num_inter est fourni
    if (auto_calculate && num_inter) {
      try {
        // Récupérer l'intervention et calculer la pénalité automatiquement
        const interventionResult = await query(`
          SELECT i.*, e.id as employe_id, e.nom, e.prenom
          FROM interventions i
          LEFT JOIN employes e ON (
            LOWER(e.prenom) = LOWER(i.prenom_technicien) AND 
            LOWER(e.nom) = LOWER(i.nom_technicien)
          )
          WHERE i.num_inter = $1
        `, [num_inter])

        if (interventionResult.rows.length === 0) {
          return NextResponse.json({ error: "Intervention non trouvée" }, { status: 404 })
        }

        const intervention = interventionResult.rows[0]
        
        if (!intervention.employe_id) {
          return NextResponse.json({ 
            error: `Technicien non trouvé: ${intervention.prenom_technicien} ${intervention.nom_technicien}` 
          }, { status: 404 })
        }

        finalEmployeId = intervention.employe_id

        // Calculer le délai de clôture
        const dateRdv = new Date(intervention.date_rdv)
        const dateCloture = new Date(intervention.cloture_tech || intervention.cloture_hotline)
        
        if (!dateCloture || isNaN(dateCloture.getTime())) {
          return NextResponse.json({ 
            error: "Date de clôture non trouvée pour cette intervention" 
          }, { status: 400 })
        }

        const delaiJours = Math.ceil((dateCloture.getTime() - dateRdv.getTime()) / (1000 * 60 * 60 * 24))
        
        // Calculer le montant selon les règles
        if (delaiJours === 1) {
          finalMontant = 60
          finalMotif = `Dossier clôturé à J+1 (${delaiJours} jour de retard)`
        } else if (delaiJours > 1) {
          finalMontant = 140
          finalMotif = `Dossier clôturé à J+${delaiJours} (${delaiJours} jours de retard)`
        } else {
          return NextResponse.json({ 
            error: "Cette intervention a été clôturée dans les délais" 
          }, { status: 400 })
        }

        // Vérifier si une pénalité existe déjà pour cette intervention
        const existingPenalty = await query(
          'SELECT id FROM penalites WHERE intervention_concernee = $1 AND type_penalite = $2',
          [intervention.id, 'dossier_non_cloture']
        )
        
        if (existingPenalty.rows.length > 0) {
          return NextResponse.json({ 
            error: "Une pénalité existe déjà pour cette intervention" 
          }, { status: 400 })
        }

        intervention_concernee = intervention.id
        type_penalite = 'dossier_non_cloture'

      } catch (error) {
        console.error("Erreur calcul automatique pénalité:", error)
        return NextResponse.json({ 
          error: "Erreur lors du calcul automatique de la pénalité" 
        }, { status: 500 })
      }
    }

    // Générer un numéro de pénalité si non fourni
    let numeroPenalite = numero_penalite
    if (!numeroPenalite) {
      const countResult = await query('SELECT COUNT(*) as count FROM penalites')
      const count = parseInt(countResult.rows[0].count) + 1
      numeroPenalite = `PEN-${new Date().getFullYear()}-${count.toString().padStart(4, '0')}`
    }

    // Vérifier si la pénalité existe déjà
    const existing = await query(
      'SELECT id FROM penalites WHERE numero_penalite = $1',
      [numeroPenalite]
    )
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Une pénalité avec ce numéro existe déjà" }, { status: 400 })
    }

    // Nettoyer les données : convertir les chaînes vides en null pour les champs entiers
    const cleanedData = {
      employe_id: finalEmployeId === '' ? null : finalEmployeId,
      montant: finalMontant === '' ? null : finalMontant,
      intervention_concernee: intervention_concernee === '' ? null : intervention_concernee,
      reclamation_concernee: reclamation_concernee === '' ? null : reclamation_concernee,
      materiel_concerne: materiel_concerne === '' ? null : materiel_concerne
    }

    const insertQuery = `
      INSERT INTO penalites (
        numero_penalite, employe_id, type_penalite, motif, montant,
        manager_approbateur, commentaires, intervention_concernee,
        reclamation_concernee, materiel_concerne, date_attribution
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      ) RETURNING *
    `

    const values = [
      numeroPenalite, cleanedData.employe_id, type_penalite, finalMotif, cleanedData.montant,
      manager_approbateur, commentaires, cleanedData.intervention_concernee,
      cleanedData.reclamation_concernee, cleanedData.materiel_concerne, date_attribution
    ]

    const result = await query(insertQuery, values)
    
    // Mettre à jour le total des pénalités de l'employé
    await query(`
      UPDATE employes 
      SET penalites_total = (
        SELECT COALESCE(SUM(montant), 0) 
        FROM penalites 
        WHERE employe_id = $1
      )
      WHERE id = $1
    `, [cleanedData.employe_id])
    
    // Envoyer une notification au technicien
    if (cleanedData.employe_id) {
      try {
        const penaliteData = {
          numero_penalite: numeroPenalite,
          montant: cleanedData.montant,
          motif: finalMotif,
          type_penalite: type_penalite,
          date_attribution: result.rows[0].date_attribution
        }
        
        // 1. Notification Socket.IO (pour l'interface web)
        const socketNotificationSent = sendPenaliteNotification(cleanedData.employe_id, penaliteData)
        console.log(`📨 Notification Socket.IO pénalité: ${socketNotificationSent ? 'OUI' : 'NON'}`)
        
        // 2. Notification Push (pour l'écran de verrouillage mobile)
        try {
          const pushSubscriptions = await query(
            'SELECT endpoint, p256dh_key, auth_key FROM push_subscriptions WHERE employee_id = $1',
            [cleanedData.employe_id]
          )
          
          if (pushSubscriptions.rows.length > 0) {
            const payload = JSON.stringify({
              title: '💰 Nouvelle Pénalité',
              body: `Pénalité de ${cleanedData.montant}€ - ${finalMotif}`,
              icon: '/placeholder-logo.png',
              badge: '/placeholder-logo.png',
              tag: 'penalite-notification',
              requireInteraction: true,
              data: {
                type: 'penalite',
                numero_penalite: numeroPenalite,
                montant: cleanedData.montant,
                url: '/technicien/dashboard'
              }
            })
            
            // Envoyer à toutes les souscriptions de l'employé
            for (const sub of pushSubscriptions.rows) {
              try {
                const pushSubscription = {
                  endpoint: sub.endpoint,
                  keys: {
                    p256dh: sub.p256dh_key,
                    auth: sub.auth_key
                  }
                }
                
                await webpush.sendNotification(pushSubscription, payload)
                console.log(`📱 Notification push envoyée à ${sub.endpoint}`)
              } catch (pushError) {
                console.error(`❌ Erreur push notification:`, pushError)
              }
            }
          } else {
            console.log(`⚠️ Aucune souscription push trouvée pour l'employé ${cleanedData.employe_id}`)
          }
        } catch (pushError) {
          console.error('❌ Erreur envoi notifications push:', pushError)
        }
        
      } catch (notificationError) {
        console.error('❌ Erreur envoi notification pénalité:', notificationError)
      }
    }
    
    return NextResponse.json({
      success: true,
      penalite: result.rows[0]
    })
  } catch (error) {
    console.error("Erreur API pénalités POST:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updateData } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID pénalité requis" }, { status: 400 })
    }

    // Filtrer les champs à mettre à jour
    const fields = Object.keys(updateData).filter(key => updateData[key] !== undefined)
    
    if (fields.length === 0) {
      return NextResponse.json({ error: "Aucune donnée à mettre à jour" }, { status: 400 })
    }

    // Construire la requête SQL
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ')
    const values = [id, ...fields.map(field => updateData[field])]

    const updateQuery = `
      UPDATE penalites 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `

    const result = await query(updateQuery, values)
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Pénalité non trouvée" }, { status: 404 })
    }

    // Mettre à jour le total des pénalités de l'employé si le montant a changé
    if (updateData.montant !== undefined) {
      const employeId = result.rows[0].employe_id
      await query(`
        UPDATE employes 
        SET penalites_total = (
          SELECT COALESCE(SUM(montant), 0) 
          FROM penalites 
          WHERE employe_id = $1
        )
        WHERE id = $1
      `, [employeId])
    }

    return NextResponse.json({
      success: true,
      penalite: result.rows[0]
    })
  } catch (error) {
    console.error("Erreur API pénalités PUT:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "ID pénalité requis" }, { status: 400 })
    }

    // Récupérer l'employé_id avant suppression
    const employeResult = await query('SELECT employe_id FROM penalites WHERE id = $1', [id])
    if (employeResult.rows.length === 0) {
      return NextResponse.json({ error: "Pénalité non trouvée" }, { status: 404 })
    }

    const employeId = employeResult.rows[0].employe_id

    const result = await query('DELETE FROM penalites WHERE id = $1 RETURNING *', [id])
    
    // Mettre à jour le total des pénalités de l'employé
    await query(`
      UPDATE employes 
      SET penalites_total = (
        SELECT COALESCE(SUM(montant), 0) 
        FROM penalites 
        WHERE employe_id = $1
      )
      WHERE id = $1
    `, [employeId])

    return NextResponse.json({
      success: true,
      message: "Pénalité supprimée avec succès"
    })
  } catch (error) {
    console.error("Erreur API pénalités DELETE:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
