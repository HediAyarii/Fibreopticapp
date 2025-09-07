import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET() {
  try {
    const result = await query(`
      SELECT p.*, 
             e.nom as employe_nom, e.prenom as employe_prenom,
             i.num_inter, i.client as intervention_client,
             r.numero_reclamation,
             m.nom_equipement
      FROM penalites p 
      LEFT JOIN employes e ON p.employe_id = e.id 
      LEFT JOIN interventions i ON p.intervention_concernee = i.id
      LEFT JOIN reclamations r ON p.reclamation_concernee = r.id
      LEFT JOIN materiel m ON p.materiel_concerne = m.id
      ORDER BY p.created_at DESC
    `)
    return NextResponse.json({ penalites: result.rows })
  } catch (error) {
    console.error("Erreur API pénalités GET:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      numero_penalite,
      employe_id,
      type_penalite,
      motif,
      montant,
      statut,
      date_echeance,
      date_paiement,
      methode_paiement,
      reference_paiement,
      manager_approbateur,
      commentaires,
      intervention_concernee,
      reclamation_concernee,
      materiel_concerne
    } = await request.json()

    if (!employe_id) {
      return NextResponse.json({ error: "ID employé requis" }, { status: 400 })
    }

    // Générer un numéro de pénalité si non fourni
    let numeroPenalite = numero_penalite
    if (!numeroPenalite) {
      const countResult = await query('SELECT COUNT(*) as count FROM penalites')
      const count = parseInt(countResult.rows[0].count) + 1
      numeroPenalite = `PEN-${new Date().getFullYear()}-${count.toString().padStart(4, '0')}`
    }

    // Vérifier si la pénalité existe déjà
    const existing = await query(
      'SELECT id FROM penalites WHERE numero_penalite = $1',
      [numeroPenalite]
    )
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Une pénalité avec ce numéro existe déjà" }, { status: 400 })
    }

    // Nettoyer les données : convertir les chaînes vides en null pour les champs entiers et dates
    const cleanedData = {
      employe_id: employe_id === '' ? null : employe_id,
      montant: montant === '' ? null : montant,
      intervention_concernee: intervention_concernee === '' ? null : intervention_concernee,
      reclamation_concernee: reclamation_concernee === '' ? null : reclamation_concernee,
      materiel_concerne: materiel_concerne === '' ? null : materiel_concerne,
      date_echeance: date_echeance === '' ? null : date_echeance,
      date_paiement: date_paiement === '' ? null : date_paiement
    }

    const insertQuery = `
      INSERT INTO penalites (
        numero_penalite, employe_id, type_penalite, motif, montant, statut,
        date_echeance, date_paiement, methode_paiement, reference_paiement,
        manager_approbateur, commentaires, intervention_concernee,
        reclamation_concernee, materiel_concerne
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      ) RETURNING *
    `

    const values = [
      numeroPenalite, cleanedData.employe_id, type_penalite, motif, cleanedData.montant, statut || 'active',
      cleanedData.date_echeance, cleanedData.date_paiement, methode_paiement, reference_paiement,
      manager_approbateur, commentaires, cleanedData.intervention_concernee,
      cleanedData.reclamation_concernee, cleanedData.materiel_concerne
    ]

    const result = await query(insertQuery, values)
    
    // Mettre à jour le total des pénalités de l'employé
    await query(`
      UPDATE employes 
      SET penalites_total = (
        SELECT COALESCE(SUM(montant), 0) 
        FROM penalites 
        WHERE employe_id = $1 AND statut = 'active'
      )
      WHERE id = $1
    `, [cleanedData.employe_id])
    
    return NextResponse.json({
      success: true,
      penalite: result.rows[0]
    })
  } catch (error) {
    console.error("Erreur API pénalités POST:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updateData } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID pénalité requis" }, { status: 400 })
    }

    // Filtrer les champs à mettre à jour
    const fields = Object.keys(updateData).filter(key => updateData[key] !== undefined)
    
    if (fields.length === 0) {
      return NextResponse.json({ error: "Aucune donnée à mettre à jour" }, { status: 400 })
    }

    // Construire la requête SQL
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ')
    const values = [id, ...fields.map(field => updateData[field])]

    const updateQuery = `
      UPDATE penalites 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `

    const result = await query(updateQuery, values)
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Pénalité non trouvée" }, { status: 404 })
    }

    // Mettre à jour le total des pénalités de l'employé si le montant ou le statut a changé
    if (updateData.montant !== undefined || updateData.statut !== undefined) {
      const employeId = result.rows[0].employe_id
      await query(`
        UPDATE employes 
        SET penalites_total = (
          SELECT COALESCE(SUM(montant), 0) 
          FROM penalites 
          WHERE employe_id = $1 AND statut = 'active'
        )
        WHERE id = $1
      `, [employeId])
    }

    return NextResponse.json({
      success: true,
      penalite: result.rows[0]
    })
  } catch (error) {
    console.error("Erreur API pénalités PUT:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "ID pénalité requis" }, { status: 400 })
    }

    // Récupérer l'employé_id avant suppression
    const employeResult = await query('SELECT employe_id FROM penalites WHERE id = $1', [id])
    if (employeResult.rows.length === 0) {
      return NextResponse.json({ error: "Pénalité non trouvée" }, { status: 404 })
    }

    const employeId = employeResult.rows[0].employe_id

    const result = await query('DELETE FROM penalites WHERE id = $1 RETURNING *', [id])
    
    // Mettre à jour le total des pénalités de l'employé
    await query(`
      UPDATE employes 
      SET penalites_total = (
        SELECT COALESCE(SUM(montant), 0) 
        FROM penalites 
        WHERE employe_id = $1 AND statut = 'active'
      )
      WHERE id = $1
    `, [employeId])

    return NextResponse.json({
      success: true,
      message: "Pénalité supprimée avec succès"
    })
  } catch (error) {
    console.error("Erreur API pénalités DELETE:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
