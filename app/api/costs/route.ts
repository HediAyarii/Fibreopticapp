import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export const dynamic = 'force-dynamic'

// GET - Récupérer tous les coûts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const type = searchParams.get('type') // 'fixed', 'variable', 'all'

    let result

    if (type === 'fixed') {
      // Récupérer les coûts fixes depuis frais_entreprise
      result = await query(`
        SELECT 
          id,
          fournisseur as name,
          description,
          montant_ttc as amount,
          type_frais as category,
          date_facture as date_facturation,
          statut,
          created_at,
          updated_at
        FROM frais_entreprise 
        WHERE statut = 'actif' AND type_frais = 'Charge Fixe'
        ORDER BY fournisseur
      `)
    } else if (type === 'variable' && month && year) {
      // Récupérer les coûts variables pour un mois spécifique depuis frais_entreprise
      result = await query(`
        SELECT 
          id,
          fournisseur as name,
          description,
          montant_ttc as amount,
          type_frais as category,
          date_facture as date_facturation,
          statut,
          created_at,
          updated_at
        FROM frais_entreprise 
        WHERE EXTRACT(MONTH FROM date_facture) = $1 
        AND EXTRACT(YEAR FROM date_facture) = $2
        AND type_frais = 'Charge Variable'
        ORDER BY fournisseur
      `, [parseInt(month), parseInt(year)])
    } else {
      // Récupérer tous les frais
      result = await query(`
        SELECT 
          id,
          fournisseur as name,
          description,
          montant_ttc as amount,
          type_frais as category,
          date_facture as date_facturation,
          statut,
          created_at,
          updated_at
        FROM frais_entreprise 
        ORDER BY date_facture DESC
        LIMIT 100
      `)
    }

    return NextResponse.json({
      success: true,
      costs: result.rows
    })

  } catch (error) {
    console.error('Erreur récupération coûts:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer un nouveau coût
export async function POST(request: NextRequest) {
  try {
    const { name, description, amount, category, type, month, year } = await request.json()

    if (!name || !amount || !category || !type) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Créer une date de facturation
    let dateFacturation
    if (month && year) {
      dateFacturation = `${year}-${month.toString().padStart(2, '0')}-01`
    } else {
      const now = new Date()
      dateFacturation = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`
    }

    // Déterminer le type de frais et le service code
    let serviceCode, typeFrais
    if (type === 'fixed') {
      serviceCode = 'FIXED-001'
      typeFrais = 'Charge Fixe'
    } else if (type === 'variable') {
      serviceCode = 'VAR-001'
      typeFrais = 'Charge Variable'
    } else {
      return NextResponse.json({ error: 'Type de charge invalide' }, { status: 400 })
    }

    // Créer un frais dans la table frais_entreprise
    const result = await query(`
      INSERT INTO frais_entreprise (
        company_name,
        service_code,
        category,
        numero_facture,
        date_facture,
        fournisseur,
        type_frais,
        montant_ht,
        montant_ttc,
        tva,
        description,
        statut
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'actif')
      RETURNING *
    `, [
      'FinalFibre', // company_name
      serviceCode, // service_code
      category, // category
      `FACT-${Date.now()}`, // numero_facture
      dateFacturation, // date_facture
      name, // fournisseur
      typeFrais, // type_frais
      parseFloat(amount) * 0.8, // montant_ht (80% du montant TTC)
      parseFloat(amount), // montant_ttc
      parseFloat(amount) * 0.2, // tva (20% du montant TTC)
      description, // description
    ])

    return NextResponse.json({
      success: true,
      cost: result.rows[0],
      message: `Charge ${type === 'fixed' ? 'fixe' : 'variable'} créée avec succès`
    })

  } catch (error) {
    console.error('Erreur création charge:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Mettre à jour un coût
export async function PUT(request: NextRequest) {
  try {
    const { id, name, description, amount, category, month, year } = await request.json()

    if (!id || !name || !amount || !category) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Vérifier d'abord si le frais existe
    const existingCost = await query(`
      SELECT id, fournisseur FROM frais_entreprise WHERE id = $1
    `, [parseInt(id)])
    
    if (existingCost.rows.length === 0) {
      return NextResponse.json({ error: 'Charge non trouvée' }, { status: 404 })
    }

    // Créer une date de facturation
    let dateFacturation
    if (month && year) {
      dateFacturation = `${year}-${month.toString().padStart(2, '0')}-01`
    } else {
      const now = new Date()
      dateFacturation = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`
    }

    // Mettre à jour le frais
    const result = await query(`
      UPDATE frais_entreprise 
      SET 
        fournisseur = $1, 
        description = $2, 
        montant_ht = $3,
        montant_ttc = $4,
        tva = $5,
        type_frais = $6, 
        date_facture = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `, [
      name, 
      description, 
      parseFloat(amount) * 0.8, // montant_ht
      parseFloat(amount), // montant_ttc
      parseFloat(amount) * 0.2, // tva
      category, 
      dateFacturation, 
      parseInt(id)
    ])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Aucune modification effectuée' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      cost: result.rows[0],
      message: 'Charge mise à jour avec succès'
    })

  } catch (error) {
    console.error('Erreur mise à jour charge:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer un coût
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')

    if (!id || !type) {
      return NextResponse.json({ error: 'ID et type requis' }, { status: 400 })
    }

    // Vérifier d'abord si le frais existe
    const existingCost = await query(`
      SELECT id, fournisseur, statut, type_frais FROM frais_entreprise WHERE id = $1
    `, [parseInt(id)])
    
    if (existingCost.rows.length === 0) {
      return NextResponse.json({ error: 'Charge non trouvée' }, { status: 404 })
    }
    
    const cost = existingCost.rows[0]
    
    // Vérifier que le type correspond
    const expectedType = type === 'fixed' ? 'Charge Fixe' : 'Charge Variable'
    if (cost.type_frais !== expectedType) {
      return NextResponse.json({ 
        error: `Type de charge incorrect. Attendu: ${expectedType}, trouvé: ${cost.type_frais}` 
      }, { status: 400 })
    }
    
    // Si déjà désactivé, retourner un message approprié
    if (cost.statut === 'inactif') {
      return NextResponse.json({ 
        success: true,
        message: 'Charge déjà désactivée',
        cost: cost
      })
    }
    
    // Pour les charges variables, supprimer complètement
    // Pour les charges fixes, désactiver seulement
    let result
    if (type === 'variable') {
      result = await query(`
        DELETE FROM frais_entreprise 
        WHERE id = $1 AND type_frais = 'Charge Variable'
        RETURNING *
      `, [parseInt(id)])
    } else {
      result = await query(`
        UPDATE frais_entreprise 
        SET statut = 'inactif', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND statut = 'actif' AND type_frais = 'Charge Fixe'
        RETURNING *
      `, [parseInt(id)])
    }

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Aucune modification effectuée' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: type === 'variable' ? 'Charge variable supprimée avec succès' : 'Charge fixe désactivée avec succès'
    })

  } catch (error) {
    console.error('Erreur suppression charge:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
