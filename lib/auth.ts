import { type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { query } from './database'

export interface SessionUser {
  id: number
  username: string
  email: string
  role: 'admin' | 'employee'
  name: string
}

/**
 * Récupère l'utilisateur connecté depuis le cookie user_token
 * (même vérification que GET /api/auth/user : JWT + session active en base)
 */
export async function getSessionUser(request: NextRequest): Promise<SessionUser | null> {
  const token = request.cookies.get('user_token')?.value
  if (!token) return null

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'finalfibre-super-secret-jwt-key-2025-user-auth')
    await jwtVerify(token, secret)

    const result = await query(`
      SELECT
        u.id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        CASE WHEN u.role_id = 1 THEN 'admin' ELSE 'employee' END as role
      FROM user_sessions us
      JOIN users u ON us.user_id = u.id
      WHERE us.session_token = $1
        AND us.is_active = true
        AND us.expires_at > CURRENT_TIMESTAMP
        AND u.is_active = true
    `, [token])

    if (result.rows.length === 0) return null

    const u = result.rows[0]
    return {
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username
    }
  } catch {
    return null
  }
}

/**
 * Retourne l'utilisateur uniquement s'il est administrateur (role_id = 1), sinon null
 */
export async function getAdminUser(request: NextRequest): Promise<SessionUser | null> {
  const user = await getSessionUser(request)
  return user?.role === 'admin' ? user : null
}
