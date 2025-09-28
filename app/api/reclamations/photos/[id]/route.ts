import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const photoId = params.id

    if (!photoId || isNaN(Number(photoId))) {
      return NextResponse.json({ error: 'ID de photo invalide' }, { status: 400 })
    }

    // Récupérer l'image depuis la base de données
    const result = await query(`
      SELECT photo_data, photo_type, photo_name, photo_size
      FROM reclamation_photos 
      WHERE id = $1
    `, [photoId])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Photo non trouvée' }, { status: 404 })
    }

    const photo = result.rows[0]
    const imageBuffer = photo.photo_data

    // Retourner l'image avec les bons headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': photo.photo_type || 'image/jpeg',
        'Content-Length': photo.photo_size.toString(),
        'Cache-Control': 'public, max-age=31536000', // Cache pour 1 an
        'Content-Disposition': `inline; filename="${photo.photo_name}"`
      }
    })

  } catch (error) {
    console.error('Erreur récupération photo:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}





