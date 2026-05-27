import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

async function ensureFttoTable() {
  // Create table if it doesn't exist at all
  await query(`
    CREATE TABLE IF NOT EXISTS ftto_tickets (
      id SERIAL PRIMARY KEY,
      num_ticket VARCHAR(100),
      date_ticket DATE,
      code_g2r VARCHAR(100),
      ville VARCHAR(255),
      code_article VARCHAR(100),
      designation VARCHAR(255),
      prix_unitaire NUMERIC(10,2) DEFAULT 0,
      quantite INTEGER DEFAULT 1,
      employe_id INTEGER REFERENCES employes(id) ON DELETE SET NULL,
      technicien_nom VARCHAR(255),
      technicien_prenom VARCHAR(255),
      technicien_matricule VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Add any columns that might be missing on an older table version
  const columns = [
    `ALTER TABLE ftto_tickets ADD COLUMN IF NOT EXISTS num_ticket VARCHAR(100)`,
    `ALTER TABLE ftto_tickets ADD COLUMN IF NOT EXISTS date_ticket DATE`,
    `ALTER TABLE ftto_tickets ADD COLUMN IF NOT EXISTS code_g2r VARCHAR(100)`,
    `ALTER TABLE ftto_tickets ADD COLUMN IF NOT EXISTS ville VARCHAR(255)`,
    `ALTER TABLE ftto_tickets ADD COLUMN IF NOT EXISTS code_article VARCHAR(100)`,
    `ALTER TABLE ftto_tickets ADD COLUMN IF NOT EXISTS designation VARCHAR(255)`,
    `ALTER TABLE ftto_tickets ADD COLUMN IF NOT EXISTS prix_unitaire NUMERIC(10,2) DEFAULT 0`,
    `ALTER TABLE ftto_tickets ADD COLUMN IF NOT EXISTS quantite INTEGER DEFAULT 1`,
    `ALTER TABLE ftto_tickets ADD COLUMN IF NOT EXISTS employe_id INTEGER`,
    `ALTER TABLE ftto_tickets ADD COLUMN IF NOT EXISTS technicien_nom VARCHAR(255)`,
    `ALTER TABLE ftto_tickets ADD COLUMN IF NOT EXISTS technicien_prenom VARCHAR(255)`,
    `ALTER TABLE ftto_tickets ADD COLUMN IF NOT EXISTS technicien_matricule VARCHAR(100)`,
    `ALTER TABLE ftto_tickets ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
    `ALTER TABLE ftto_tickets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
    // Drop ALL NOT NULL constraints on every column except id
    // (the pre-existing table may have several NOT NULL columns we don't populate)
    `DO $$
     DECLARE col TEXT;
     BEGIN
       FOR col IN
         SELECT column_name FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name   = 'ftto_tickets'
           AND is_nullable  = 'NO'
           AND column_name  != 'id'
       LOOP
         EXECUTE 'ALTER TABLE ftto_tickets ALTER COLUMN ' || quote_ident(col) || ' DROP NOT NULL';
       END LOOP;
     END $$`,
  ]
  for (const sql of columns) {
    try { await query(sql) } catch (_) { /* ignore if column doesn't exist */ }
  }
}

// GET – list tickets with optional filters
export async function GET(request: NextRequest) {
  try {
    await ensureFttoTable()
    const { searchParams } = new URL(request.url)
    const mois = searchParams.get('mois')
    const annee = searchParams.get('annee')
    const employe = searchParams.get('employe_id')
    const dateDebut = searchParams.get('date_debut')
    const dateFin = searchParams.get('date_fin')

    const params: any[] = []
    const conditions: string[] = ['date_ticket IS NOT NULL']
    let idx = 1

    if (dateDebut) {
      conditions.push(`date_ticket::date >= $${idx++}::date`)
      params.push(dateDebut)
    } else if (mois) {
      conditions.push(`EXTRACT(MONTH FROM date_ticket) = $${idx++}`)
      params.push(parseInt(mois))
    }
    if (dateFin) {
      conditions.push(`date_ticket::date <= $${idx++}::date`)
      params.push(dateFin)
    } else if (annee) {
      conditions.push(`EXTRACT(YEAR FROM date_ticket) = $${idx++}`)
      params.push(parseInt(annee))
    }
    if (employe) {
      conditions.push(`employe_id = $${idx++}`)
      params.push(parseInt(employe))
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const result = await query(
      `SELECT *,
        (COALESCE(prix_unitaire,0) * COALESCE(quantite,1)) AS total_ht,
        ROUND(COALESCE(prix_unitaire,0) * COALESCE(quantite,1) * 0.40, 2) AS part_technicien,
        ROUND(COALESCE(prix_unitaire,0) * COALESCE(quantite,1) * 0.60, 2) AS part_entreprise
       FROM ftto_tickets ${where} ORDER BY date_ticket DESC, id DESC`,
      params
    )

    const totals = result.rows.reduce(
      (acc: any, r: any) => {
        acc.total_ht += Number(r.total_ht || 0)
        acc.part_technicien += Number(r.part_technicien || 0)
        acc.part_entreprise += Number(r.part_entreprise || 0)
        return acc
      },
      { total_ht: 0, part_technicien: 0, part_entreprise: 0 }
    )

    return NextResponse.json({ success: true, tickets: result.rows, totals, count: result.rows.length })
  } catch (error) {
    console.error('GET ftto error:', error)
    return NextResponse.json({ error: 'Erreur serveur', detail: String(error) }, { status: 500 })
  }
}

// POST – create ticket
export async function POST(request: NextRequest) {
  try {
    await ensureFttoTable()
    const body = await request.json()
    const {
      num_ticket, date_ticket, code_g2r, ville,
      code_article, designation, prix_unitaire, quantite,
      employe_id, technicien_nom, technicien_prenom, technicien_matricule
    } = body

    const result = await query(
      `INSERT INTO ftto_tickets
        (num_ticket, date_ticket, code_g2r, ville, code_article, designation,
         prix_unitaire, quantite, employe_id, technicien_nom, technicien_prenom, technicien_matricule)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *,
        (COALESCE(prix_unitaire,0) * COALESCE(quantite,1)) AS total_ht,
        ROUND(COALESCE(prix_unitaire,0) * COALESCE(quantite,1) * 0.40, 2) AS part_technicien,
        ROUND(COALESCE(prix_unitaire,0) * COALESCE(quantite,1) * 0.60, 2) AS part_entreprise`,
      [
        num_ticket || null,
        date_ticket || null,
        code_g2r || null,
        ville || null,
        code_article || null,
        designation || null,
        parseFloat(prix_unitaire) || 0,
        parseInt(quantite) || 1,
        employe_id || null,
        technicien_nom || null,
        technicien_prenom || null,
        technicien_matricule || null,
      ]
    )

    return NextResponse.json({ success: true, ticket: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('POST ftto error:', error)
    return NextResponse.json({ error: 'Erreur serveur', detail: String(error) }, { status: 500 })
  }
}

// PUT – update ticket
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...fields } = body
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const {
      num_ticket, date_ticket, code_g2r, ville,
      code_article, designation, prix_unitaire, quantite,
      employe_id, technicien_nom, technicien_prenom, technicien_matricule
    } = fields

    const result = await query(
      `UPDATE ftto_tickets SET
        num_ticket=$1, date_ticket=$2, code_g2r=$3, ville=$4,
        code_article=$5, designation=$6, prix_unitaire=$7, quantite=$8,
        employe_id=$9, technicien_nom=$10, technicien_prenom=$11, technicien_matricule=$12,
        updated_at=CURRENT_TIMESTAMP
       WHERE id=$13
       RETURNING *,
        (COALESCE(prix_unitaire,0) * COALESCE(quantite,1)) AS total_ht,
        ROUND(COALESCE(prix_unitaire,0) * COALESCE(quantite,1) * 0.40, 2) AS part_technicien,
        ROUND(COALESCE(prix_unitaire,0) * COALESCE(quantite,1) * 0.60, 2) AS part_entreprise`,
      [
        num_ticket || null,
        date_ticket || null,
        code_g2r || null,
        ville || null,
        code_article || null,
        designation || null,
        parseFloat(prix_unitaire) || 0,
        parseInt(quantite) || 1,
        employe_id || null,
        technicien_nom || null,
        technicien_prenom || null,
        technicien_matricule || null,
        id,
      ]
    )

    return NextResponse.json({ success: true, ticket: result.rows[0] })
  } catch (error) {
    console.error('PUT ftto error:', error)
    return NextResponse.json({ error: 'Erreur serveur', detail: String(error) }, { status: 500 })
  }
}

// DELETE
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    await query('DELETE FROM ftto_tickets WHERE id = $1', [parseInt(id)])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE ftto error:', error)
    return NextResponse.json({ error: 'Erreur serveur', detail: String(error) }, { status: 500 })
  }
}
