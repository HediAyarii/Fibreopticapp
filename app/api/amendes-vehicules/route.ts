import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vehicule_id = searchParams.get('vehicule_id')
    const employe_id = searchParams.get('employe_id')
    
    let queryText = `
      SELECT av.*, 
             v.matricule, v.marque, v.modele,
             e.nom as employe_nom, e.prenom as employe_prenom
      FROM amendes_vehicules av
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
    
    queryText += ' ORDER BY av.date_amende DESC'
    
    const result = await query(queryText, params)
    
    return NextResponse.json({
      success: true,
      amendes: result.rows
    })
  } catch (error: any) {
    console.error('Erreur lors de la récupération des amendes:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const vehicule_id = formData.get('vehicule_id')
    const employe_id = formData.get('employe_id') || null
    const date_amende = formData.get('date_amende')
    const date_infraction = formData.get('date_infraction') || null
    const numero_amende = formData.get('numero_amende') || null
    const type_infraction = formData.get('type_infraction')
    const lieu_infraction = formData.get('lieu_infraction') || null
    const montant = formData.get('montant')
    const description = formData.get('description') || null
    const created_by = formData.get('created_by') || null
    
    // Gérer l'upload du PDF
    let pdf_url = null
    let pdf_filename = null
    const pdfFile = formData.get('pdf_file') as File | null
    
    if (pdfFile && pdfFile.size > 0) {
      const bytes = await pdfFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      // Créer le dossier uploads/amendes s'il n'existe pas
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'amendes')
      await mkdir(uploadDir, { recursive: true })
      
      // Générer un nom de fichier unique
      const timestamp = Date.now()
      const safeName = pdfFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      pdf_filename = `${timestamp}_${safeName}`
      const filePath = path.join(uploadDir, pdf_filename)
      
      await writeFile(filePath, buffer)
      // Utiliser la route API pour servir les fichiers (fonctionne en production)
      pdf_url = `/api/uploads/amendes/${pdf_filename}`
    }

    const result = await query(
      `INSERT INTO amendes_vehicules (
        vehicule_id, employe_id, date_amende, date_infraction, numero_amende,
        type_infraction, lieu_infraction, montant, description,
        pdf_url, pdf_filename, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        vehicule_id,
        employe_id,
        date_amende,
        date_infraction,
        numero_amende,
        type_infraction,
        lieu_infraction,
        montant,
        description,
        pdf_url,
        pdf_filename,
        created_by
      ]
    )

    return NextResponse.json({
      success: true,
      amende: result.rows[0]
    })
  } catch (error: any) {
    console.error('Erreur lors de la création de l\'amende:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const id = formData.get('id')
    const vehicule_id = formData.get('vehicule_id')
    const employe_id = formData.get('employe_id') || null
    const date_amende = formData.get('date_amende')
    const date_infraction = formData.get('date_infraction') || null
    const numero_amende = formData.get('numero_amende') || null
    const type_infraction = formData.get('type_infraction')
    const lieu_infraction = formData.get('lieu_infraction') || null
    const montant = formData.get('montant')
    const description = formData.get('description') || null
    
    // Récupérer l'ancien PDF si besoin
    let pdf_url = formData.get('existing_pdf_url') as string || null
    let pdf_filename = formData.get('existing_pdf_filename') as string || null
    
    // Gérer l'upload d'un nouveau PDF
    const pdfFile = formData.get('pdf_file') as File | null
    
    if (pdfFile && pdfFile.size > 0) {
      const bytes = await pdfFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'amendes')
      await mkdir(uploadDir, { recursive: true })
      
      const timestamp = Date.now()
      const safeName = pdfFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      pdf_filename = `${timestamp}_${safeName}`
      const filePath = path.join(uploadDir, pdf_filename)
      
      await writeFile(filePath, buffer)
      // Utiliser la route API pour servir les fichiers (fonctionne en production)
      pdf_url = `/api/uploads/amendes/${pdf_filename}`
    }

    const result = await query(
      `UPDATE amendes_vehicules SET
        vehicule_id = $1,
        employe_id = $2,
        date_amende = $3,
        date_infraction = $4,
        numero_amende = $5,
        type_infraction = $6,
        lieu_infraction = $7,
        montant = $8,
        description = $9,
        pdf_url = $10,
        pdf_filename = $11,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *`,
      [
        vehicule_id,
        employe_id,
        date_amende,
        date_infraction,
        numero_amende,
        type_infraction,
        lieu_infraction,
        montant,
        description,
        pdf_url,
        pdf_filename,
        id
      ]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Amende non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      amende: result.rows[0]
    })
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de l\'amende:', error)
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

    const result = await query(
      'DELETE FROM amendes_vehicules WHERE id = $1 RETURNING *',
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Amende non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      deleted: result.rows[0]
    })
  } catch (error: any) {
    console.error('Erreur lors de la suppression de l\'amende:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
