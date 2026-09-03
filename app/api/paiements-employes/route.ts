import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// Convertit un paramètre en entier, ou renvoie null s'il est absent/invalide.
// Évite d'envoyer NaN ou la chaîne "null" à Postgres (erreur pg_strtoint32_safe).
function toInteger(value: any): number | null {
  if (value === null || value === undefined || value === '' || value === 'null' || value === 'undefined') {
    return null
  }
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : null
}

// GET - Récupérer l'historique des paiements
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeId = toInteger(searchParams.get('employe_id'))
    const coutId = toInteger(searchParams.get('cout_id'))

    // Un filtre fourni mais invalide (ligne prévisionnelle sans id, valeur "null"...) :
    // renvoyer une liste vide plutôt que de faire échouer la requête SQL — et surtout
    // plutôt que de retourner l'intégralité des paiements en ignorant le filtre.
    const filtreInvalide =
      (searchParams.get('employe_id') !== null && employeId === null) ||
      (searchParams.get('cout_id') !== null && coutId === null)

    if (filtreInvalide) {
      return NextResponse.json({
        success: true,
        paiements: [],
        total: 0,
        totalMontant: 0,
        paiementsParMethode: {},
        statistiques: { totalPaiements: 0, totalMontant: 0, montantMoyen: 0, dernierPaiement: null }
      })
    }

    let sqlQuery = `
      SELECT 
        pe.id,
        pe.montant_verse,
        pe.date_paiement,
        pe.methode_paiement,
        pe.reference_paiement,
        pe.commentaires,
        pe.statut,
        pe.created_at,
        pe.updated_at,
        e.nom as employe_nom,
        e.prenom as employe_prenom,
        e.matricule as employe_matricule,
        cps.nom as cout_nom,
        cps.prenom as cout_prenom,
        cps.mois,
        cps.annee
      FROM paiements_employes pe
      LEFT JOIN employes e ON pe.employe_id = e.id
      LEFT JOIN cout_par_salaire cps ON pe.cout_par_salaire_id = cps.id
      WHERE 1=1
    `
    
    const params: any[] = []
    let paramIndex = 1
    
    if (employeId !== null) {
      sqlQuery += ` AND pe.employe_id = $${paramIndex}`
      params.push(employeId)
      paramIndex++
    }
    
    if (coutId !== null) {
      sqlQuery += ` AND pe.cout_par_salaire_id = $${paramIndex}`
      params.push(coutId)
      paramIndex++
    }
    
    sqlQuery += ` ORDER BY pe.date_paiement DESC, pe.created_at DESC`
    
    const result = await query(sqlQuery, params)
    
    // Calculer les statistiques
    const totalPaiements = result.rows.reduce((sum, row) => sum + parseFloat(row.montant_verse), 0)
    const paiementsParMethode = result.rows.reduce((acc, row) => {
      const methode = row.methode_paiement || 'Non spécifié'
      acc[methode] = (acc[methode] || 0) + parseFloat(row.montant_verse)
      return acc
    }, {} as Record<string, number>)
    
    return NextResponse.json({
      success: true,
      paiements: result.rows,
      total: result.rows.length,
      totalMontant: totalPaiements,
      paiementsParMethode,
      statistiques: {
        totalPaiements: result.rows.length,
        totalMontant: totalPaiements,
        montantMoyen: result.rows.length > 0 ? totalPaiements / result.rows.length : 0,
        dernierPaiement: result.rows.length > 0 ? result.rows[0].date_paiement : null
      }
    })
    
  } catch (error) {
    console.error("Erreur API paiements GET:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST - Créer un nouveau paiement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      cout_par_salaire_id,
      employe_id,
      montant_verse,
      date_paiement,
      methode_paiement,
      reference_paiement,
      commentaires
    } = body
    
    // Validation des données
    if (!cout_par_salaire_id || !employe_id || !montant_verse || !date_paiement) {
      return NextResponse.json({ 
        error: "Données manquantes" 
      }, { status: 400 })
    }
    
    // Vérifier que le coût existe
    const coutResult = await query(`
      SELECT id, nom, prenom, total_genere, rap
      FROM cout_par_salaire
      WHERE id = $1
    `, [cout_par_salaire_id])
    
    if (coutResult.rows.length === 0) {
      return NextResponse.json({ 
        error: "Coût non trouvé" 
      }, { status: 404 })
    }
    
    // Vérifier que l'employé existe
    const employeResult = await query(`
      SELECT id, nom, prenom, matricule
      FROM employes
      WHERE id = $1
    `, [employe_id])
    
    if (employeResult.rows.length === 0) {
      return NextResponse.json({ 
        error: "Employé non trouvé" 
      }, { status: 404 })
    }
    
    // Insérer le paiement
    const insertResult = await query(`
      INSERT INTO paiements_employes (
        cout_par_salaire_id,
        employe_id,
        montant_verse,
        date_paiement,
        methode_paiement,
        reference_paiement,
        commentaires,
        statut,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirme', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id
    `, [
      cout_par_salaire_id,
      employe_id,
      parseFloat(montant_verse),
      date_paiement,
      methode_paiement || 'virement',
      reference_paiement || '',
      commentaires || ''
    ])
    
    const paiementId = insertResult.rows[0].id
    
    // Recalculer le RAP
    await query(`
      UPDATE cout_par_salaire
      SET rap = (
        SELECT total_genere - (
          salaire_net + charge + taxe + penalite + 
          COALESCE((SELECT SUM(montant_verse) FROM paiements_employes WHERE cout_par_salaire_id = cout_par_salaire.id), 0)
        )
        FROM cout_par_salaire cps
        WHERE cps.id = cout_par_salaire.id
      ),
      updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [cout_par_salaire_id])
    
    return NextResponse.json({
      success: true,
      paiement_id: paiementId,
      message: "Paiement enregistré avec succès"
    })
    
  } catch (error) {
    console.error("Erreur API paiements POST:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// PUT - Modifier un paiement
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      paiement_id,
      montant_verse,
      date_paiement,
      methode_paiement,
      reference_paiement,
      commentaires
    } = body
    
    if (!paiement_id) {
      return NextResponse.json({ 
        error: "ID du paiement manquant" 
      }, { status: 400 })
    }
    
    // Mettre à jour le paiement
    const updateResult = await query(`
      UPDATE paiements_employes
      SET montant_verse = $1,
          date_paiement = $2,
          methode_paiement = $3,
          reference_paiement = $4,
          commentaires = $5,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING cout_par_salaire_id
    `, [
      parseFloat(montant_verse),
      date_paiement,
      methode_paiement,
      reference_paiement,
      commentaires,
      paiement_id
    ])
    
    if (updateResult.rows.length === 0) {
      return NextResponse.json({ 
        error: "Paiement non trouvé" 
      }, { status: 404 })
    }
    
    const coutId = updateResult.rows[0].cout_par_salaire_id
    
    // Recalculer le RAP
    await query(`
      UPDATE cout_par_salaire
      SET rap = (
        SELECT total_genere - (
          salaire_net + charge + taxe + penalite + 
          COALESCE((SELECT SUM(montant_verse) FROM paiements_employes WHERE cout_par_salaire_id = cout_par_salaire.id), 0)
        )
        FROM cout_par_salaire cps
        WHERE cps.id = cout_par_salaire.id
      ),
      updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [coutId])
    
    return NextResponse.json({
      success: true,
      message: "Paiement modifié avec succès"
    })
    
  } catch (error) {
    console.error("Erreur API paiements PUT:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// DELETE - Supprimer un paiement
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paiementId = searchParams.get('id') || searchParams.get('paiement_id')
    
    if (!paiementId) {
      return NextResponse.json({ 
        error: "ID du paiement manquant" 
      }, { status: 400 })
    }
    
    // Récupérer l'ID du coût avant suppression
    const coutResult = await query(`
      SELECT cout_par_salaire_id
      FROM paiements_employes
      WHERE id = $1
    `, [paiementId])
    
    if (coutResult.rows.length === 0) {
      return NextResponse.json({ 
        error: "Paiement non trouvé" 
      }, { status: 404 })
    }
    
    const coutId = coutResult.rows[0].cout_par_salaire_id
    
    // Supprimer le paiement
    await query(`
      DELETE FROM paiements_employes
      WHERE id = $1
    `, [paiementId])
    
    // Recalculer le RAP
    await query(`
      UPDATE cout_par_salaire
      SET rap = (
        SELECT total_genere - (
          salaire_net + charge + taxe + penalite + 
          COALESCE((SELECT SUM(montant_verse) FROM paiements_employes WHERE cout_par_salaire_id = cout_par_salaire.id), 0)
        )
        FROM cout_par_salaire cps
        WHERE cps.id = cout_par_salaire.id
      ),
      updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [coutId])
    
    return NextResponse.json({
      success: true,
      message: "Paiement supprimé avec succès"
    })
    
  } catch (error) {
    console.error("Erreur API paiements DELETE:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}