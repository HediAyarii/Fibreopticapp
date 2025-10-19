import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export const dynamic = 'force-dynamic'

// GET - Récupérer les paiements avec filtres
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeId = searchParams.get('employe_id')
    const coutId = searchParams.get('cout_id')
    const mois = searchParams.get('mois')
    const annee = searchParams.get('annee')
    
    let whereClause = ''
    const params: any[] = []
    let paramIndex = 1
    
    const conditions = []
    
    if (employeId) {
      conditions.push(`pe.employe_id = $${paramIndex}`)
      params.push(parseInt(employeId))
      paramIndex++
    }
    
    if (coutId) {
      conditions.push(`pe.cout_par_salaire_id = $${paramIndex}`)
      params.push(parseInt(coutId))
      paramIndex++
    }
    
    if (mois && annee) {
      conditions.push(`cps.mois = $${paramIndex} AND cps.annee = $${paramIndex + 1}`)
      params.push(parseInt(mois), parseInt(annee))
      paramIndex += 2
    }
    
    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ')
    }
    
    const result = await query(`
      SELECT 
        pe.id,
        pe.cout_par_salaire_id,
        pe.employe_id,
        pe.montant_verse,
        pe.date_paiement,
        pe.methode_paiement,
        pe.reference_paiement,
        pe.commentaires,
        pe.statut,
        pe.created_at,
        pe.updated_at,
        -- Informations employé
        e.nom as employe_nom,
        e.prenom as employe_prenom,
        e.matricule as employe_matricule,
        -- Informations cout par salaire
        cps.nom as cout_nom,
        cps.prenom as cout_prenom,
        cps.mois,
        cps.annee,
        cps.salaire_net,
        cps.total_genere,
        cps.rap,
        -- Calcul du total des paiements pour ce cout
        calculer_total_paiements(pe.cout_par_salaire_id) as total_paiements,
        -- Calcul du RAP mis à jour
        calculer_rap_avec_paiements(pe.cout_par_salaire_id) as rap_actuel
      FROM paiements_employes pe
      LEFT JOIN employes e ON pe.employe_id = e.id
      LEFT JOIN cout_par_salaire cps ON pe.cout_par_salaire_id = cps.id
      ${whereClause}
      ORDER BY pe.date_paiement DESC, pe.created_at DESC
    `, params)
    
    return NextResponse.json({ 
      success: true, 
      paiements: result.rows 
    })
    
  } catch (error: any) {
    console.error("Erreur API paiements-employes GET:", error)
    return NextResponse.json({ 
      success: false, 
      error: `Erreur serveur: ${error.message}` 
    }, { status: 500 })
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
      methode_paiement = 'virement',
      reference_paiement,
      commentaires,
      statut = 'confirme'
    } = body
    
    // Validation des données
    if (!cout_par_salaire_id || !employe_id || !montant_verse || !date_paiement) {
      return NextResponse.json({ 
        success: false, 
        error: 'Données manquantes (cout_par_salaire_id, employe_id, montant_verse, date_paiement requis)' 
      }, { status: 400 })
    }
    
    if (montant_verse <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Le montant versé doit être positif' 
      }, { status: 400 })
    }
    
    // Vérifier que le cout_par_salaire existe
    const coutCheck = await query(`
      SELECT id, nom, prenom, mois, annee, salaire_net, total_genere, rap
      FROM cout_par_salaire 
      WHERE id = $1
    `, [cout_par_salaire_id])
    
    if (coutCheck.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Enregistrement cout_par_salaire non trouvé' 
      }, { status: 404 })
    }
    
    // Vérifier que l'employé existe
    const employeCheck = await query(`
      SELECT id, nom, prenom, matricule 
      FROM employes 
      WHERE id = $1 AND statut = 'actif'
    `, [employe_id])
    
    if (employeCheck.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Employé non trouvé ou inactif' 
      }, { status: 404 })
    }
    
    // Vérifier que le montant ne dépasse pas le RAP actuel
    const rapActuel = await query(`
      SELECT calculer_rap_avec_paiements($1) as rap_actuel
    `, [cout_par_salaire_id])
    
    const rap = parseFloat(rapActuel.rows[0].rap_actuel) || 0
    
    if (montant_verse > rap) {
      return NextResponse.json({ 
        success: false, 
        error: `Le montant versé (${montant_verse}€) dépasse le RAP actuel (${rap.toFixed(2)}€)` 
      }, { status: 400 })
    }
    
    // Insérer le paiement
    const result = await query(`
      INSERT INTO paiements_employes (
        cout_par_salaire_id,
        employe_id,
        montant_verse,
        date_paiement,
        methode_paiement,
        reference_paiement,
        commentaires,
        statut
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      cout_par_salaire_id,
      employe_id,
      montant_verse,
      date_paiement,
      methode_paiement,
      reference_paiement,
      commentaires,
      statut
    ])
    
    const nouveauPaiement = result.rows[0]
    
    // Récupérer les informations complètes du paiement
    const paiementComplet = await query(`
      SELECT 
        pe.*,
        e.nom as employe_nom,
        e.prenom as employe_prenom,
        e.matricule as employe_matricule,
        cps.nom as cout_nom,
        cps.prenom as cout_prenom,
        cps.mois,
        cps.annee,
        calculer_total_paiements(pe.cout_par_salaire_id) as total_paiements,
        calculer_rap_avec_paiements(pe.cout_par_salaire_id) as rap_actuel
      FROM paiements_employes pe
      LEFT JOIN employes e ON pe.employe_id = e.id
      LEFT JOIN cout_par_salaire cps ON pe.cout_par_salaire_id = cps.id
      WHERE pe.id = $1
    `, [nouveauPaiement.id])
    
    console.log(`✅ Paiement créé: ${montant_verse}€ pour ${employeCheck.rows[0].nom} ${employeCheck.rows[0].prenom}`)
    
    return NextResponse.json({
      success: true,
      message: 'Paiement enregistré avec succès',
      paiement: paiementComplet.rows[0]
    })
    
  } catch (error: any) {
    console.error("Erreur API paiements-employes POST:", error)
    return NextResponse.json({ 
      success: false, 
      error: `Erreur serveur: ${error.message}` 
    }, { status: 500 })
  }
}

// PUT - Mettre à jour un paiement
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      montant_verse,
      date_paiement,
      methode_paiement,
      reference_paiement,
      commentaires,
      statut
    } = body
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID du paiement requis' 
      }, { status: 400 })
    }
    
    // Vérifier que le paiement existe
    const paiementCheck = await query(`
      SELECT id, cout_par_salaire_id, montant_verse, employe_id
      FROM paiements_employes 
      WHERE id = $1
    `, [id])
    
    if (paiementCheck.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Paiement non trouvé' 
      }, { status: 404 })
    }
    
    // Construire la requête de mise à jour
    const updates = []
    const params = []
    let paramIndex = 1
    
    if (montant_verse !== undefined) {
      if (montant_verse <= 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'Le montant versé doit être positif' 
        }, { status: 400 })
      }
      updates.push(`montant_verse = $${paramIndex}`)
      params.push(montant_verse)
      paramIndex++
    }
    
    if (date_paiement !== undefined) {
      updates.push(`date_paiement = $${paramIndex}`)
      params.push(date_paiement)
      paramIndex++
    }
    
    if (methode_paiement !== undefined) {
      updates.push(`methode_paiement = $${paramIndex}`)
      params.push(methode_paiement)
      paramIndex++
    }
    
    if (reference_paiement !== undefined) {
      updates.push(`reference_paiement = $${paramIndex}`)
      params.push(reference_paiement)
      paramIndex++
    }
    
    if (commentaires !== undefined) {
      updates.push(`commentaires = $${paramIndex}`)
      params.push(commentaires)
      paramIndex++
    }
    
    if (statut !== undefined) {
      updates.push(`statut = $${paramIndex}`)
      params.push(statut)
      paramIndex++
    }
    
    if (updates.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Aucune donnée à mettre à jour' 
      }, { status: 400 })
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    params.push(id)
    
    const result = await query(`
      UPDATE paiements_employes 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, params)
    
    console.log(`✅ Paiement mis à jour: ID ${id}`)
    
    return NextResponse.json({
      success: true,
      message: 'Paiement mis à jour avec succès',
      paiement: result.rows[0]
    })
    
  } catch (error: any) {
    console.error("Erreur API paiements-employes PUT:", error)
    return NextResponse.json({ 
      success: false, 
      error: `Erreur serveur: ${error.message}` 
    }, { status: 500 })
  }
}

// DELETE - Supprimer un paiement
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID du paiement requis' 
      }, { status: 400 })
    }
    
    // Vérifier que le paiement existe
    const paiementCheck = await query(`
      SELECT id, cout_par_salaire_id, montant_verse, employe_id
      FROM paiements_employes 
      WHERE id = $1
    `, [id])
    
    if (paiementCheck.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Paiement non trouvé' 
      }, { status: 404 })
    }
    
    // Supprimer le paiement
    await query(`
      DELETE FROM paiements_employes 
      WHERE id = $1
    `, [id])
    
    console.log(`✅ Paiement supprimé: ID ${id}`)
    
    return NextResponse.json({
      success: true,
      message: 'Paiement supprimé avec succès'
    })
    
  } catch (error: any) {
    console.error("Erreur API paiements-employes DELETE:", error)
    return NextResponse.json({ 
      success: false, 
      error: `Erreur serveur: ${error.message}` 
    }, { status: 500 })
  }
}





