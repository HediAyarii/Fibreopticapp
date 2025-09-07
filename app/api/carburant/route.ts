import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { carburant } = await request.json()

    let saved = 0
    let duplicates = 0

    for (const transaction of carburant) {
      const numJustificatif =
        transaction["N° de justificatif"] || transaction["numero_justificatif"] || transaction.numero_justificatif

      if (!numJustificatif) {
        duplicates++
        continue
      }

      try {
        // Check for duplicates by numero_justificatif
        const existingTransaction = await query(
          'SELECT id FROM carburant_consommation WHERE numero_justificatif = $1',
          [numJustificatif]
        )

        if (existingTransaction.rows.length === 0) {
          // Insert new carburant transaction
          const insertQuery = `
            INSERT INTO carburant_consommation (
              date_fact, date_livraison, heure_livraison, immat_vehicule,
              numero_carte, km, poste_1, poste_2, pays, numero_station,
              point_acceptation, identifiant_autoroute, cp, type_marchandises,
              quantite, taux_tva, ca_ht, tva, ca_ttc, numero_justificatif
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
            )
          `

          const values = [
            transaction["Date fact."] || transaction.date_fact,
            transaction["Date de livraison"] || transaction.date_livraison,
            transaction["Heure de livraison"] || transaction.heure_livraison,
            transaction["Immat. véhicule"] || transaction.immat_vehicule,
            transaction["N° de carte"] || transaction.numero_carte,
            transaction["km"] || transaction.km,
            transaction["Poste 1"] || transaction.poste_1,
            transaction["Poste 2"] || transaction.poste_2,
            transaction["Pays"] || transaction.pays,
            transaction["N° de station"] || transaction.numero_station,
            transaction["Point d'acceptation"] || transaction.point_acceptation,
            transaction["Identifiant autoroute"] || transaction.identifiant_autoroute,
            transaction["CP"] || transaction.cp,
            transaction["Type marchandises"] || transaction.type_marchandises,
            transaction["Quantité"] || transaction.quantite,
            transaction["Taux TVA"] || transaction.taux_tva,
            transaction["CA HT"] || transaction.ca_ht,
            transaction["TVA"] || transaction.tva,
            transaction["CA TTC"] || transaction.ca_ttc,
            transaction["N° de justificatif"] || transaction.numero_justificatif
          ]

          await query(insertQuery, values)
          saved++
        } else {
          duplicates++
        }
      } catch (error) {
        console.error("Erreur lors de l'insertion de la transaction carburant:", error)
        duplicates++
      }
    }

    // Get total count
    const totalResult = await query('SELECT COUNT(*) as total FROM carburant_consommation')
    const total = totalResult.rows[0].total

    return NextResponse.json({
      success: true,
      saved,
      duplicates,
      total: parseInt(total),
    })
  } catch (error) {
    console.error("Erreur API carburant:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const result = await query(`
      SELECT *
      FROM carburant_consommation
      ORDER BY created_at DESC 
      LIMIT 1000
    `)
    
    return NextResponse.json({
      carburant: result.rows,
      total: result.rows.length,
    })
  } catch (error) {
    console.error("Erreur GET carburant:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
