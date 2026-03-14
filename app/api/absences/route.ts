import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

// GET - Récupérer les absences avec filtres
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employe_id = searchParams.get('employe_id')
    const mois = searchParams.get('mois')
    const annee = searchParams.get('annee')
    const statut = searchParams.get('statut')
    const type = searchParams.get('type') // 'demandes' pour les demandes en attente

    let whereClause = 'WHERE 1=1'
    const params: any[] = []
    let paramIndex = 1

    if (employe_id) {
      whereClause += ` AND a.employe_id = $${paramIndex}`
      params.push(parseInt(employe_id))
      paramIndex++
    }

    if (statut) {
      whereClause += ` AND a.statut = $${paramIndex}`
      params.push(statut)
      paramIndex++
    }

    if (type === 'demandes') {
      whereClause += ` AND a.statut = 'en_attente'`
    }

    // Filtre par mois/année - inclure les absences qui chevauchent le mois
    if (mois && annee) {
      const debut = `${annee}-${String(mois).padStart(2, '0')}-01`
      const finMois = new Date(parseInt(annee), parseInt(mois), 0).getDate()
      const fin = `${annee}-${String(mois).padStart(2, '0')}-${finMois}`
      whereClause += ` AND a.date_debut <= $${paramIndex} AND a.date_fin >= $${paramIndex + 1}`
      params.push(fin, debut)
      paramIndex += 2
    } else if (annee) {
      whereClause += ` AND (EXTRACT(YEAR FROM a.date_debut) = $${paramIndex} OR EXTRACT(YEAR FROM a.date_fin) = $${paramIndex})`
      params.push(parseInt(annee))
      paramIndex++
    }

    const result = await query(`
      SELECT 
        a.*,
        e.matricule,
        e.poste,
        e.departement
      FROM absences a
      LEFT JOIN employes e ON a.employe_id = e.id
      ${whereClause}
      ORDER BY a.created_at DESC
    `, params)

    return NextResponse.json({
      success: true,
      absences: result.rows,
      total: result.rows.length
    })

  } catch (error) {
    console.error("Erreur GET absences:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST - Créer une absence (demande technicien ou création directe admin)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const {
      employe_id,
      nom,
      prenom,
      date_debut,
      date_fin,
      type_absence = 'conge',
      motif,
      demande_par = 'technicien',
      approuve_par,
      commentaire_admin
    } = data

    if (!nom || !prenom || !date_debut || !date_fin) {
      return NextResponse.json({ error: "Champs obligatoires manquants (nom, prenom, date_debut, date_fin)" }, { status: 400 })
    }

    // Vérifier que date_fin >= date_debut
    if (new Date(date_fin) < new Date(date_debut)) {
      return NextResponse.json({ error: "La date de fin doit être après la date de début" }, { status: 400 })
    }

    // Couleur par défaut selon le type
    const couleurMap: Record<string, string> = {
      'conge': '#3B82F6',
      'maladie': '#EF4444',
      'sans_solde': '#F59E0B',
      'formation': '#8B5CF6',
      'autre': '#6B7280'
    }
    const couleur = couleurMap[type_absence] || '#3B82F6'

    // Si créé par admin, statut = 'directe' (pas besoin d'approbation)
    // Si demande tech, statut = 'en_attente'
    const statut = demande_par === 'admin' ? 'directe' : 'en_attente'

    const result = await query(`
      INSERT INTO absences (employe_id, nom, prenom, date_debut, date_fin, type_absence, motif, statut, demande_par, approuve_par, commentaire_admin, couleur)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [employe_id, nom, prenom, date_debut, date_fin, type_absence, motif || null, statut, demande_par, approuve_par || null, commentaire_admin || null, couleur])

    return NextResponse.json({
      success: true,
      absence: result.rows[0]
    })

  } catch (error) {
    console.error("Erreur POST absences:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// PUT - Modifier une absence (approuver/refuser ou modifier)
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { id, ...updateData } = data

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    // Si c'est une action d'approbation/refus
    if (updateData.action === 'approuver' || updateData.action === 'refuser') {
      const newStatut = updateData.action === 'approuver' ? 'approuvee' : 'refusee'
      
      const result = await query(`
        UPDATE absences 
        SET statut = $1, 
            commentaire_admin = $2,
            approuve_par = $3,
            date_decision = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `, [newStatut, updateData.commentaire_admin || null, updateData.approuve_par || null, id])

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Absence non trouvée" }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        absence: result.rows[0]
      })
    }

    // Mise à jour générale
    const updateFields: string[] = []
    const params: any[] = []
    let paramIndex = 1

    const allowedFields = ['nom', 'prenom', 'date_debut', 'date_fin', 'type_absence', 'motif', 'statut', 'commentaire_admin', 'couleur', 'employe_id']
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`)
        params.push(updateData[field])
        paramIndex++
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "Aucun champ à mettre à jour" }, { status: 400 })
    }

    params.push(id)
    const result = await query(`
      UPDATE absences 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `, params)

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Absence non trouvée" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      absence: result.rows[0]
    })

  } catch (error) {
    console.error("Erreur PUT absences:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// DELETE - Supprimer une absence
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    const result = await query('DELETE FROM absences WHERE id = $1 RETURNING *', [parseInt(id)])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Absence non trouvée" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Absence supprimée"
    })

  } catch (error) {
    console.error("Erreur DELETE absences:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
