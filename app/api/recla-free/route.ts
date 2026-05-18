import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

// Tarifs fixes par type de litige
const TARIFS_TECHNICIEN: Record<string, number> = {
  controleur: 30,
  client: 60,
}

function calcMontants(typeLitige: string, montantTotal: number) {
  const technicien = TARIFS_TECHNICIEN[typeLitige] ?? 0
  const entreprise = Math.max(0, montantTotal - technicien)
  return { montant_technicien: technicien, montant_entreprise: entreprise }
}

// Créer la table recla_free si elle n'existe pas
async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS recla_free (
      id SERIAL PRIMARY KEY,
      type_litige VARCHAR(50) NOT NULL DEFAULT 'client',
      reference_client VARCHAR(255),
      agence VARCHAR(255),
      date DATE,
      region VARCHAR(255),
      code_postal VARCHAR(20),
      nature_travaux VARCHAR(50) DEFAULT 'FIBRE',
      nature_travaux_detail VARCHAR(255),
      commentaire TEXT,
      status_ticket VARCHAR(50) DEFAULT 'pas_clos',
      date_retour DATE,
      montant DECIMAL(10,2) DEFAULT 0,
      montant_technicien DECIMAL(10,2) DEFAULT 0,
      montant_entreprise DECIMAL(10,2) DEFAULT 0,
      employe_id INTEGER REFERENCES employes(id) ON DELETE SET NULL,
      confirmer BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `)
  // Migration : ajouter les colonnes si elles n'existent pas encore
  await query(`ALTER TABLE recla_free ADD COLUMN IF NOT EXISTS montant_technicien DECIMAL(10,2) DEFAULT 0`)
  await query(`ALTER TABLE recla_free ADD COLUMN IF NOT EXISTS montant_entreprise DECIMAL(10,2) DEFAULT 0`)
  await query(`ALTER TABLE recla_free ADD COLUMN IF NOT EXISTS date_confirmation TIMESTAMP`)
  // Recalculer les lignes existantes sans montant_technicien renseigné
  await query(`
    UPDATE recla_free SET
      montant_technicien = CASE type_litige WHEN 'controleur' THEN 30 WHEN 'client' THEN 60 ELSE 0 END,
      montant_entreprise = GREATEST(0, montant - CASE type_litige WHEN 'controleur' THEN 30 WHEN 'client' THEN 60 ELSE 0 END)
    WHERE montant_technicien = 0 AND montant > 0
  `)
}

// GET - Lister les recla free avec filtres
export async function GET(request: NextRequest) {
  try {
    await ensureTable()

    const { searchParams } = new URL(request.url)
    const employeId = searchParams.get('employe_id')
    const mois = searchParams.get('mois')
    const annee = searchParams.get('annee')
    const dateDebut = searchParams.get('date_debut')
    const dateFin = searchParams.get('date_fin')
    const confirmer = searchParams.get('confirmer')

    const conditions: string[] = []
    const params: any[] = []
    let idx = 1

    if (employeId) {
      conditions.push(`rf.employe_id = $${idx++}`)
      params.push(parseInt(employeId))
    }
    if (mois && annee) {
      conditions.push(`rf.date_confirmation IS NOT NULL`)
      conditions.push(`EXTRACT(MONTH FROM rf.date_confirmation) = $${idx++} AND EXTRACT(YEAR FROM rf.date_confirmation) = $${idx++}`)
      params.push(parseInt(mois), parseInt(annee))
    } else if (dateDebut && dateFin) {
      conditions.push(`rf.date_confirmation IS NOT NULL`)
      conditions.push(`rf.date_confirmation::date >= $${idx++}::date AND rf.date_confirmation::date <= $${idx++}::date`)
      params.push(dateDebut, dateFin)
    } else if (dateDebut) {
      conditions.push(`rf.date_confirmation IS NOT NULL`)
      conditions.push(`rf.date_confirmation::date >= $${idx++}::date`)
      params.push(dateDebut)
    }
    if (confirmer !== null && confirmer !== undefined && confirmer !== '') {
      conditions.push(`rf.confirmer = $${idx++}`)
      params.push(confirmer === 'true')
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const result = await query(`
      SELECT
        rf.*,
        e.nom as employe_nom,
        e.prenom as employe_prenom,
        e.matricule as employe_matricule
      FROM recla_free rf
      LEFT JOIN employes e ON rf.employe_id = e.id
      ${whereClause}
      ORDER BY rf.date_confirmation DESC NULLS LAST, rf.date DESC NULLS LAST, rf.created_at DESC
    `, params)

    return NextResponse.json({ success: true, reclaFree: result.rows, total: result.rows.length })
  } catch (error) {
    console.error("Erreur GET recla-free:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST - Créer une recla free
export async function POST(request: NextRequest) {
  try {
    await ensureTable()

    const body = await request.json()
    const {
      type_litige,
      reference_client,
      agence,
      date,
      region,
      code_postal,
      nature_travaux,
      nature_travaux_detail,
      commentaire,
      status_ticket,
      date_retour,
      montant,
      employe_id,
      confirmer,
    } = body

    // Validation
    if (!type_litige) {
      return NextResponse.json({ error: "Le type de litige est requis" }, { status: 400 })
    }

    const montantVal = parseFloat(montant) || 0
    const { montant_technicien, montant_entreprise } = calcMontants(type_litige, montantVal)

    const result = await query(`
      INSERT INTO recla_free (
        type_litige, reference_client, agence, date, region, code_postal,
        nature_travaux, nature_travaux_detail, commentaire, status_ticket,
        date_retour, montant, montant_technicien, montant_entreprise, employe_id, confirmer
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *
    `, [
      type_litige,
      reference_client || null,
      agence || null,
      date || null,
      region || null,
      code_postal || null,
      nature_travaux || 'FIBRE',
      nature_travaux_detail || null,
      commentaire || null,
      status_ticket || 'pas_clos',
      date_retour || null,
      montantVal,
      montant_technicien,
      montant_entreprise,
      employe_id ? parseInt(employe_id) : null,
      confirmer === true || confirmer === 'true' ? true : false,
    ])

    return NextResponse.json({ success: true, reclaFree: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error("Erreur POST recla-free:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// PUT - Modifier une recla free
export async function PUT(request: NextRequest) {
  try {
    await ensureTable()

    const body = await request.json()
    const { id, ...fields } = body

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    const allowedFields = [
      'type_litige', 'reference_client', 'agence', 'date', 'region',
      'code_postal', 'nature_travaux', 'nature_travaux_detail', 'commentaire',
      'status_ticket', 'date_retour', 'montant', 'employe_id', 'confirmer',
    ]

    const updates: string[] = []
    const params: any[] = []
    let idx = 1

    for (const key of allowedFields) {
      if (key in fields) {
        let val = fields[key]
        if (key === 'montant') val = parseFloat(val) || 0
        if (key === 'employe_id') val = val ? parseInt(val) : null
        if (key === 'confirmer') val = val === true || val === 'true'
        if ((key === 'date' || key === 'date_retour') && val === '') val = null
        updates.push(`${key} = $${idx++}`)
        params.push(val)
        // Mettre à jour date_confirmation automatiquement
        if (key === 'confirmer') {
          if (val === true) {
            updates.push(`date_confirmation = NOW()`)
          } else {
            updates.push(`date_confirmation = NULL`)
          }
        }
      }
    }

    // Recalculer montant_technicien et montant_entreprise si montant ou type_litige change
    if ('montant' in fields || 'type_litige' in fields) {
      // Récupérer les valeurs actuelles pour compléter le calcul
      const currentRes = await query(`SELECT type_litige, montant FROM recla_free WHERE id = $1`, [parseInt(id)])
      if (currentRes.rows.length > 0) {
        const current = currentRes.rows[0]
        const typeLitige = fields.type_litige ?? current.type_litige
        const montantVal = 'montant' in fields ? (parseFloat(fields.montant) || 0) : parseFloat(current.montant)
        const { montant_technicien, montant_entreprise } = calcMontants(typeLitige, montantVal)
        updates.push(`montant_technicien = $${idx++}`)
        params.push(montant_technicien)
        updates.push(`montant_entreprise = $${idx++}`)
        params.push(montant_entreprise)
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "Aucun champ à mettre à jour" }, { status: 400 })
    }

    updates.push(`updated_at = NOW()`)
    params.push(parseInt(id))

    const result = await query(
      `UPDATE recla_free SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Recla Free non trouvée" }, { status: 404 })
    }

    return NextResponse.json({ success: true, reclaFree: result.rows[0] })
  } catch (error) {
    console.error("Erreur PUT recla-free:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// DELETE - Supprimer une recla free
export async function DELETE(request: NextRequest) {
  try {
    await ensureTable()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    const result = await query(
      `DELETE FROM recla_free WHERE id = $1 RETURNING id`,
      [parseInt(id)]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Recla Free non trouvée" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Recla Free supprimée" })
  } catch (error) {
    console.error("Erreur DELETE recla-free:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
