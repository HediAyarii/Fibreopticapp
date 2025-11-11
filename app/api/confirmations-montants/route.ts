import { type NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export const dynamic = 'force-dynamic';

/**
 * GET - Récupérer les confirmations
 * Query params: employe_id, mois, all (pour admin)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeId = searchParams.get('employe_id');
    const mois = searchParams.get('mois');
    const all = searchParams.get('all'); // Pour l'admin

    let sqlQuery = 'SELECT * FROM confirmations_montants';
    const params: any[] = [];
    const conditions: string[] = [];

    if (employeId && !all) {
      conditions.push(`employe_id = $${params.length + 1}`);
      params.push(parseInt(employeId));
    }

    if (mois) {
      conditions.push(`mois = $${params.length + 1}`);
      params.push(mois);
    }

    if (conditions.length > 0) {
      sqlQuery += ' WHERE ' + conditions.join(' AND ');
    }

    sqlQuery += ' ORDER BY date_confirmation DESC';

    const result = await query(sqlQuery, params);

    return NextResponse.json({
      success: true,
      confirmations: result.rows
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des confirmations:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST - Créer une confirmation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employe_id, matricule, mois, montant_confirme, details } = body;

    // Validation
    if (!employe_id || !mois || montant_confirme === undefined) {
      return NextResponse.json(
        { success: false, error: 'Données manquantes' },
        { status: 400 }
      );
    }

    // Vérifier si déjà confirmé pour ce mois
    const checkResult = await query(
      'SELECT id FROM confirmations_montants WHERE employe_id = $1 AND mois = $2',
      [employe_id, mois]
    );

    if (checkResult.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Ce mois a déjà été confirmé' },
        { status: 409 }
      );
    }

    // Insérer la confirmation
    const result = await query(
      `INSERT INTO confirmations_montants 
       (employe_id, matricule, mois, montant_confirme, details)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [employe_id, matricule, mois, montant_confirme, JSON.stringify(details)]
    );

    const confirmation = result.rows[0];

    console.log(`✅ Confirmation créée pour employé ${employe_id} - mois ${mois}`);

    return NextResponse.json({
      success: true,
      confirmation
    });
  } catch (error: any) {
    console.error('Erreur lors de la création de la confirmation:', error);
    
    // Gérer l'erreur de contrainte unique
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Ce mois a déjà été confirmé' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

/**
 * GET pour récupérer le statut de confirmation pour un mois spécifique
 * Utilisé pour vérifier si un technicien a déjà confirmé
 */
export async function HEAD(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeId = searchParams.get('employe_id');
    const mois = searchParams.get('mois');

    if (!employeId || !mois) {
      return new NextResponse(null, { status: 400 });
    }

    const result = await query(
      'SELECT id, date_confirmation FROM confirmations_montants WHERE employe_id = $1 AND mois = $2',
      [parseInt(employeId), mois]
    );

    if (result.rows.length > 0) {
      return new NextResponse(null, { 
        status: 200,
        headers: {
          'X-Confirmed': 'true',
          'X-Confirmation-Date': result.rows[0].date_confirmation
        }
      });
    }

    return new NextResponse(null, { status: 404 });
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    return new NextResponse(null, { status: 500 });
  }
}
