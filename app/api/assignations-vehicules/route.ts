import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vehicule_id = searchParams.get('vehicule_id')
    const employe_id = searchParams.get('employe_id')
    const statut = searchParams.get('statut')
    
    let queryText = `
      SELECT av.*, 
             v.matricule, v.marque, v.modele, v.kilometrage as kilometrage_vehicule,
             e.nom as employe_nom, e.prenom as employe_prenom
      FROM assignations_vehicules av
      LEFT JOIN vehicules v ON av.vehicule_id = v.id
      LEFT JOIN employes e ON av.employe_id = e.id
      WHERE 1=1
    `
    let params: any[] = []
    let paramIndex = 1
    
    if (vehicule_id) {
      queryText += ` AND av.vehicule_id = $${paramIndex}`
      params.push(vehicule_id)
      paramIndex++
    }
    
    if (employe_id) {
      queryText += ` AND av.employe_id = $${paramIndex}`
      params.push(employe_id)
      paramIndex++
    }
    
    if (statut) {
      queryText += ` AND av.statut = $${paramIndex}`
      params.push(statut)
      paramIndex++
    }
    
    queryText += ' ORDER BY av.date_assignation DESC'
    
    const result = await query(queryText, params)
    
    return NextResponse.json({
      success: true,
      assignations: result.rows
    })
  } catch (error: any) {
    console.error('Erreur lors de la récupération des assignations:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      vehicule_id,
      employe_id,
      date_assignation,
      date_fin,
      kilometrage_debut,
      kilometrage_fin,
      statut,
      commentaires
    } = body

    // Vérifier que le véhicule n'est pas déjà assigné
    const checkResult = await query(
      'SELECT id FROM assignations_vehicules WHERE vehicule_id = $1 AND statut = $2',
      [vehicule_id, 'active']
    )

    if (checkResult.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Ce véhicule est déjà assigné à un technicien' },
        { status: 400 }
      )
    }

    const result = await query(
      `INSERT INTO assignations_vehicules (
        vehicule_id, employe_id, date_assignation, date_fin,
        kilometrage_debut, kilometrage_fin, statut, commentaires
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        vehicule_id, employe_id, date_assignation, date_fin,
        kilometrage_debut, kilometrage_fin, statut || 'active', commentaires
      ]
    )

    // Mettre à jour le statut du véhicule
    await query(
      'UPDATE vehicules SET statut = $1 WHERE id = $2',
      ['en_service', vehicule_id]
    )

    return NextResponse.json({
      success: true,
      assignation: result.rows[0]
    })
  } catch (error: any) {
    console.error('Erreur lors de la création de l\'assignation:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      vehicule_id,
      employe_id,
      date_assignation,
      date_fin,
      kilometrage_debut,
      kilometrage_fin,
      statut,
      commentaires
    } = body

    const result = await query(
      `UPDATE assignations_vehicules SET
        vehicule_id = $1, employe_id = $2, date_assignation = $3, date_fin = $4,
        kilometrage_debut = $5, kilometrage_fin = $6, statut = $7, commentaires = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *`,
      [
        vehicule_id, employe_id, date_assignation, date_fin,
        kilometrage_debut, kilometrage_fin, statut, commentaires, id
      ]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Assignation non trouvée' },
        { status: 404 }
      )
    }

    // Si l'assignation est terminée, remettre le véhicule disponible et mettre à jour le KM
    if (statut === 'terminee') {
      const kmFinal = kilometrage_fin || result.rows[0].kilometrage_fin || result.rows[0].kilometrage_debut
      
      console.log('🚗 Arrêt assignation - Mise à jour KM véhicule:', {
        vehicule_id,
        kilometrage_fin,
        km_from_result: result.rows[0].kilometrage_fin,
        km_final_used: kmFinal
      })
      
      await query(
        `UPDATE vehicules 
         SET statut = $1, 
             kilometrage = $2,
             km_actuel = $2,
             derniere_maj_km = CURRENT_DATE
         WHERE id = $3`,
        ['disponible', kmFinal, vehicule_id]
      )
      
      // Mettre le KM de début de la prochaine assignation si elle existe
      const nextAssignation = await query(
        `SELECT id FROM assignations_vehicules 
         WHERE vehicule_id = $1 
         AND date_assignation > $2
         ORDER BY date_assignation ASC 
         LIMIT 1`,
        [vehicule_id, date_assignation]
      )
      
      if (nextAssignation.rows.length > 0) {
        console.log('🔄 Cascade KM à la prochaine assignation:', {
          next_assignation_id: nextAssignation.rows[0].id,
          km_debut: kmFinal
        })
        
        await query(
          `UPDATE assignations_vehicules 
           SET km_debut = $1, km_actuel = $1
           WHERE id = $2`,
          [kmFinal, nextAssignation.rows[0].id]
        )
      }
    }

    return NextResponse.json({
      success: true,
      assignation: result.rows[0]
    })
  } catch (error: any) {
    console.error('Erreur lors de la modification de l\'assignation:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requis' },
        { status: 400 }
      )
    }

    // Récupérer l'assignation avant de la supprimer
    const assignationResult = await query(
      'SELECT vehicule_id FROM assignations_vehicules WHERE id = $1',
      [id]
    )

    if (assignationResult.rows.length > 0) {
      // Remettre le véhicule disponible
      await query(
        'UPDATE vehicules SET statut = $1 WHERE id = $2',
        ['disponible', assignationResult.rows[0].vehicule_id]
      )
    }

    await query('DELETE FROM assignations_vehicules WHERE id = $1', [id])

    return NextResponse.json({
      success: true,
      message: 'Assignation supprimée avec succès'
    })
  } catch (error: any) {
    console.error('Erreur lors de la suppression de l\'assignation:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
