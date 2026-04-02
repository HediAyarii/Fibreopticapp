import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'

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
    // Normaliser le rôle: role_id=1 → admin, sinon → employee
    const normalizedRole = user.role_id === 1 ? 'admin' : 'employee'
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: normalizedRole,
      role_id: user.role_id,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
      permissions: user.permissions || { sections: [] }
    }

    // Créer le token JWT
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'finalfibre-super-secret-jwt-key-2025-user-auth')
    const token = await new SignJWT({ 
      userId: user.id, 
      username: user.username, 
      role: normalizedRole 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret)

    // Créer la session en base de données
    await query(`
      INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, expires_at)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      user.id,
      token,
      request.ip || null,
      request.headers.get('user-agent') || 'unknown',
      new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
    ])

    const response = NextResponse.json({ 
      message: 'Connexion réussie',
      user: userData
    })

    // Définir le cookie httpOnly pour persister la session
    response.cookies.set('user_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24h
    })

    return response
  } catch (error) {
    console.error('❌ Erreur lors de la connexion:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
