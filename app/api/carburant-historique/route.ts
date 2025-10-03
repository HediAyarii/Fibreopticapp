import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export const dynamic = 'force-dynamic'

// Récupérer l'historique d'une carte ou d'un employé
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const numero_carte = searchParams.get('numero_carte')
    const employe_id = searchParams.get('employe_id')
    const type = searchParams.get('type') || 'carte' // 'carte' ou 'employe'

    if (type === 'carte' && numero_carte) {
      // Historique d'une carte spécifique
      const historiqueQuery = `
        SELECT * FROM historique_carte($1)
        ORDER BY date_mouvement DESC
      `
      
      const result = await query(historiqueQuery, [numero_carte])
      
      return NextResponse.json({
        success: true,
        historique: result.rows,
        numero_carte: numero_carte,
        type: 'carte'
      })

    } else if (type === 'employe' && employe_id) {
      // Historique des assignations d'un employé
      const employeHistoriqueQuery = `
        SELECT 
          ca.numero_carte,
          ca.date_debut,
          ca.date_fin_prevue,
          ca.date_fin_reelle,
          ca.statut,
          ca.commentaires,
          c.montant as montant_carte,
          CASE 
            WHEN ca.date_fin_reelle IS NOT NULL THEN 'terminee'
            WHEN ca.date_fin_prevue IS NOT NULL AND ca.date_fin_prevue < CURRENT_DATE THEN 'expiree'
            ELSE 'active'
          END as statut_reel,
          ca.created_at
        FROM carburant_assignations ca
        LEFT JOIN carburant c ON ca.numero_carte = c.numero_carte
        WHERE ca.employe_id = $1
        ORDER BY ca.date_debut DESC
      `
      
      const result = await query(employeHistoriqueQuery, [parseInt(employe_id)])
      
      return NextResponse.json({
        success: true,
        historique: result.rows,
        employe_id: employe_id,
        type: 'employe'
      })

    } else {
      // Historique général des mouvements
      const mouvementsQuery = `
        SELECT 
          cm.*,
          e1.prenom || ' ' || e1.nom as employe_precedent_nom,
          e2.prenom || ' ' || e2.nom as employe_nouveau_nom,
          e3.prenom || ' ' || e3.nom as assignee_par_nom
        FROM carburant_mouvements cm
        LEFT JOIN employes e1 ON cm.employe_id_precedent = e1.id
        LEFT JOIN employes e2 ON cm.employe_id_nouveau = e2.id
        LEFT JOIN employes e3 ON cm.assignee_par = e3.id
        ORDER BY cm.date_mouvement DESC
        LIMIT 100
      `
      
      const result = await query(mouvementsQuery)
      
      return NextResponse.json({
        success: true,
        mouvements: result.rows,
        type: 'general'
      })
    }

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération de l\'historique' 
    }, { status: 500 })
  }
}

// Ajouter un mouvement manuel (transfert, suspension, etc.)
export async function POST(request: NextRequest) {
  try {
    const { 
      numero_carte,
      employe_id_precedent,
      employe_id_nouveau,
      type_mouvement,
      motif,
      assignee_par
    } = await request.json()

    if (!numero_carte || !type_mouvement) {
      return NextResponse.json({ 
        error: 'numero_carte et type_mouvement sont requis' 
      }, { status: 400 })
    }

    const insertQuery = `
      INSERT INTO carburant_mouvements (
        numero_carte,
        employe_id_precedent,
        employe_id_nouveau,
        type_mouvement,
        motif,
        assignee_par
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `

    const result = await query(insertQuery, [
      numero_carte,
      employe_id_precedent || null,
      employe_id_nouveau || null,
      type_mouvement,
      motif || null,
      assignee_par || null
    ])

    return NextResponse.json({
      success: true,
      mouvement: result.rows[0],
      message: `Mouvement ${type_mouvement} enregistré pour la carte ${numero_carte}`
    })

  } catch (error) {
    console.error('Erreur lors de l\'ajout du mouvement:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de l\'ajout du mouvement' 
    }, { status: 500 })
  }
}
