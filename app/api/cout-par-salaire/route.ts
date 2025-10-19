import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

// GET - Récupérer les coûts par salarié avec filtres
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mois = searchParams.get('mois')
    const annee = searchParams.get('annee')
    
    let whereClause = ''
    const params: any[] = []
    let paramIndex = 1
    
    if (mois && annee) {
      whereClause = 'WHERE mois = $1 AND annee = $2'
      params.push(parseInt(mois), parseInt(annee))
    } else if (mois) {
      whereClause = 'WHERE mois = $1'
      params.push(parseInt(mois))
    } else if (annee) {
      whereClause = 'WHERE annee = $1'
      params.push(parseInt(annee))
    }
    
    // Récupérer les données de base
    const result = await query(`
      SELECT 
        id,
        nom,
        prenom,
        salaire_net,
        salaire_brut,
        cout_total,
        charge,
        mois,
        annee,
        matricule,
        taxe,
        impot,
        penalite,
        total_genere,
        rap,
        created_at,
        updated_at
      FROM cout_par_salaire 
      ${whereClause}
      ORDER BY annee DESC, mois DESC, nom, prenom
    `, params)
    
    // Calculer le total des paiements pour chaque employé
    const coutsWithRevenue = await Promise.all(
      result.rows.map(async (cout: any) => {
        try {
          // Récupérer le total des paiements
            const paiementsResult = await query(`
              SELECT calculer_total_paiements($1) as total_paiements
            `, [cout.id])
            
            const totalPaiements = parseFloat(paiementsResult.rows[0].total_paiements) || 0
            
            return {
              ...cout,
              total_paiements: totalPaiements
          }
        } catch (error) {
          console.error(`Erreur calcul paiements pour ${cout.nom} ${cout.prenom}:`, error)
            return {
              ...cout,
            total_paiements: 0
          }
        }
      })
    )
    
    return NextResponse.json({
      success: true,
      couts: coutsWithRevenue,
      total: coutsWithRevenue.length
    })
    
  } catch (error) {
    console.error("Erreur GET cout-par-salaire:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST - Créer ou importer des coûts par salarié
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (data.importData && Array.isArray(data.importData)) {
      // Import en lot
      let inserted = 0
      let updated = 0
      let errors = 0
      
      console.log('Données reçues pour import:', data.importData)
      
      for (const item of data.importData) {
        try {
          const { nom, prenom, salaire_net, salaire_brut, cout_total, charge, mois, annee, matricule, taxe } = item
          
          console.log('Traitement de:', { nom, prenom, salaire_net, salaire_brut, cout_total, charge, mois, annee })
          
          // Validation des données
          if (!nom || !prenom || mois === undefined || annee === undefined) {
            console.error('Données manquantes pour:', item)
            errors++
            continue
          }
          
          // Validation et nettoyage des types numériques
          const cleanNumeric = (value: any): number => {
            if (typeof value === 'number') return value
            if (typeof value === 'string') {
              // Nettoyer la chaîne (espaces, guillemets, virgules)
              const cleaned = value.replace(/[\s\u00A0\u2000-\u200B\u2028\u2029\u202F\u205F\u3000]/g, '')
                                 .replace(/["""]/g, '')
                                 .replace(',', '.')
              return parseFloat(cleaned) || 0
            }
            return 0
          }
          
                 const salaireNet = cleanNumeric(salaire_net)
                 const salaireBrut = cleanNumeric(salaire_brut)
                 const coutTotal = cleanNumeric(cout_total)
                 const chargeValue = cleanNumeric(charge)
                 const taxeValue = cleanNumeric(taxe) || 0
                 
                 // Calculer l'impôt selon la logique
                 let impotValue = 0
                 if (Math.abs(taxeValue - 100) < 0.01) {
                   impotValue = 0
                 } else if (Math.abs(taxeValue - 50) < 0.01) {
                   impotValue = chargeValue / 2
                 } else if (Math.abs(taxeValue) < 0.01) {
                   impotValue = chargeValue
                 } else {
                   impotValue = chargeValue * (taxeValue / 100)
                 }
                 
                 console.log('Valeurs converties:', { salaireNet, salaireBrut, coutTotal, chargeValue, taxeValue, impotValue, matricule: matricule || 'N/A' })
          
          // Vérifier si l'enregistrement existe déjà
          const existing = await query(
            'SELECT id FROM cout_par_salaire WHERE nom = $1 AND prenom = $2 AND mois = $3 AND annee = $4',
            [nom, prenom, mois, annee]
          )
          
          if (existing.rows.length > 0) {
            // Mettre à jour
            await query(`
              UPDATE cout_par_salaire 
              SET salaire_net = $1, salaire_brut = $2, cout_total = $3, charge = $4, matricule = $5, taxe = $6, impot = $7, updated_at = CURRENT_TIMESTAMP
              WHERE nom = $8 AND prenom = $9 AND mois = $10 AND annee = $11
            `, [salaireNet, salaireBrut, coutTotal, chargeValue, matricule, taxeValue, impotValue, nom, prenom, mois, annee])
            updated++
            console.log('Mis à jour:', nom, prenom, matricule ? `(matricule: ${matricule})` : '')
          } else {
            // Insérer
            await query(`
              INSERT INTO cout_par_salaire (nom, prenom, salaire_net, salaire_brut, cout_total, charge, mois, annee, matricule, taxe, impot)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [nom, prenom, salaireNet, salaireBrut, coutTotal, chargeValue, mois, annee, matricule, taxeValue, impotValue])
            inserted++
            console.log('Inséré:', nom, prenom, matricule ? `(matricule: ${matricule})` : '')
          }
        } catch (error) {
          console.error('Erreur traitement item:', item, error)
          errors++
        }
      }
      
      return NextResponse.json({
        success: true,
        message: `Import terminé: ${inserted} nouveaux, ${updated} mis à jour${errors > 0 ? `, ${errors} erreurs` : ''}`,
        inserted,
        updated,
        errors
      })
    } else {
      // Création d'un seul enregistrement
      const { nom, prenom, salaire_net, salaire_brut, cout_total, charge, mois, annee } = data
      
      const result = await query(`
        INSERT INTO cout_par_salaire (nom, prenom, salaire_net, salaire_brut, cout_total, charge, mois, annee)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [nom, prenom, salaire_net, salaire_brut, cout_total, charge, mois, annee])
      
      return NextResponse.json({
        success: true,
        cout: result.rows[0]
      })
    }
    
  } catch (error) {
    console.error("Erreur POST cout-par-salaire:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// PUT - Mettre à jour un coût par salarié
export async function PUT(request: NextRequest) {
  try {
    const { id, ...updateData } = await request.json()
    
    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 })
    }
    
    const updateFields: string[] = []
    const params: any[] = []
    let paramIndex = 1
    
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`)
        params.push(value)
        paramIndex++
      }
    })
    
    if (updateFields.length === 0) {
      return NextResponse.json({ error: "Aucune donnée à mettre à jour" }, { status: 400 })
    }
    
    params.push(id)
    const queryText = `
      UPDATE cout_par_salaire 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `
    
    const result = await query(queryText, params)
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Coût non trouvé" }, { status: 400 })
    }
    
    return NextResponse.json({
      success: true,
      cout: result.rows[0]
    })
    
  } catch (error) {
    console.error("Erreur PUT cout-par-salaire:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// DELETE - Supprimer un coût par salarié
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 })
    }
    
    const result = await query('DELETE FROM cout_par_salaire WHERE id = $1 RETURNING *', [id])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Coût non trouvé" }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      message: "Coût supprimé avec succès"
    })
    
  } catch (error) {
    console.error("Erreur DELETE cout-par-salaire:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}