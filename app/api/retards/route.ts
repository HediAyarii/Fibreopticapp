import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

// Ensure table exists
async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS retards (
      id SERIAL PRIMARY KEY,
      employe_id INTEGER REFERENCES employes(id) ON DELETE SET NULL,
      nom VARCHAR(100) NOT NULL,
      prenom VARCHAR(100) NOT NULL,
      societe VARCHAR(50) NOT NULL DEFAULT 'AXECOM',
      date_retard DATE NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

export async function GET(request: NextRequest) {
  try {
    await ensureTable()
    const { searchParams } = new URL(request.url)
    const employe_id = searchParams.get('employe_id')
    const annee = searchParams.get('annee')

    let whereClause = 'WHERE 1=1'
    const params: any[] = []
    let paramIndex = 1

    if (employe_id) {
      whereClause += ` AND r.employe_id = $${paramIndex}`
      params.push(parseInt(employe_id))
      paramIndex++
    }

    if (annee) {
      whereClause += ` AND EXTRACT(YEAR FROM r.date_retard) = $${paramIndex}`
      params.push(parseInt(annee))
      paramIndex++
    }

    const result = await query(`
      SELECT r.*, e.matricule, e.poste
      FROM retards r
      LEFT JOIN employes e ON r.employe_id = e.id
      ${whereClause}
      ORDER BY r.date_retard DESC, r.created_at DESC
    `, params)

    return NextResponse.json({ success: true, retards: result.rows, total: result.rows.length })
  } catch (error) {
    console.error("Erreur GET retards:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTable()
    const data = await request.json()
    const { employe_id, nom, prenom, societe, date_retard, description } = data

    if (!nom || !prenom || !date_retard || !societe) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 })
    }

    const result = await query(`
      INSERT INTO retards (employe_id, nom, prenom, societe, date_retard, description)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [employe_id || null, nom, prenom, societe, date_retard, description || null])

    const retard = result.rows[0]
    let penaliteCreee = null

    // Règle : 3 retards dans la même semaine (lundi-dimanche) = pénalité de 30€
    if (employe_id) {
      // Compter les retards de cet employé dans la semaine ISO du retard ajouté
      const weekCountResult = await query(`
        SELECT COUNT(*) as count
        FROM retards
        WHERE employe_id = $1
          AND date_retard >= date_trunc('week', $2::date)
          AND date_retard <  date_trunc('week', $2::date) + INTERVAL '7 days'
      `, [employe_id, date_retard])

      const retrardsDansSemaine = parseInt(weekCountResult.rows[0].count)

      // Déclencher la pénalité uniquement au 3ème retard exact de la semaine (pas au 4ème, 5ème…)
      if (retrardsDansSemaine === 3) {
        // Calculer la période lundi-dimanche pour le motif
        const lundiDate = new Date(date_retard)
        const dayOfWeek = lundiDate.getDay() === 0 ? 6 : lundiDate.getDay() - 1
        lundiDate.setDate(lundiDate.getDate() - dayOfWeek)
        const dimancheDate = new Date(lundiDate)
        dimancheDate.setDate(lundiDate.getDate() + 6)
        const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

        const countPen = await query('SELECT COUNT(*) as count FROM penalites')
        const penCount = parseInt(countPen.rows[0].count) + 1
        const numeroPenalite = `PEN-${new Date().getFullYear()}-${penCount.toString().padStart(4, '0')}`

        const penResult = await query(`
          INSERT INTO penalites (
            numero_penalite, employe_id, type_penalite, motif, montant,
            manager_approbateur, commentaires, date_attribution,
            j_plus_1, j_plus_n
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, false, false)
          RETURNING *
        `, [
          numeroPenalite,
          employe_id,
          'retard',
          `3 retards semaine du ${fmt(lundiDate)} au ${fmt(dimancheDate)}`,
          30,
          'Système automatique',
          `Pénalité générée automatiquement : 3 retards enregistrés sur la semaine du ${fmt(lundiDate)} au ${fmt(dimancheDate)}`,
        ])

        penaliteCreee = penResult.rows[0]

        await query(`
          UPDATE employes
          SET penalites_total = (
            SELECT COALESCE(SUM(montant), 0) FROM penalites WHERE employe_id = $1
          )
          WHERE id = $1
        `, [employe_id])
      }
    }

    return NextResponse.json({ success: true, retard, penaliteCreee })
  } catch (error) {
    console.error("Erreur POST retards:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureTable()
    const data = await request.json()
    const { id, employe_id, nom, prenom, societe, date_retard, description } = data

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    const result = await query(`
      UPDATE retards
      SET employe_id = $1, nom = $2, prenom = $3, societe = $4,
          date_retard = $5, description = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `, [employe_id || null, nom, prenom, societe, date_retard, description || null, id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Retard non trouvé" }, { status: 404 })
    }

    return NextResponse.json({ success: true, retard: result.rows[0] })
  } catch (error) {
    console.error("Erreur PUT retards:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureTable()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    const result = await query('DELETE FROM retards WHERE id = $1 RETURNING *', [parseInt(id)])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Retard non trouvé" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Retard supprimé" })
  } catch (error) {
    console.error("Erreur DELETE retards:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
