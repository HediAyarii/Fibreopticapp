import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reclamationId = params.id

    if (!reclamationId || isNaN(Number(reclamationId))) {
      return NextResponse.json({ error: 'ID de réclamation invalide' }, { status: 400 })
    }

    // Récupérer toutes les photos de la réclamation
    const result = await query(`
      SELECT 
        id,
        photo_name,
        photo_type,
        photo_size,
        uploaded_by,
        uploaded_at
      FROM reclamation_photos 
      WHERE reclamation_id = $1
      ORDER BY uploaded_at ASC
    `, [parseInt(reclamationId)])

    const photos = result.rows.map(photo => ({
      id: photo.id,
      name: photo.photo_name,
      type: photo.photo_type,
      size: photo.photo_size,
      uploadedBy: photo.uploaded_by,
      uploadedAt: photo.uploaded_at,
      url: `/api/reclamations/photos/${photo.id}`
    }))

    return NextResponse.json({
      success: true,
      photos
    })

  } catch (error) {
    console.error('Erreur récupération photos réclamation:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

