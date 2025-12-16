import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

// Types MIME pour les fichiers courants
const MIME_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.txt': 'text/plain',
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Construire le chemin du fichier
    const filePath = params.path.join('/')
    const fullPath = path.join(process.cwd(), 'public', 'uploads', filePath)
    
    // Vérifier que le chemin ne remonte pas dans l'arborescence (sécurité)
    const normalizedPath = path.normalize(fullPath)
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    
    if (!normalizedPath.startsWith(uploadsDir)) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }
    
    // Vérifier que le fichier existe
    try {
      await stat(fullPath)
    } catch {
      return NextResponse.json(
        { error: 'Fichier non trouvé' },
        { status: 404 }
      )
    }
    
    // Lire le fichier
    const fileBuffer = await readFile(fullPath)
    
    // Déterminer le type MIME
    const ext = path.extname(fullPath).toLowerCase()
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'
    
    // Retourner le fichier
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': ext === '.pdf' ? 'inline' : `attachment; filename="${path.basename(fullPath)}"`,
      },
    })
  } catch (error: any) {
    console.error('Erreur lors de la lecture du fichier:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}
