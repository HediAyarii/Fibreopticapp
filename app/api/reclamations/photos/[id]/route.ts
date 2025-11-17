import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { readFile } from 'fs/promises'
import { join } from 'path'

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

    // Récupérer le chemin de l'image depuis la base de données
    const result = await query(`
      SELECT photo_path, mime_type, photo_name, file_size
      FROM reclamation_photos 
      WHERE id = $1
    `, [photoId])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Photo non trouvée' }, { status: 404 })
    }

    const photo = result.rows[0]
    
    if (!photo.photo_path) {
      console.error(`Photo ${photoId} n'a pas de photo_path`)
      return NextResponse.json({ error: 'Chemin de photo manquant' }, { status: 404 })
    }

    // Lire le fichier depuis le système de fichiers
    const filepath = join(process.cwd(), 'public', photo.photo_path)
    console.log('Tentative de lecture du fichier:', filepath)
    
    try {
      const imageBuffer = await readFile(filepath)

      // Retourner l'image avec les bons headers
      return new NextResponse(Buffer.from(imageBuffer), {
        status: 200,
        headers: {
          'Content-Type': photo.mime_type || 'image/jpeg',
          'Content-Length': photo.file_size?.toString() || imageBuffer.length.toString(),
          'Cache-Control': 'public, max-age=31536000',
          'Content-Disposition': `inline; filename="${photo.photo_name}"`
        }
      })
    } catch (fileError) {
      console.error('Erreur lecture fichier:', fileError)
      return NextResponse.json({ 
        error: 'Fichier photo non trouvé sur le serveur',
        path: photo.photo_path 
      }, { status: 404 })
    }

  } catch (error) {
    console.error('Erreur récupération photo:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}






















