import { type NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export const dynamic = 'force-dynamic';

// Importer les fonctions Socket.IO directement depuis le module
const socketio = require('../../../lib/socketio');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statut = searchParams.get('statut');
    const technicienId = searchParams.get('technicien_id');
    const nomTechnicien = searchParams.get('nom_technicien');
    const prenomTechnicien = searchParams.get('prenom_technicien');
    const typeReclamation = searchParams.get('type_reclamation');
    const dateDebut = searchParams.get('date_debut');
    const dateFin = searchParams.get('date_fin');

    let whereClauses: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;

    if (statut && statut !== 'all') {
      whereClauses.push(`statut = $${paramIndex}`);
      params.push(statut);
      paramIndex++;
    }

    if (technicienId) {
      whereClauses.push(`technicien_id = $${paramIndex}`);
      params.push(technicienId);
      paramIndex++;
    }

    if (nomTechnicien && prenomTechnicien) {
      whereClauses.push(`nom_technicien = $${paramIndex} AND prenom_technicien = $${paramIndex + 1}`);
      params.push(nomTechnicien, prenomTechnicien);
      paramIndex += 2;
    }

    if (typeReclamation && typeReclamation !== 'all') {
      whereClauses.push(`type_reclamation = $${paramIndex}`);
      params.push(typeReclamation);
      paramIndex++;
    }

    if (dateDebut) {
      whereClauses.push(`date_intervention >= $${paramIndex}::date`);
      params.push(dateDebut);
      paramIndex++;
    }

    if (dateFin) {
      whereClauses.push(`date_intervention <= $${paramIndex}::date`);
      params.push(dateFin);
      paramIndex++;
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sqlQuery = `
      SELECT 
        rt.*,
        i.articles,
        i.statut as intervention_statut,
        i.date_rdv as intervention_date_rdv
      FROM reclamations_techniques rt
      LEFT JOIN interventions i ON rt.num_inter = i.num_inter
      ${whereClause}
      ORDER BY 
        CASE rt.statut
          WHEN 'en_attente' THEN 1
          WHEN 'en_cours' THEN 2
          WHEN 'resolu' THEN 3
          WHEN 'rejete' THEN 4
        END,
        rt.date_creation DESC
    `;

    const result = await query(sqlQuery, params);

    return NextResponse.json({
      success: true,
      reclamations: result.rows
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des réclamations techniques:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      intervention_id,
      num_inter,
      technicien_id,
      nom_technicien,
      prenom_technicien,
      type_reclamation,
      description,
      date_intervention
    } = body;

    if (!num_inter || !type_reclamation || !description) {
      return NextResponse.json(
        { success: false, error: 'num_inter, type_reclamation et description sont requis' },
        { status: 400 }
      );
    }

    const sqlQuery = `
      INSERT INTO reclamations_techniques (
        intervention_id,
        num_inter,
        technicien_id,
        nom_technicien,
        prenom_technicien,
        type_reclamation,
        description,
        date_intervention,
        statut
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'en_attente')
      RETURNING *
    `;

    const result = await query(sqlQuery, [
      intervention_id || null,
      num_inter,
      technicien_id || null,
      nom_technicien || '',
      prenom_technicien || '',
      type_reclamation,
      description,
      date_intervention || null
    ]);

    const newReclamation = result.rows[0];

    // Émettre l'événement Socket.IO pour notification en temps réel
    try {
      socketio.sendReclamationTechniqueCreated(newReclamation);
      console.log('✅ Événement Socket.IO émis: reclamation_technique_created');
    } catch (socketError) {
      console.error('⚠️ Erreur émission Socket.IO:', socketError);
      // Ne pas bloquer la création même si Socket.IO échoue
    }

    return NextResponse.json({
      success: true,
      reclamation: newReclamation
    });
  } catch (error) {
    console.error('Erreur lors de la création de la réclamation technique:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, statut, reponse_admin } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de la réclamation requis' },
        { status: 400 }
      );
    }

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (statut) {
      updates.push(`statut = $${paramIndex}`);
      params.push(statut);
      paramIndex++;
    }

    if (reponse_admin !== undefined) {
      updates.push(`reponse_admin = $${paramIndex}`);
      params.push(reponse_admin);
      paramIndex++;
    }

    if (statut === 'resolu' || statut === 'rejete') {
      updates.push(`date_resolution = CURRENT_TIMESTAMP`);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Aucune mise à jour fournie' },
        { status: 400 }
      );
    }

    params.push(id);
    const sqlQuery = `
      UPDATE reclamations_techniques
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(sqlQuery, params);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Réclamation non trouvée' },
        { status: 404 }
      );
    }

    const updatedReclamation = result.rows[0];

    // Envoyer notification SSE au technicien si connecté
    if (updatedReclamation.employe_id) {
      try {
        const { sendToTechnicien } = await import('@/app/api/sse/technicien/route')
        sendToTechnicien(updatedReclamation.employe_id, 'reclamation_updated', {
          id: updatedReclamation.id,
          numero_reclamation: updatedReclamation.numero_reclamation,
          statut: updatedReclamation.statut,
          reponse_admin: updatedReclamation.reponse_admin,
          message: statut === 'resolu' 
            ? 'Votre réclamation a été résolue par l\'administration'
            : 'Votre réclamation a été mise à jour par l\'administration'
        })
        console.log('✅ Notification SSE envoyée au technicien')
      } catch (sseError) {
        console.log('⚠️ SSE non disponible:', sseError)
      }
    }

    // Émettre l'événement Socket.IO pour notification en temps réel
    try {
      socketio.sendReclamationTechniqueUpdated(updatedReclamation);
      console.log('✅ Événement Socket.IO émis: reclamation_technique_updated');
    } catch (socketError) {
      console.error('⚠️ Erreur émission Socket.IO:', socketError);
      // Ne pas bloquer la mise à jour même si Socket.IO échoue
    }

    return NextResponse.json({
      success: true,
      reclamation: updatedReclamation
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la réclamation technique:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
