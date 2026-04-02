import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Nom d'utilisateur et mot de passe requis" }, { status: 400 })
    }

    // Rechercher l'utilisateur
    const result = await query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.password_hash,
        u.role_id,
        CASE WHEN u.role_id = 1 THEN 'admin' ELSE 'employee' END as role,
        r.permissions,
        u.is_active,
        u.is_locked,
        u.login_attempts,
        u.last_login
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.username = $1 AND u.is_active = true
    `, [username])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Nom d'utilisateur ou mot de passe incorrect" }, { status: 401 })
    }

    const user = result.rows[0]

    // Vérifier si le compte est verrouillé
    if (user.is_locked) {
      return NextResponse.json({ error: "Compte verrouillé. Contactez l'administrateur." }, { status: 401 })
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      // Incrémenter les tentatives de connexion
      await query(
        'UPDATE users SET login_attempts = login_attempts + 1 WHERE id = $1',
        [user.id]
      )
      return NextResponse.json({ error: "Nom d'utilisateur ou mot de passe incorrect" }, { status: 401 })
    }

    // Réinitialiser les tentatives de connexion et mettre à jour la dernière connexion
    await query(
      'UPDATE users SET login_attempts = 0, last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    )

    // Créer le token JWT
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'finalfibre-super-secret-jwt-key-2025-user-auth')
    const token = await new SignJWT({ 
      userId: user.id, 
      username: user.username, 
      role: user.role 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret)

    // Créer la session
    const sessionResult = await query(`
      INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [
      user.id,
      token,
      request.ip || null,
      request.headers.get('user-agent') || 'unknown',
      new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
    ])

    // Préparer la réponse
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    }

    const response = NextResponse.json({ 
      message: 'Connexion réussie',
      user: userData 
    })

    // Définir le cookie
    response.cookies.set('user_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24h
    })

    return response
  } catch (error) {
    console.error('Erreur lors de la connexion:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('user_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 401 })
    }

    // Vérifier le token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'finalfibre-super-secret-jwt-key-2025-user-auth')
    const { payload } = await jwtVerify(token, secret)

    // Vérifier la session en base
    const sessionResult = await query(`
      SELECT 
        us.id,
        us.user_id,
        us.expires_at,
        us.is_active,
        u.username,
        u.email,
        u.role_id,
        u.first_name,
        u.last_name,
        CASE WHEN u.role_id = 1 THEN 'admin' ELSE 'employee' END as role,
        r.permissions,
        u.is_active as user_is_active
      FROM user_sessions us
      JOIN users u ON us.user_id = u.id
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE us.session_token = $1 AND us.is_active = true AND us.expires_at > CURRENT_TIMESTAMP
    `, [token])

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Session expirée' }, { status: 401 })
    }

    const session = sessionResult.rows[0]

    // Vérifier que l'utilisateur est toujours actif
    if (!session.user_is_active) {
      return NextResponse.json({ error: 'Compte désactivé' }, { status: 401 })
    }

    const userData = {
      id: session.user_id,
      username: session.username,
      email: session.email,
      role: session.role,
      role_id: session.role_id,
      name: `${session.first_name || ''} ${session.last_name || ''}`.trim() || session.username,
      permissions: session.permissions
    }

    return NextResponse.json({ user: userData })
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'authentification:', error)
    return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('user_token')?.value

    if (token) {
      // Désactiver la session
      await query(
        'UPDATE user_sessions SET is_active = false WHERE session_token = $1',
        [token]
      )
    }

    const response = NextResponse.json({ message: 'Déconnexion réussie' })
    response.cookies.delete('user_token')
    return response
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
