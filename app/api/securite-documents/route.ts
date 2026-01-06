import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

// GET - Récupérer les documents (avec filtres optionnels)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categorieId = searchParams.get('categorie_id')
    const technicienId = searchParams.get('technicien_id')
    const globalOnly = searchParams.get('global_only')

    let queryText = `
      SELECT sd.*, 
             sc.nom as categorie_nom,
             ta.username as technicien_username,
             e.nom as technicien_nom,
             e.prenom as technicien_prenom
      FROM securite_documents sd
      JOIN securite_categories sc ON sd.categorie_id = sc.id
      LEFT JOIN technicien_accounts ta ON sd.technicien_account_id = ta.id
      LEFT JOIN employes e ON ta.technicien_id = e.id
      WHERE 1=1
    `
    const params: any[] = []
    let paramIndex = 1

    if (categorieId) {
      queryText += ` AND sd.categorie_id = $${paramIndex}`
      params.push(categorieId)
      paramIndex++
    }

    if (technicienId) {
      // Documents du technicien + documents globaux
      queryText += ` AND (sd.technicien_account_id = $${paramIndex} OR sd.est_global = true)`
      params.push(technicienId)
      paramIndex++
    }

    if (globalOnly === 'true') {
      queryText += ` AND sd.est_global = true`
    }

    queryText += ` ORDER BY sc.ordre ASC, sd.created_at DESC`

    const result = await query(queryText, params)

    return NextResponse.json({
      success: true,
      documents: result.rows
    })
  } catch (error: any) {
    console.error('Erreur récupération documents sécurité:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST - Uploader un nouveau document
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const categorieId = formData.get('categorie_id') as string
    const technicienAccountId = formData.get('technicien_account_id') as string | null
    const nom = formData.get('nom') as string
    const description = formData.get('description') as string | null
    const dateExpiration = formData.get('date_expiration') as string | null
    const estGlobal = formData.get('est_global') === 'true'
    const fichier = formData.get('fichier') as File

    if (!categorieId || !nom || !fichier) {
      return NextResponse.json(
        { success: false, error: 'Catégorie, nom et fichier requis' },
        { status: 400 }
      )
    }

    // Créer le dossier si nécessaire
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'securite-documents')
    await mkdir(uploadDir, { recursive: true })

    // Générer un nom unique pour le fichier
    const timestamp = Date.now()
    const ext = path.extname(fichier.name)
    const safeFileName = `${categorieId}_${technicienAccountId || 'global'}_${timestamp}${ext}`
    const filePath = path.join(uploadDir, safeFileName)

    // Sauvegarder le fichier
    const bytes = await fichier.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    const fichierUrl = `/uploads/securite-documents/${safeFileName}`

    // Insérer en base
    const result = await query(
      `INSERT INTO securite_documents 
       (categorie_id, technicien_account_id, nom, description, fichier_url, fichier_nom, fichier_type, fichier_taille, date_expiration, est_global)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        categorieId,
        estGlobal ? null : (technicienAccountId || null),
        nom,
        description,
        fichierUrl,
        fichier.name,
        fichier.type,
        fichier.size,
        dateExpiration || null,
        estGlobal
      ]
    )

    return NextResponse.json({
      success: true,
      document: result.rows[0]
    })
  } catch (error: any) {
    console.error('Erreur upload document sécurité:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un document
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID du document requis' },
        { status: 400 }
      )
    }

    // Récupérer le chemin du fichier avant suppression
    const docResult = await query('SELECT fichier_url FROM securite_documents WHERE id = $1', [id])
    
    if (docResult.rows.length > 0) {
      const fichierUrl = docResult.rows[0].fichier_url
      const filePath = path.join(process.cwd(), 'public', fichierUrl)
      
      // Supprimer le fichier physique
      try {
        await unlink(filePath)
      } catch (e) {
        console.warn('Fichier non trouvé:', filePath)
      }
    }

    // Supprimer de la base
    await query('DELETE FROM securite_documents WHERE id = $1', [id])

    return NextResponse.json({
      success: true,
      message: 'Document supprimé'
    })
  } catch (error: any) {
    console.error('Erreur suppression document sécurité:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
