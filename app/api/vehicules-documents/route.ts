import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const vehiculeId = formData.get('vehicule_id') as string
    const documentType = formData.get('document_type') as string // 'assurance' ou 'carte_grise'
    const pdfFile = formData.get('pdf_file') as File | null
    
    if (!vehiculeId || !documentType) {
      return NextResponse.json(
        { success: false, error: 'ID véhicule et type de document requis' },
        { status: 400 }
      )
    }
    
    if (!['assurance', 'carte_grise'].includes(documentType)) {
      return NextResponse.json(
        { success: false, error: 'Type de document invalide' },
        { status: 400 }
      )
    }
    
    if (!pdfFile || pdfFile.size === 0) {
      return NextResponse.json(
        { success: false, error: 'Fichier PDF requis' },
        { status: 400 }
      )
    }
    
    // Vérifier que c'est un PDF
    if (pdfFile.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'Le fichier doit être un PDF' },
        { status: 400 }
      )
    }
    
    // Limiter la taille à 10MB
    if (pdfFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Le fichier ne doit pas dépasser 10 Mo' },
        { status: 400 }
      )
    }
    
    // Créer le dossier uploads/vehicules-documents s'il n'existe pas
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'vehicules-documents')
    await mkdir(uploadDir, { recursive: true })
    
    // Générer un nom de fichier unique
    const timestamp = Date.now()
    const safeName = pdfFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${vehiculeId}_${documentType}_${timestamp}_${safeName}`
    const filePath = path.join(uploadDir, filename)
    
    // Sauvegarder le fichier
    const bytes = await pdfFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)
    
    // URL pour servir le fichier
    const pdfUrl = `/api/uploads/vehicules-documents/${filename}`
    
    // Mettre à jour la base de données
    const columnUrl = documentType === 'assurance' ? 'assurance_pdf_url' : 'carte_grise_pdf_url'
    const columnFilename = documentType === 'assurance' ? 'assurance_pdf_filename' : 'carte_grise_pdf_filename'
    
    await query(
      `UPDATE vehicules SET ${columnUrl} = $1, ${columnFilename} = $2, updated_at = NOW() WHERE id = $3`,
      [pdfUrl, pdfFile.name, vehiculeId]
    )
    
    return NextResponse.json({
      success: true,
      message: `Document ${documentType} uploadé avec succès`,
      pdf_url: pdfUrl,
      pdf_filename: pdfFile.name
    })
    
  } catch (error: any) {
    console.error('Erreur upload document véhicule:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vehiculeId = searchParams.get('vehicule_id')
    const documentType = searchParams.get('document_type')
    
    if (!vehiculeId || !documentType) {
      return NextResponse.json(
        { success: false, error: 'ID véhicule et type de document requis' },
        { status: 400 }
      )
    }
    
    const columnUrl = documentType === 'assurance' ? 'assurance_pdf_url' : 'carte_grise_pdf_url'
    const columnFilename = documentType === 'assurance' ? 'assurance_pdf_filename' : 'carte_grise_pdf_filename'
    
    await query(
      `UPDATE vehicules SET ${columnUrl} = NULL, ${columnFilename} = NULL, updated_at = NOW() WHERE id = $1`,
      [vehiculeId]
    )
    
    return NextResponse.json({
      success: true,
      message: `Document ${documentType} supprimé`
    })
    
  } catch (error: any) {
    console.error('Erreur suppression document véhicule:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
