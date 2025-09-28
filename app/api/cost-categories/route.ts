import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export const dynamic = 'force-dynamic'

// GET - Récupérer toutes les catégories
export async function GET() {
  try {
    const result = await query(`
      SELECT * FROM cost_categories 
      ORDER BY name
    `)

    return NextResponse.json({
      success: true,
      categories: result.rows
    })

  } catch (error) {
    console.error('Erreur récupération catégories:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer une nouvelle catégorie
export async function POST(request: NextRequest) {
  try {
    const { name, description, color } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Nom de catégorie requis' }, { status: 400 })
    }

    const result = await query(`
      INSERT INTO cost_categories (name, description, color)
      VALUES ($1, $2, $3)
      ON CONFLICT (name) DO UPDATE SET
        description = EXCLUDED.description,
        color = EXCLUDED.color
      RETURNING *
    `, [name, description || '', color || '#3B82F6'])

    return NextResponse.json({
      success: true,
      category: result.rows[0],
      message: 'Catégorie créée avec succès'
    })

  } catch (error) {
    console.error('Erreur création catégorie:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
