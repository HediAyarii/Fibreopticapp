import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const {
      materiel_id,
      quantite_transferee,
      depot_destination,
      motif,
      commentaires,
      utilisateur_id,
      utilisateur_nom
    } = await request.json()

    // Validation des champs obligatoires
    if (!materiel_id) {
      return NextResponse.json({ error: "ID du matériel requis" }, { status: 400 })
    }

    if (!quantite_transferee || quantite_transferee <= 0) {
      return NextResponse.json({ error: "Quantité à transférer invalide" }, { status: 400 })
    }

    if (!depot_destination || !['AXECOM', 'ERT'].includes(depot_destination)) {
      return NextResponse.json({ 
        error: "Dépôt de destination invalide (AXECOM ou ERT requis)" 
      }, { status: 400 })
    }

    // Récupérer le matériel actuel
    const materielResult = await query(
      'SELECT id, nom_equipement, depot, quantite FROM materiel WHERE id = $1',
      [materiel_id]
    )

    if (materielResult.rows.length === 0) {
      return NextResponse.json({ error: "Matériel non trouvé" }, { status: 404 })
    }

    const materiel = materielResult.rows[0]
    const depot_origine = materiel.depot
    const quantite_actuelle = Number(materiel.quantite)

    // Vérifier que ce n'est pas le même dépôt
    if (depot_origine === depot_destination) {
      return NextResponse.json({ 
        error: `Le matériel est déjà dans le dépôt ${depot_destination}` 
      }, { status: 400 })
    }

    // Vérifier qu'il y a assez de stock
    if (quantite_transferee > quantite_actuelle) {
      return NextResponse.json({ 
        error: `Quantité insuffisante. Disponible: ${quantite_actuelle}` 
      }, { status: 400 })
    }

    // Commencer une transaction
    await query('BEGIN')

    try {
      // OPTION 1: Transfert total (toute la quantité)
      if (quantite_transferee === quantite_actuelle) {
        // Mettre à jour le dépôt du matériel existant
        await query(
          'UPDATE materiel SET depot = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [depot_destination, materiel_id]
        )
      } 
      // OPTION 2: Transfert partiel (créer un nouveau matériel dans le dépôt destination)
      else {
        // Réduire la quantité dans le dépôt d'origine
        await query(
          'UPDATE materiel SET quantite = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [quantite_actuelle - quantite_transferee, materiel_id]
        )

        // Chercher si le même matériel existe déjà dans le dépôt de destination
        const existingInDestResult = await query(`
          SELECT id, quantite FROM materiel 
          WHERE nom_equipement = $1 
          AND type_materiel = $2 
          AND depot = $3
          AND id != $4
        `, [materiel.nom_equipement, materiel.type_equipement, depot_destination, materiel_id])

        if (existingInDestResult.rows.length > 0) {
          // Ajouter à l'existant
          const existing = existingInDestResult.rows[0]
          await query(
            'UPDATE materiel SET quantite = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [Number(existing.quantite) + quantite_transferee, existing.id]
          )
        } else {
          // Créer un nouveau matériel dans le dépôt de destination
          await query(`
            INSERT INTO materiel (
              numero_serie, nom_equipement, type_materiel, marque, modele, 
              statut, localisation, depot, quantite, prix_unitaire, 
              date_acquisition, cout_acquisition, etat_general
            )
            SELECT 
              numero_serie || '_TRANSFER', nom_equipement, type_materiel, marque, modele,
              statut, localisation, $1, $2, prix_unitaire,
              date_acquisition, cout_acquisition, etat_general
            FROM materiel WHERE id = $3
          `, [depot_destination, quantite_transferee, materiel_id])
        }
      }

      // Enregistrer le transfert dans l'historique
      const historiqueResult = await query(`
        INSERT INTO historique_transferts_materiel (
          materiel_id,
          depot_origine,
          depot_destination,
          quantite_transferee,
          motif,
          commentaires,
          utilisateur_id,
          utilisateur_nom,
          date_transfert
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
        RETURNING *
      `, [
        materiel_id,
        depot_origine,
        depot_destination,
        quantite_transferee,
        motif || `Transfert de ${depot_origine} vers ${depot_destination}`,
        commentaires,
        utilisateur_id,
        utilisateur_nom
      ])

      // Valider la transaction
      await query('COMMIT')

      return NextResponse.json({
        success: true,
        message: `${quantite_transferee} ${materiel.nom_equipement} transféré(s) de ${depot_origine} vers ${depot_destination}`,
        transfer: historiqueResult.rows[0],
        materiel: {
          id: materiel.id,
          nom_equipement: materiel.nom_equipement,
          depot_ancien: depot_origine,
          depot_nouveau: depot_destination,
          quantite_transferee
        }
      })

    } catch (error) {
      // Annuler la transaction en cas d'erreur
      await query('ROLLBACK')
      throw error
    }

  } catch (error) {
    console.error("Erreur API transfert matériel POST:", error)
    return NextResponse.json({ 
      error: "Erreur lors du transfert du matériel" 
    }, { status: 500 })
  }
}

// GET - Récupérer l'historique des transferts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const materiel_id = searchParams.get('materiel_id')
    const depot = searchParams.get('depot')
    const limit = searchParams.get('limit') || '50'

    let whereConditions = []
    let queryParams: any[] = []
    let paramIndex = 1

    if (materiel_id) {
      whereConditions.push(`htm.materiel_id = $${paramIndex}`)
      queryParams.push(parseInt(materiel_id))
      paramIndex++
    }

    if (depot && ['AXECOM', 'ERT'].includes(depot)) {
      whereConditions.push(`(htm.depot_origine = $${paramIndex} OR htm.depot_destination = $${paramIndex})`)
      queryParams.push(depot)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : ''

    queryParams.push(parseInt(limit))

    const result = await query(`
      SELECT 
        htm.*,
        m.nom_equipement,
        m.type_materiel,
        m.numero_serie,
        m.depot as depot_actuel
      FROM historique_transferts_materiel htm
      LEFT JOIN materiel m ON htm.materiel_id = m.id
      ${whereClause}
      ORDER BY htm.date_transfert DESC
      LIMIT $${paramIndex}
    `, queryParams)

    return NextResponse.json({ 
      transferts: result.rows,
      total: result.rows.length
    })

  } catch (error) {
    console.error("Erreur API transfert matériel GET:", error)
    return NextResponse.json({ 
      error: "Erreur lors de la récupération de l'historique" 
    }, { status: 500 })
  }
}
