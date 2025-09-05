import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET() {
  try {
    const result = await query(`
      SELECT m.*
      FROM materiel m 
      ORDER BY m.created_at DESC
    `)
    
    // Convertir les valeurs numériques en nombres
    const materiel = result.rows.map(row => ({
      ...row,
      quantite: row.quantite ? Number(row.quantite) : 0,
      prix_unitaire: row.prix_unitaire ? Number(row.prix_unitaire) : 0,
      cout_acquisition: row.cout_acquisition ? Number(row.cout_acquisition) : 0,
      kilometrage_vehicule: row.kilometrage_vehicule ? Number(row.kilometrage_vehicule) : 0,
      consommation_carburant: row.consommation_carburant ? Number(row.consommation_carburant) : 0,
      capacite_reservoir: row.capacite_reservoir ? Number(row.capacite_reservoir) : 0,
      niveau_carburant: row.niveau_carburant ? Number(row.niveau_carburant) : 0
    }))
    
    return NextResponse.json({ materiel })
  } catch (error) {
    console.error("Erreur API matériel GET:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      numero_serie,
      nom_equipement,
      type_materiel,
      marque,
      modele,
      statut,
      localisation,
      quantite,
      prix_unitaire,
      date_acquisition,
      cout_acquisition,
      garantie_jusqu_a,
      maintenance_derniere,
      maintenance_prochaine,
      kilometrage_vehicule,
      consommation_carburant,
      capacite_reservoir,
      niveau_carburant,
      etat_general,
      notes_maintenance,
      accessoires_inclus,
      certificats_conformite,
      photos
    } = await request.json()

    // Vérifier si le matériel existe déjà (par numéro de série)
    if (numero_serie) {
      const existing = await query(
        'SELECT id FROM materiel WHERE numero_serie = $1',
        [numero_serie]
      )
      if (existing.rows.length > 0) {
        return NextResponse.json({ error: "Un matériel avec ce numéro de série existe déjà" }, { status: 400 })
      }
    }

    // Nettoyer les données : convertir les chaînes vides en null pour les champs entiers et dates
    const cleanedData = {
      quantite: quantite === '' ? null : quantite,
      prix_unitaire: prix_unitaire === '' ? null : prix_unitaire,
      cout_acquisition: cout_acquisition === '' ? null : cout_acquisition,
      kilometrage_vehicule: kilometrage_vehicule === '' ? null : (kilometrage_vehicule || 0),
      consommation_carburant: consommation_carburant === '' ? null : consommation_carburant,
      capacite_reservoir: capacite_reservoir === '' ? null : capacite_reservoir,
      niveau_carburant: niveau_carburant === '' ? null : niveau_carburant,
      date_acquisition: date_acquisition === '' ? null : date_acquisition,
      garantie_jusqu_a: garantie_jusqu_a === '' ? null : garantie_jusqu_a,
      maintenance_derniere: maintenance_derniere === '' ? null : maintenance_derniere,
      maintenance_prochaine: maintenance_prochaine === '' ? null : maintenance_prochaine
    }

    const insertQuery = `
      INSERT INTO materiel (
        numero_serie, nom_equipement, type_materiel, marque, modele, statut,
        localisation, quantite, prix_unitaire, date_acquisition, cout_acquisition,
        garantie_jusqu_a, maintenance_derniere, maintenance_prochaine,
        kilometrage_vehicule, consommation_carburant, capacite_reservoir,
        niveau_carburant, etat_general, notes_maintenance, accessoires_inclus,
        certificats_conformite, photos
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23
      ) RETURNING *
    `

    const values = [
      numero_serie, nom_equipement, type_materiel, marque, modele, statut || 'disponible',
      localisation, cleanedData.quantite, cleanedData.prix_unitaire, cleanedData.date_acquisition, cleanedData.cout_acquisition,
      cleanedData.garantie_jusqu_a, cleanedData.maintenance_derniere, cleanedData.maintenance_prochaine,
      cleanedData.kilometrage_vehicule, cleanedData.consommation_carburant, cleanedData.capacite_reservoir,
      cleanedData.niveau_carburant, etat_general || 'bon', notes_maintenance, accessoires_inclus,
      certificats_conformite, photos
    ]

    const result = await query(insertQuery, values)
    
    return NextResponse.json({
      success: true,
      materiel: result.rows[0]
    })
  } catch (error) {
    console.error("Erreur API matériel POST:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updateData } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID matériel requis" }, { status: 400 })
    }

    // Nettoyer les données : convertir les chaînes vides en null pour les champs entiers et dates
    const cleanedData = { ...updateData }
    
    // Champs entiers qui doivent être null si vides
    const integerFields = ['quantite', 'prix_unitaire', 'cout_acquisition', 'kilometrage_vehicule', 'consommation_carburant', 'capacite_reservoir', 'niveau_carburant']
    
    // Champs de date qui doivent être null si vides
    const dateFields = ['date_acquisition', 'garantie_jusqu_a', 'maintenance_derniere', 'maintenance_prochaine']
    
    integerFields.forEach(field => {
      if (cleanedData[field] === '' || cleanedData[field] === undefined) {
        cleanedData[field] = null
      } else if (typeof cleanedData[field] === 'string' && !isNaN(Number(cleanedData[field]))) {
        cleanedData[field] = Number(cleanedData[field])
      }
    })
    
    dateFields.forEach(field => {
      if (cleanedData[field] === '' || cleanedData[field] === undefined) {
        cleanedData[field] = null
      }
    })

    const fields = Object.keys(cleanedData).filter(key => cleanedData[key] !== undefined)
    if (fields.length === 0) {
      return NextResponse.json({ error: "Aucune donnée à mettre à jour" }, { status: 400 })
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ')
    const values = [id, ...fields.map(field => cleanedData[field])]

    const updateQuery = `
      UPDATE materiel 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `

    const result = await query(updateQuery, values)
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Matériel non trouvé" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      materiel: result.rows[0]
    })
  } catch (error) {
    console.error("Erreur API matériel PUT:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "ID matériel requis" }, { status: 400 })
    }

    const result = await query('DELETE FROM materiel WHERE id = $1 RETURNING *', [id])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Matériel non trouvé" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Matériel supprimé avec succès"
    })
  } catch (error) {
    console.error("Erreur API matériel DELETE:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
