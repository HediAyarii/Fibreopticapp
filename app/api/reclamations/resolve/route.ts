import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { addNoCacheHeaders } from '@/lib/cache-headers'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const reclamationId = formData.get('reclamation_id') as string
    const comment = formData.get('comment') as string
    const resolvedBy = formData.get('resolved_by') as string

    if (!reclamationId || !resolvedBy) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Vérifier que la réclamation existe
    const reclamationResult = await query(
      'SELECT * FROM reclamations WHERE id = $1',
      [parseInt(reclamationId)]
    )

    if (reclamationResult.rows.length === 0) {
      return NextResponse.json({ error: 'Réclamation non trouvée' }, { status: 404 })
    }

    // Traiter les photos et les stocker en base
    const photoIds: number[] = []
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
        const filename = `${timestamp}-${photo.name}`
        const filepath = join(uploadDir, filename)
        
        // Sauvegarder le fichier
        await writeFile(filepath, buffer)
        
        // Stocker le chemin en base de données
        const result = await query(`
          INSERT INTO reclamation_photos (reclamation_id, photo_path, photo_name, mime_type, file_size, uploaded_by)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `, [
          parseInt(reclamationId),
          `/uploads/reclamations/${filename}`,
          photo.name,
          photo.type,
          photo.size,
          parseInt(resolvedBy)
        ])
        
        photoIds.push(result.rows[0].id)
      }
      
      photoIndex++
    }

    if (photoIds.length === 0) {
      return NextResponse.json({ error: 'Au moins une photo justificative est requise' }, { status: 400 })
    }

    // Mettre à jour la réclamation avec les colonnes existantes
    // Le technicien marque comme "en_cours" en attendant validation admin
    await query(`
      UPDATE reclamations 
      SET 
        statut = 'en_cours',
        date_resolution = NOW(),
        commentaires_internes = $1,
        description_solution = $2
      WHERE id = $3
    `, [
      comment || '',
      `Photos justificatives: ${photoIds.length} photo(s) stockée(s) en base`,
      parseInt(reclamationId)
    ])

    console.log(`✅ Réclamation ${reclamationId} marquée comme résolue par l'employé ${resolvedBy}`)

    const response = NextResponse.json({
      success: true,
      message: 'Réclamation marquée comme résolue avec succès',
      photos: photoIds
    })
    
    return addNoCacheHeaders(response)

  } catch (error) {
    console.error('Erreur résolution réclamation:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
