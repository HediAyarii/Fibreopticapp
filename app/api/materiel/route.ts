import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { logHistorique, getClientIP, getUserAgent, generateDescription } from "@/lib/historique"

export async function GET(request: NextRequest) {
  try {
    // Récupérer le paramètre de filtre depot depuis l'URL
    const { searchParams } = new URL(request.url)
    const depotFilter = searchParams.get('depot')
    
    // Construire la requête SQL avec ou sans filtre depot
    let sqlQuery = `
      SELECT m.*
      FROM materiel m
    `
    const queryParams: string[] = []
    
    if (depotFilter && ['AXECOM', 'ERT'].includes(depotFilter.toUpperCase())) {
      sqlQuery += ` WHERE m.depot = $1`
      queryParams.push(depotFilter.toUpperCase())
    }
    
    sqlQuery += ` ORDER BY m.created_at DESC`
    
    console.log('📊 Query executed:', sqlQuery, 'params:', queryParams)
    
    const result = await query(sqlQuery, queryParams.length > 0 ? queryParams : undefined)
    
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
    const body = await request.json()
    const {
      numero_serie,
      nom_equipement,
      type_materiel,
      marque,
      modele,
      statut,
      localisation,
      depot,
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
      photos,
      _user
    } = body

    // Validation des champs obligatoires
    if (!nom_equipement || nom_equipement.trim() === '') {
      return NextResponse.json({ error: "Le nom de l'équipement est obligatoire" }, { status: 400 })
    }
    
    if (!type_materiel || type_materiel.trim() === '') {
      return NextResponse.json({ error: "Le type de matériel est obligatoire" }, { status: 400 })
    }

    if (!depot || !['AXECOM', 'ERT'].includes(depot)) {
      return NextResponse.json({ error: "Le dépôt est obligatoire (AXECOM ou ERT)" }, { status: 400 })
    }

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

    // Nettoyer les champs de tableau : convertir les chaînes vides en null et les chaînes en tableaux PostgreSQL
    const cleanedArrayFields = {
      accessoires_inclus: accessoires_inclus === '' ? null : 
        (accessoires_inclus ? `{${accessoires_inclus.split(',').map(item => `"${item.trim()}"`).join(',')}}` : null),
      certificats_conformite: certificats_conformite === '' ? null : 
        (certificats_conformite ? `{${certificats_conformite.split(',').map(item => `"${item.trim()}"`).join(',')}}` : null),
      photos: photos === '' ? null : 
        (photos ? `{${photos.split(',').map(item => `"${item.trim()}"`).join(',')}}` : null)
    }

    const insertQuery = `
      INSERT INTO materiel (
        numero_serie, nom_equipement, type_materiel, marque, modele, statut,
        localisation, depot, quantite, prix_unitaire, date_acquisition, cout_acquisition,
        garantie_jusqu_a, maintenance_derniere, maintenance_prochaine,
        kilometrage_vehicule, consommation_carburant, capacite_reservoir,
        niveau_carburant, etat_general, notes_maintenance, accessoires_inclus,
        certificats_conformite, photos
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24
      ) RETURNING *
    `

    const values = [
      numero_serie, nom_equipement, type_materiel, marque, modele, statut || 'disponible',
      localisation, depot, cleanedData.quantite, cleanedData.prix_unitaire, cleanedData.date_acquisition, cleanedData.cout_acquisition,
      cleanedData.garantie_jusqu_a, cleanedData.maintenance_derniere, cleanedData.maintenance_prochaine,
      cleanedData.kilometrage_vehicule, cleanedData.consommation_carburant, cleanedData.capacite_reservoir,
      cleanedData.niveau_carburant, etat_general || 'bon', notes_maintenance, cleanedArrayFields.accessoires_inclus,
      cleanedArrayFields.certificats_conformite, cleanedArrayFields.photos
    ]

    const result = await query(insertQuery, values)
    
    // Enregistrer dans l'historique avec l'email de l'utilisateur
    await logHistorique({
      userName: _user?.email || _user?.name || 'Utilisateur inconnu',
      action: 'CREATE',
      tableName: 'materiel',
      recordId: result.rows[0].id,
      section: 'Matériel',
      description: generateDescription('CREATE', 'Matériel', `${nom_equipement} - ${type_materiel} (Dépôt: ${depot})`),
      newValues: result.rows[0],
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request)
    })
    
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
    const body = await request.json()
    const { id, _user, ...updateData } = body

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

    // Champs de tableau qui doivent être null si vides ou convertis en format PostgreSQL
    const arrayFields = ['accessoires_inclus', 'certificats_conformite', 'photos']
    
    arrayFields.forEach(field => {
      if (cleanedData[field] === '' || cleanedData[field] === undefined) {
        cleanedData[field] = null
      } else if (cleanedData[field] && typeof cleanedData[field] === 'string') {
        // Convertir la chaîne en format de tableau PostgreSQL
        cleanedData[field] = `{${cleanedData[field].split(',').map(item => `"${item.trim()}"`).join(',')}}`
      }
    })

    const fields = Object.keys(cleanedData).filter(key => cleanedData[key] !== undefined)
    if (fields.length === 0) {
      return NextResponse.json({ error: "Aucune donnée à mettre à jour" }, { status: 400 })
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ')
    const values = [id, ...fields.map(field => cleanedData[field])]

    // Récupérer les anciennes valeurs avant la mise à jour
    const oldDataResult = await query('SELECT * FROM materiel WHERE id = $1', [id])
    if (oldDataResult.rows.length === 0) {
      return NextResponse.json({ error: "Matériel non trouvé" }, { status: 404 })
    }
    const oldData = oldDataResult.rows[0]

    const updateQuery = `
      UPDATE materiel 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `

    const result = await query(updateQuery, values)
    
    // Générer une description détaillée des modifications
    const changes: string[] = []
    const newData = result.rows[0]
    
    // Comparer les champs importants
    if (oldData.nom_equipement !== newData.nom_equipement) {
      changes.push(`Nom: "${oldData.nom_equipement}" → "${newData.nom_equipement}"`)
    }
    if (oldData.type_materiel !== newData.type_materiel) {
      changes.push(`Type: "${oldData.type_materiel}" → "${newData.type_materiel}"`)
    }
    if (oldData.quantite !== newData.quantite) {
      changes.push(`Quantité: ${oldData.quantite} → ${newData.quantite}`)
    }
    if (oldData.prix_unitaire !== newData.prix_unitaire) {
      changes.push(`Prix unitaire: ${oldData.prix_unitaire}€ → ${newData.prix_unitaire}€`)
    }
    if (oldData.depot !== newData.depot) {
      changes.push(`Dépôt: ${oldData.depot} → ${newData.depot}`)
    }
    if (oldData.statut !== newData.statut) {
      changes.push(`Statut: ${oldData.statut} → ${newData.statut}`)
    }
    if (oldData.marque !== newData.marque) {
      changes.push(`Marque: "${oldData.marque}" → "${newData.marque}"`)
    }
    if (oldData.modele !== newData.modele) {
      changes.push(`Modèle: "${oldData.modele}" → "${newData.modele}"`)
    }
    if (oldData.notes_maintenance !== newData.notes_maintenance) {
      changes.push(`Notes maintenance modifiées`)
    }
    
    const detailedDescription = changes.length > 0 
      ? `${newData.nom_equipement} - ${changes.join(', ')}`
      : `${newData.nom_equipement} - ${newData.type_materiel} (aucune modification détectable)`
    
    // Enregistrer dans l'historique avec l'email de l'utilisateur
    await logHistorique({
      userName: _user?.email || _user?.name || 'Utilisateur inconnu',
      action: 'UPDATE',
      tableName: 'materiel',
      recordId: id,
      section: 'Matériel',
      description: `Modification Matériel - ${detailedDescription}`,
      oldValues: oldData,
      newValues: result.rows[0],
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request)
    })

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

    // Récupérer les informations utilisateur du body
    let userData: any = null
    try {
      const body = await request.json()
      userData = body._user
    } catch (e) {
      // Body vide ou invalide, continuer sans userData
    }

    // Commencer une transaction pour gérer les contraintes de clé étrangère
    await query('BEGIN')

    try {
      // 1. Vérifier si le matériel existe
      const materielResult = await query('SELECT * FROM materiel WHERE id = $1', [id])
      
      if (materielResult.rows.length === 0) {
        await query('ROLLBACK')
        return NextResponse.json({ error: "Matériel non trouvé" }, { status: 404 })
      }

      const deletedData = materielResult.rows[0]

      // 2. Vérifier s'il y a des affectations liées (pour information uniquement)
      const affectationsResult = await query(
        `SELECT COUNT(*) as count FROM affectations_materiel WHERE materiel_id = $1`,
        [id]
      )

      const affectationsCount = parseInt(affectationsResult.rows[0].count)

      // 3. Mettre materiel_id à NULL dans les affectations pour conserver l'historique
      if (affectationsCount > 0) {
        await query(
          `UPDATE affectations_materiel SET materiel_id = NULL WHERE materiel_id = $1`,
          [id]
        )
        console.log(`${affectationsCount} affectation(s) conservée(s) avec materiel_id mis à NULL`)
      }

      // 4. Supprimer le matériel
      const result = await query('DELETE FROM materiel WHERE id = $1 RETURNING *', [id])

      // 5. Construire la description
      let description = `${deletedData.nom_equipement} - ${deletedData.type_materiel}`
      if (affectationsCount > 0) {
        description += `\n⚠️ ${affectationsCount} affectation(s) conservée(s) (materiel_id mis à NULL)`
      }

      // 6. Enregistrer dans l'historique
      await logHistorique({
        userName: userData?.email || userData?.name || 'Utilisateur inconnu',
        action: 'DELETE',
        tableName: 'materiel',
        recordId: parseInt(id),
        section: 'Matériel',
        description: generateDescription('DELETE', 'Matériel', description),
        oldValues: deletedData,
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request)
      })

      // 7. Valider la transaction
      await query('COMMIT')

      return NextResponse.json({
        success: true,
        message: 'Matériel supprimé avec succès'
      })
    } catch (error) {
      // Annuler la transaction en cas d'erreur
      await query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error("Erreur API matériel DELETE:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
