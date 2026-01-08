import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { addNoCacheHeaders } from '@/lib/cache-headers'

export const dynamic = 'force-dynamic'

// Upload photos pour une réclamation existante
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const reclamationId = formData.get('reclamation_id') as string
    const uploadedBy = formData.get('uploaded_by') as string

    if (!reclamationId) {
      return NextResponse.json({ error: 'ID de réclamation manquant' }, { status: 400 })
    }

    // Vérifier que la réclamation existe
    const reclamationResult = await query(
      'SELECT * FROM reclamations WHERE id = $1',
      [parseInt(reclamationId)]
    )

    if (reclamationResult.rows.length === 0) {
      return NextResponse.json({ error: 'Réclamation non trouvée' }, { status: 404 })
    }

    // Traiter les photos et les stocker
    const photoIds: number[] = []
    const uploadedPhotos: any[] = []
    let photoIndex = 0
    
    while (formData.has(`photo_${photoIndex}`)) {
      const photo = formData.get(`photo_${photoIndex}`) as File
      
      if (photo && photo.size > 0) {
        const bytes = await photo.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        // Créer le dossier uploads s'il n'existe pas
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'reclamations')
        await mkdir(uploadDir, { recursive: true })
        
        // Générer un nom de fichier unique
        const timestamp = Date.now()
        const safeFileName = photo.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filename = `${timestamp}-${safeFileName}`
        const filepath = join(uploadDir, filename)
        
        // Sauvegarder le fichier
        await writeFile(filepath, buffer)
        
        // Le chemin pour accéder au fichier
        const photoPath = `/uploads/reclamations/${filename}`
        
        // Stocker le chemin en base de données
        const result = await query(`
          INSERT INTO reclamation_photos (reclamation_id, photo_path, photo_name, mime_type, file_size, uploaded_by)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, photo_name, photo_path, mime_type, file_size, uploaded_at
        `, [
          parseInt(reclamationId),
          photoPath,
          photo.name,
          photo.type,
          photo.size,
          uploadedBy ? parseInt(uploadedBy) : null
        ])
        
        const insertedPhoto = result.rows[0]
        photoIds.push(insertedPhoto.id)
        uploadedPhotos.push({
          id: insertedPhoto.id,
          name: insertedPhoto.photo_name,
          type: insertedPhoto.mime_type,
          size: insertedPhoto.file_size,
          uploadedAt: insertedPhoto.uploaded_at,
          url: insertedPhoto.photo_path
        })
      }
      
      photoIndex++
    }

    console.log(`✅ ${photoIds.length} photo(s) uploadée(s) pour la réclamation ${reclamationId}`)

    const response = NextResponse.json({
      success: true,
      message: `${photoIds.length} photo(s) uploadée(s) avec succès`,
      photos: uploadedPhotos
    })
    
    return addNoCacheHeaders(response)

  } catch (error) {
    console.error('Erreur upload photos réclamation:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de l\'upload des photos',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}
