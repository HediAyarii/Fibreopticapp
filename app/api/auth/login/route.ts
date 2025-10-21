import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 })
    }

    console.log('🔍 Tentative de connexion pour:', email)

    // Rechercher l'utilisateur dans la table users
    const result = await query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.password_hash,
        u.role_id,
        u.first_name,
        u.last_name,
        u.is_active,
        r.name as role_name,
        r.permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = $1 AND u.is_active = true
    `, [email])

    if (result.rows.length === 0) {
      console.log('❌ Utilisateur non trouvé:', email)
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 })
    }

    const user = result.rows[0]
    console.log('✅ Utilisateur trouvé:', user.username)

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      console.log('❌ Mot de passe incorrect pour:', email)
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 })
    }

    console.log('✅ Connexion réussie pour:', user.username)

    // Mettre à jour la dernière connexion
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    )

    // Préparer les données utilisateur pour le frontend
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role_name,
      role_id: user.role_id,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
      permissions: user.permissions || { sections: [] }
    }

    return NextResponse.json({ 
      message: 'Connexion réussie',
      user: userData
    })
  } catch (error) {
    console.error('❌ Erreur lors de la connexion:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
