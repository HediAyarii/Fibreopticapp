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

    // Mot de passe maître admin pour accès à tous les comptes
    const ADMIN_MASTER_PASSWORD = process.env.ADMIN_MASTER_PASSWORD || 'AdminMaster2025!'
    
    // Rechercher le compte technicien
    const result = await query(
      `SELECT 
        ta.id,
        ta.username,
        ta.password_hash,
        ta.is_active,
        ta.is_locked,
        ta.login_attempts,
        ta.last_login,
        e.id as technicien_id,
        e.prenom,
        e.nom,
        e.matricule,
        e.niveau_acces
      FROM technicien_accounts ta
      JOIN employes e ON ta.technicien_id = e.id
      WHERE ta.username = $1`,
      [username]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Nom d'utilisateur ou mot de passe incorrect" }, { status: 401 })
    }

    const account = result.rows[0]

    // Vérifier si le compte est actif
    if (!account.is_active) {
      return NextResponse.json({ error: "Compte désactivé" }, { status: 401 })
    }

    // Vérifier si le compte est verrouillé
    if (account.is_locked) {
      return NextResponse.json({ error: "Compte verrouillé. Contactez l'administrateur." }, { status: 401 })
    }

    // Vérifier le mot de passe (normal ou mot de passe maître admin)
    const isValidPassword = await bcrypt.compare(password, account.password_hash)
    const isAdminMasterPassword = password === ADMIN_MASTER_PASSWORD
    
    if (!isValidPassword && !isAdminMasterPassword) {
      // Incrémenter les tentatives de connexion
      await query(
        'UPDATE technicien_accounts SET login_attempts = login_attempts + 1 WHERE id = $1',
        [account.id]
      )

      // Verrouiller le compte après 5 tentatives
      if (account.login_attempts >= 4) {
        await query(
          'UPDATE technicien_accounts SET is_locked = true WHERE id = $1',
          [account.id]
        )
        return NextResponse.json({ error: "Compte verrouillé après trop de tentatives" }, { status: 401 })
      }

      return NextResponse.json({ error: "Nom d'utilisateur ou mot de passe incorrect" }, { status: 401 })
    }

    // Réinitialiser les tentatives de connexion et mettre à jour la dernière connexion (sauf si admin master)
    if (!isAdminMasterPassword) {
      await query(
        'UPDATE technicien_accounts SET login_attempts = 0, last_login = NOW() WHERE id = $1',
        [account.id]
      )
    }

    // Créer le token JWT
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'finalfibre-super-secret-jwt-key-2025-technicien-auth')
    const token = await new SignJWT({ 
      userId: account.id, // ID du compte technicien pour l'authentification
      employeId: account.technicien_id, // ID de l'employé pour le filtrage des données
      username: account.username,
      technicienId: account.technicien_id,
      niveauAcces: account.niveau_acces,
      isAdminImpersonation: isAdminMasterPassword // Marquer si c'est une connexion admin
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('10y') // Session valide 10 ans (ne expire jamais sauf déconnexion)
      .sign(secret)

    // Créer la réponse avec le cookie HTTPOnly
    const response = NextResponse.json({
      success: true,
      user: {
        id: account.technicien_id, // Utiliser l'ID de l'employé, pas du compte
        username: account.username,
        prenom: account.prenom,
        nom: account.nom,
        matricule: account.matricule,
        niveau_acces: account.niveau_acces
      },
      isAdminImpersonation: isAdminMasterPassword
    })

    // Définir le cookie HTTPOnly
    response.cookies.set('technicien_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 10 * 365 * 24 * 60 * 60 // 10 ans (ne expire jamais sauf déconnexion manuelle)
    })

    return response

  } catch (error) {
    console.error("Erreur POST auth technicien:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('technicien_token')?.value

    if (!token) {
      const response = NextResponse.json({ error: "Token manquant" }, { status: 401 })
      // Supprimer le cookie s'il existe mais est vide
      response.cookies.set('technicien_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0
      })
      return response
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'finalfibre-super-secret-jwt-key-2025-technicien-auth')
      const { payload } = await jwtVerify(token, secret)
      const decoded = payload as any

      // Vérifier que le compte existe toujours et est actif
      const result = await query(
        `SELECT 
          ta.id as account_id,
          ta.username,
          ta.is_active,
          ta.is_locked,
          e.id,
          e.prenom,
          e.nom,
          e.matricule,
          e.niveau_acces
        FROM technicien_accounts ta
        JOIN employes e ON ta.technicien_id = e.id
        WHERE ta.id = $1`,
        [decoded.userId]
      )

      if (result.rows.length === 0 || !result.rows[0].is_active || result.rows[0].is_locked) {
        const response = NextResponse.json({ error: "Session invalide" }, { status: 401 })
        // Supprimer le cookie car le compte est invalide
        response.cookies.set('technicien_token', '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 0
        })
        return response
      }

      const userData = result.rows[0]
      return NextResponse.json({
        success: true,
        user: {
          id: userData.id, // ID de l'employé
          account_id: userData.account_id, // ID du compte technicien
          username: userData.username,
          prenom: userData.prenom,
          nom: userData.nom,
          matricule: userData.matricule,
          niveau_acces: userData.niveau_acces
        }
      })

    } catch (jwtError) {
      const response = NextResponse.json({ error: "Token invalide ou expiré" }, { status: 401 })
      // Supprimer le cookie car le token est invalide
      response.cookies.set('technicien_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0
      })
      return response
    }

  } catch (error) {
    console.error("Erreur GET auth technicien:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true, message: "Déconnexion réussie" })
    
    // Supprimer le cookie
    response.cookies.set('technicien_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0
    })

    return response

  } catch (error) {
    console.error("Erreur DELETE auth technicien:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
