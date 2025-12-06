import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename
    const filepath = join(process.cwd(), 'public', 'uploads', 'vehicules', filename)
    
    // Vérifier si le fichier existe
    if (!existsSync(filepath)) {
      console.log(`❌ Image non trouvée: ${filepath}`)
      return NextResponse.json({ error: 'Image non trouvée' }, { status: 404 })
    }

    // Lire le fichier
    const fileBuffer = await readFile(filepath)
    
    // Déterminer le type MIME basé sur l'extension
    const ext = filename.split('.').pop()?.toLowerCase()
    let contentType = 'image/jpeg'
    
    if (ext === 'png') contentType = 'image/png'
    else if (ext === 'gif') contentType = 'image/gif'
    else if (ext === 'webp') contentType = 'image/webp'
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('❌ Erreur chargement image:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
