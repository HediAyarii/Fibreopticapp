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
    
    // Récupérer les données de base avec synchronisation automatique des taxes
    const result = await query(`
      SELECT 
        cps.id,
        cps.nom,
        cps.prenom,
        cps.salaire_net,
        cps.salaire_brut,
        cps.cout_total,
        cps.charge,
        cps.mois,
        cps.annee,
        cps.matricule,
        -- Synchroniser automatiquement avec la table employes
        COALESCE(e.pourcentage_taxe, cps.taxe, 0) as taxe,
        -- Recalculer l'impôt basé sur la taxe synchronisée
        CASE 
          WHEN ABS(COALESCE(e.pourcentage_taxe, cps.taxe, 0) - 100) < 0.01 THEN 0
          WHEN ABS(COALESCE(e.pourcentage_taxe, cps.taxe, 0) - 50) < 0.01 THEN cps.charge / 2
          WHEN ABS(COALESCE(e.pourcentage_taxe, cps.taxe, 0)) < 0.01 THEN cps.charge
          ELSE cps.charge * (COALESCE(e.pourcentage_taxe, cps.taxe, 0) / 100)
        END as impot,
        cps.penalite,
        cps.prime,
        cps.total_genere,
        -- Calculer automatiquement le RAP avec la formule correcte (incluant la prime)
        (cps.total_genere - cps.salaire_net - 
         CASE 
           WHEN ABS(COALESCE(e.pourcentage_taxe, cps.taxe, 0) - 100) < 0.01 THEN 0
           WHEN ABS(COALESCE(e.pourcentage_taxe, cps.taxe, 0) - 50) < 0.01 THEN cps.charge / 2
           WHEN ABS(COALESCE(e.pourcentage_taxe, cps.taxe, 0)) < 0.01 THEN cps.charge
           ELSE cps.charge * (COALESCE(e.pourcentage_taxe, cps.taxe, 0) / 100)
         END + COALESCE(cps.prime, 0)) as rap,
        cps.created_at,
        cps.updated_at
      FROM cout_par_salaire cps
      LEFT JOIN employes e ON cps.matricule = e.matricule AND e.statut = 'actif'
      ${whereClause}
      ORDER BY cps.annee DESC, cps.mois DESC, cps.nom, cps.prenom
    `, params)
    
    // Calculer le total des paiements et le RAP final pour chaque employé
    const coutsWithRevenue = await Promise.all(
      result.rows.map(async (cout: any) => {
        try {
          // Récupérer le total des paiements
            const paiementsResult = await query(`
              SELECT calculer_total_paiements($1) as total_paiements
            `, [cout.id])
            
            const totalPaiements = parseFloat(paiementsResult.rows[0].total_paiements) || 0
            
            // Calculer le RAP final (RAP de base - paiements)
            const rapFinal = parseFloat(cout.rap) - totalPaiements
            
            return {
              ...cout,
              total_paiements: totalPaiements,
              rap: rapFinal  // RAP final avec paiements déduits
          }
        } catch (error) {
          console.error(`Erreur calcul paiements pour ${cout.nom} ${cout.prenom}:`, error)
            return {
              ...cout,
            total_paiements: 0,
            rap: parseFloat(cout.rap)  // RAP de base si erreur
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
    
    // Si la prime a été mise à jour, recalculer le RAP
    if (updateData.prime !== undefined) {
      const cout = result.rows[0]
      const impot = parseFloat(cout.charge) * 0.5 // Calculer l'impôt (50% de la charge)
      const newRap = parseFloat(cout.total_genere) - parseFloat(cout.salaire_net) - impot + parseFloat(cout.prime)
      
      // Désactiver temporairement les triggers pour éviter les conflits
      await query('ALTER TABLE cout_par_salaire DISABLE TRIGGER trigger_recalcul_rap;')
      await query('ALTER TABLE cout_par_salaire DISABLE TRIGGER trigger_calcul_rap_auto;')
      
      try {
        // Mettre à jour le RAP dans la base de données
        await query(`
          UPDATE cout_par_salaire 
          SET rap = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [newRap, cout.id])
        
        // Récupérer les données mises à jour
        const updatedResult = await query(`
          SELECT * FROM cout_par_salaire WHERE id = $1
        `, [cout.id])
        
        return NextResponse.json({
          success: true,
          cout: updatedResult.rows[0]
        })
      } finally {
        // Réactiver les triggers
        await query('ALTER TABLE cout_par_salaire ENABLE TRIGGER trigger_recalcul_rap;')
        await query('ALTER TABLE cout_par_salaire ENABLE TRIGGER trigger_calcul_rap_auto;')
      }
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