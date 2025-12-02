import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import bcrypt from 'bcryptjs'
import { jwtVerify } from 'jose'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification via le cookie
    const token = request.cookies.get('technicien_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Décoder le token pour obtenir l'ID du compte technicien
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'finalfibre-super-secret-jwt-key-2025-technicien-auth')
    const { payload } = await jwtVerify(token, secret)
    const decoded = payload as any

    if (!decoded.userId) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
    }

    const { oldPassword, newPassword } = await request.json()

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: 'Ancien et nouveau mot de passe requis' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' }, { status: 400 })
    }

    // Récupérer le compte technicien avec le hash du mot de passe actuel
    const accountResult = await query(
      'SELECT id, password_hash, technicien_id FROM technicien_accounts WHERE id = $1',
      [decoded.userId]
    )

    if (accountResult.rows.length === 0) {
      return NextResponse.json({ error: 'Compte non trouvé' }, { status: 404 })
    }

    const account = accountResult.rows[0]

    // Vérifier que l'ancien mot de passe est correct
    const isValidOldPassword = await bcrypt.compare(oldPassword, account.password_hash)

    if (!isValidOldPassword) {
      console.log('❌ Ancien mot de passe incorrect pour le compte ID:', decoded.userId)
      return NextResponse.json({ error: 'Ancien mot de passe incorrect' }, { status: 401 })
    }

    // Hasher le nouveau mot de passe
    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    // Mettre à jour le mot de passe dans la base de données
    await query(
      'UPDATE technicien_accounts SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, decoded.userId]
    )

    console.log('✅ Mot de passe changé avec succès pour le compte ID:', decoded.userId)

    return NextResponse.json({
      success: true,
      message: 'Mot de passe changé avec succès'
    })

  } catch (error) {
    console.error('❌ Erreur lors du changement de mot de passe:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
