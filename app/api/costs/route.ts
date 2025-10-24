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
      // Récupérer les coûts fixes
      result = await query(`
        SELECT fc.*, cc.name as category_name, cc.color as category_color
        FROM fixed_costs fc
        LEFT JOIN cost_categories cc ON fc.category = cc.name
        WHERE fc.is_active = true
        ORDER BY fc.name
      `)
    } else if (type === 'variable' && month && year) {
      // Récupérer les coûts variables pour un mois spécifique
      result = await query(`
        SELECT vc.*, cc.name as category_name, cc.color as category_color
        FROM variable_costs vc
        LEFT JOIN cost_categories cc ON vc.category = cc.name
        WHERE vc.month = $1 AND vc.year = $2
        ORDER BY vc.name
      `, [parseInt(month), parseInt(year)])
    } else if (type === 'summary' && month && year) {
      // Récupérer le résumé des coûts pour un mois
      result = await query(`
        SELECT * FROM costs_summary 
        WHERE month = $1 AND year = $2
      `, [parseInt(month), parseInt(year)])
    } else {
      // Récupérer le résumé de tous les mois
      result = await query(`
        SELECT * FROM costs_summary 
        ORDER BY year DESC, month DESC
        LIMIT 12
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

    let result

    if (type === 'fixed') {
      // Créer un coût fixe
      result = await query(`
        INSERT INTO fixed_costs (name, description, amount, category)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [name, description, parseFloat(amount), category])
    } else if (type === 'variable') {
      // Créer un coût variable
      if (!month || !year) {
        return NextResponse.json({ error: 'Mois et année requis pour les coûts variables' }, { status: 400 })
      }

      result = await query(`
        INSERT INTO variable_costs (name, description, amount, category, month, year)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (name, month, year) 
        DO UPDATE SET 
          description = EXCLUDED.description,
          amount = EXCLUDED.amount,
          category = EXCLUDED.category,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `, [name, description, parseFloat(amount), category, parseInt(month), parseInt(year)])
    } else {
      return NextResponse.json({ error: 'Type de coût invalide' }, { status: 400 })
    }

    // Recalculer les coûts mensuels (si la fonction existe)
    try {
      const currentMonth = month || new Date().getMonth() + 1
      const currentYear = year || new Date().getFullYear()
      await query('SELECT calculate_monthly_costs($1, $2)', [currentMonth, currentYear])
    } catch (error) {
      console.log('⚠️ Fonction calculate_monthly_costs non disponible, calcul manuel...')
      // Calcul manuel si la fonction n'existe pas
      const currentMonth = month || new Date().getMonth() + 1
      const currentYear = year || new Date().getFullYear()
      
      const fixedResult = await query('SELECT COALESCE(SUM(amount), 0) as total FROM fixed_costs WHERE is_active = true')
      const variableResult = await query('SELECT COALESCE(SUM(amount), 0) as total FROM variable_costs WHERE month = $1 AND year = $2', [currentMonth, currentYear])
      
      const fixedTotal = parseFloat(fixedResult.rows[0]?.total || '0')
      const variableTotal = parseFloat(variableResult.rows[0]?.total || '0')
      const totalCosts = fixedTotal + variableTotal
      
      await query(`
        INSERT INTO monthly_costs (month, year, total_fixed_costs, total_variable_costs, total_costs)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (month, year) 
        DO UPDATE SET 
          total_fixed_costs = EXCLUDED.total_fixed_costs,
          total_variable_costs = EXCLUDED.total_variable_costs,
          total_costs = EXCLUDED.total_costs,
          calculated_at = CURRENT_TIMESTAMP
      `, [currentMonth, currentYear, fixedTotal, variableTotal, totalCosts])
    }

    return NextResponse.json({
      success: true,
      cost: result.rows[0],
      message: 'Coût créé avec succès'
    })

  } catch (error) {
    console.error('Erreur création coût:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Mettre à jour un coût
export async function PUT(request: NextRequest) {
  try {
    const { id, name, description, amount, category, type, month, year } = await request.json()

    if (!id || !name || !amount || !category || !type) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    let result

    if (type === 'fixed') {
      // Vérifier d'abord si le coût existe
      const existingCost = await query(`
        SELECT id, name, is_active FROM fixed_costs WHERE id = $1
      `, [parseInt(id)])
      
      if (existingCost.rows.length === 0) {
        return NextResponse.json({ error: 'Coût non trouvé' }, { status: 404 })
      }
      
      // Mettre à jour le coût fixe
      result = await query(`
        UPDATE fixed_costs 
        SET name = $1, description = $2, amount = $3, category = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING *
      `, [name, description, parseFloat(amount), category, parseInt(id)])
      
    } else if (type === 'variable') {
      // Vérifier d'abord si le coût variable existe
      const existingCost = await query(`
        SELECT id, name FROM variable_costs WHERE id = $1
      `, [parseInt(id)])
      
      if (existingCost.rows.length === 0) {
        return NextResponse.json({ error: 'Coût non trouvé' }, { status: 404 })
      }
      
      // Mettre à jour le coût variable
      result = await query(`
        UPDATE variable_costs 
        SET name = $1, description = $2, amount = $3, category = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING *
      `, [name, description, parseFloat(amount), category, parseInt(id)])
      
    } else {
      return NextResponse.json({ error: 'Type de coût invalide' }, { status: 400 })
    }

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Aucune modification effectuée' }, { status: 400 })
    }

    // Recalculer les coûts mensuels (si la fonction existe)
    try {
      const currentMonth = month || new Date().getMonth() + 1
      const currentYear = year || new Date().getFullYear()
      await query('SELECT calculate_monthly_costs($1, $2)', [currentMonth, currentYear])
    } catch (error) {
      console.log('⚠️ Fonction calculate_monthly_costs non disponible, calcul manuel...')
      // Calcul manuel si la fonction n'existe pas
      const currentMonth = month || new Date().getMonth() + 1
      const currentYear = year || new Date().getFullYear()
      
      const fixedResult = await query('SELECT COALESCE(SUM(amount), 0) as total FROM fixed_costs WHERE is_active = true')
      const variableResult = await query('SELECT COALESCE(SUM(amount), 0) as total FROM variable_costs WHERE month = $1 AND year = $2', [currentMonth, currentYear])
      
      const fixedTotal = parseFloat(fixedResult.rows[0]?.total || '0')
      const variableTotal = parseFloat(variableResult.rows[0]?.total || '0')
      const totalCosts = fixedTotal + variableTotal
      
      await query(`
        INSERT INTO monthly_costs (month, year, total_fixed_costs, total_variable_costs, total_costs)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (month, year) 
        DO UPDATE SET 
          total_fixed_costs = EXCLUDED.total_fixed_costs,
          total_variable_costs = EXCLUDED.total_variable_costs,
          total_costs = EXCLUDED.total_costs,
          calculated_at = CURRENT_TIMESTAMP
      `, [currentMonth, currentYear, fixedTotal, variableTotal, totalCosts])
    }

    return NextResponse.json({
      success: true,
      cost: result.rows[0],
      message: 'Coût mis à jour avec succès'
    })

  } catch (error) {
    console.error('Erreur mise à jour coût:', error)
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

    let result

    if (type === 'fixed') {
      // Vérifier d'abord si le coût existe
      const existingCost = await query(`
        SELECT id, name, is_active FROM fixed_costs WHERE id = $1
      `, [parseInt(id)])
      
      if (existingCost.rows.length === 0) {
        return NextResponse.json({ error: 'Coût non trouvé' }, { status: 404 })
      }
      
      const cost = existingCost.rows[0]
      
      // Si déjà désactivé, retourner un message approprié
      if (!cost.is_active) {
        return NextResponse.json({ 
          success: true,
          message: 'Coût déjà désactivé',
          cost: cost
        })
      }
      
      // Désactiver le coût fixe
      result = await query(`
        UPDATE fixed_costs 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND is_active = true
        RETURNING *
      `, [parseInt(id)])
      
    } else if (type === 'variable') {
      // Vérifier d'abord si le coût variable existe
      const existingCost = await query(`
        SELECT id, name FROM variable_costs WHERE id = $1
      `, [parseInt(id)])
      
      if (existingCost.rows.length === 0) {
        return NextResponse.json({ error: 'Coût non trouvé' }, { status: 404 })
      }
      
      // Supprimer le coût variable
      result = await query(`
        DELETE FROM variable_costs 
        WHERE id = $1
        RETURNING *
      `, [parseInt(id)])
      
    } else {
      return NextResponse.json({ error: 'Type de coût invalide' }, { status: 400 })
    }

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Aucune modification effectuée' }, { status: 400 })
    }

    // Recalculer les coûts mensuels (si la fonction existe)
    try {
      await query('SELECT calculate_monthly_costs(EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)')
    } catch (error) {
      console.log('⚠️ Fonction calculate_monthly_costs non disponible, calcul manuel...')
      // Calcul manuel si la fonction n'existe pas
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()
      
      const fixedResult = await query('SELECT COALESCE(SUM(amount), 0) as total FROM fixed_costs WHERE is_active = true')
      const variableResult = await query('SELECT COALESCE(SUM(amount), 0) as total FROM variable_costs WHERE month = $1 AND year = $2', [currentMonth, currentYear])
      
      const fixedTotal = parseFloat(fixedResult.rows[0]?.total || '0')
      const variableTotal = parseFloat(variableResult.rows[0]?.total || '0')
      const totalCosts = fixedTotal + variableTotal
      
      await query(`
        INSERT INTO monthly_costs (month, year, total_fixed_costs, total_variable_costs, total_costs)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (month, year) 
        DO UPDATE SET 
          total_fixed_costs = EXCLUDED.total_fixed_costs,
          total_variable_costs = EXCLUDED.total_variable_costs,
          total_costs = EXCLUDED.total_costs,
          calculated_at = CURRENT_TIMESTAMP
      `, [currentMonth, currentYear, fixedTotal, variableTotal, totalCosts])
    }

    return NextResponse.json({
      success: true,
      message: 'Coût supprimé avec succès'
    })

  } catch (error) {
    console.error('Erreur suppression coût:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
