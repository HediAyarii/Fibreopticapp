import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

// GET - Récupérer les préférences d'un utilisateur
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId est requis' },
        { status: 400 }
      )
    }

    // Vérifier si la table existe, sinon la créer
    await query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) UNIQUE NOT NULL,
        nav_order TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    const result = await query(
      'SELECT nav_order FROM user_preferences WHERE user_id = $1',
      [userId]
    )

    if (result.rows.length > 0 && result.rows[0].nav_order) {
      return NextResponse.json({
        success: true,
        navOrder: JSON.parse(result.rows[0].nav_order)
      })
    }

    return NextResponse.json({
      success: true,
      navOrder: null
    })
  } catch (error: any) {
    console.error('Erreur GET user-preferences:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST - Sauvegarder les préférences d'un utilisateur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, navOrder } = body

    if (!userId || !navOrder) {
      return NextResponse.json(
        { success: false, error: 'userId et navOrder sont requis' },
        { status: 400 }
      )
    }

    // Vérifier si la table existe, sinon la créer
    await query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) UNIQUE NOT NULL,
        nav_order TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // Upsert - insérer ou mettre à jour
    await query(`
      INSERT INTO user_preferences (user_id, nav_order, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET nav_order = $2, updated_at = NOW()
    `, [userId, JSON.stringify(navOrder)])

    return NextResponse.json({
      success: true,
      message: 'Préférences sauvegardées'
    })
  } catch (error: any) {
    console.error('Erreur POST user-preferences:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
