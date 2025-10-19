import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// Types de documents disponibles
const DOCUMENT_TYPES = [
  { value: 'fiche_paie', label: 'Fiche de Paie' },
  { value: 'attestation_travail', label: 'Attestation de Travail' },
  { value: 'autre', label: 'Autre' }
]

// GET - Récupérer les documents administratifs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeId = searchParams.get('employe_id')
    const statut = searchParams.get('statut')
    const typeDocument = searchParams.get('type_document')

    let whereClause = 'WHERE 1=1'
    const queryParams: any[] = []
    let paramIndex = 1

    if (employeId) {
      whereClause += ` AND da.employe_id = $${paramIndex}`
      queryParams.push(employeId)
      paramIndex++
    }

    if (statut) {
      whereClause += ` AND da.statut = $${paramIndex}`
      queryParams.push(statut)
      paramIndex++
    }

    if (typeDocument) {
      whereClause += ` AND da.type_document = $${paramIndex}`
      queryParams.push(typeDocument)
      paramIndex++
    }

    const result = await query(`
      SELECT 
        da.id,
        da.employe_id,
        e.prenom,
        e.nom,
        e.matricule,
        da.type_document,
        da.statut,
        da.date_demande,
        da.date_traitement,
        da.commentaire_demande,
        da.commentaire_admin,
        da.fichier_jointe,
        da.chemin_fichier,
        da.taille_fichier,
        da.type_fichier,
        da.created_at,
        da.updated_at,
        CASE 
          WHEN da.statut = 'en_attente' THEN 'En attente'
          WHEN da.statut = 'traite' THEN 'Traité'
          WHEN da.statut = 'rejete' THEN 'Rejeté'
          ELSE da.statut
        END as statut_libelle,
        CASE 
          WHEN da.type_document = 'fiche_paie' THEN 'Fiche de Paie'
          WHEN da.type_document = 'attestation_travail' THEN 'Attestation de Travail'
          WHEN da.type_document LIKE 'autre:%' THEN 'Autre: ' || SUBSTRING(da.type_document FROM 7)
          WHEN da.type_document = 'autre' THEN 'Autre'
          ELSE da.type_document
        END as type_document_libelle
      FROM documents_administratifs da
      JOIN employes e ON da.employe_id = e.id
      ${whereClause}
      ORDER BY da.date_demande DESC
    `, queryParams)

    return NextResponse.json({
      success: true,
      documents: result.rows,
      types: DOCUMENT_TYPES
    })

  } catch (error) {
    console.error('Erreur GET documents administratifs:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer une nouvelle demande de document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employe_id, type_document, commentaire_demande, precision_autre } = body

    if (!employe_id || !type_document) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Si c'est "autre", on utilise la précision comme type_document
    const finalTypeDocument = type_document === 'autre' && precision_autre 
      ? `autre: ${precision_autre}` 
      : type_document

    const result = await query(`
      INSERT INTO documents_administratifs (employe_id, type_document, commentaire_demande)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [employe_id, finalTypeDocument, commentaire_demande || null])

    return NextResponse.json({
      success: true,
      document: result.rows[0],
      message: 'Demande de document créée avec succès'
    })

  } catch (error) {
    console.error('Erreur POST documents administratifs:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Mettre à jour un document (traitement par l'admin)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, statut, commentaire_admin, fichier_jointe, chemin_fichier, taille_fichier, type_fichier } = body

    if (!id || !statut) {
      return NextResponse.json({ error: 'ID et statut requis' }, { status: 400 })
    }

    const updateFields = ['statut = $2', 'date_traitement = CURRENT_TIMESTAMP']
    const queryParams = [id, statut]
    let paramIndex = 3

    if (commentaire_admin) {
      updateFields.push(`commentaire_admin = $${paramIndex}`)
      queryParams.push(commentaire_admin)
      paramIndex++
    }

    if (fichier_jointe) {
      updateFields.push(`fichier_jointe = $${paramIndex}`)
      queryParams.push(fichier_jointe)
      paramIndex++
    }

    if (chemin_fichier) {
      updateFields.push(`chemin_fichier = $${paramIndex}`)
      queryParams.push(chemin_fichier)
      paramIndex++
    }

    if (taille_fichier) {
      updateFields.push(`taille_fichier = $${paramIndex}`)
      queryParams.push(taille_fichier)
      paramIndex++
    }

    if (type_fichier) {
      updateFields.push(`type_fichier = $${paramIndex}`)
      queryParams.push(type_fichier)
      paramIndex++
    }

    const result = await query(`
      UPDATE documents_administratifs 
      SET ${updateFields.join(', ')}
      WHERE id = $1
      RETURNING *
    `, queryParams)

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      document: result.rows[0],
      message: 'Document mis à jour avec succès'
    })

  } catch (error) {
    console.error('Erreur PUT documents administratifs:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
