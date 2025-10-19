import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// Types de fichiers autorisés
const ALLOWED_TYPES = [
  'application/pdf',
  'text/csv',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]

// Taille maximale (10MB)
const MAX_SIZE = 10 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const documentId = formData.get('document_id') as string

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    if (!documentId) {
      return NextResponse.json({ error: 'ID du document requis' }, { status: 400 })
    }

    // Vérifier le type de fichier
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Type de fichier non autorisé. Types acceptés: PDF, CSV, JPG, PNG, GIF, Excel' 
      }, { status: 400 })
    }

    // Vérifier la taille
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ 
        error: 'Fichier trop volumineux. Taille maximale: 10MB' 
      }, { status: 400 })
    }

    // Créer le répertoire de stockage s'il n'existe pas
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'documents')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `document_${documentId}_${timestamp}.${fileExtension}`
    const filePath = join(uploadDir, fileName)

    // Convertir le fichier en buffer et l'écrire
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Retourner les informations du fichier
    return NextResponse.json({
      success: true,
      file: {
        name: fileName,
        originalName: file.name,
        path: `/uploads/documents/${fileName}`,
        size: file.size,
        type: file.type,
        extension: fileExtension
      },
      message: 'Fichier uploadé avec succès'
    })

  } catch (error) {
    console.error('Erreur upload document:', error)
    return NextResponse.json({ error: 'Erreur lors de l\'upload' }, { status: 500 })
  }
}

