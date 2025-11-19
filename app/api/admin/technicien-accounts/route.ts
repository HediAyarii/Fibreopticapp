import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import bcrypt from 'bcryptjs'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Récupérer tous les comptes techniciens avec les informations des employés
    const result = await query(`
      SELECT 
        ta.id,
        ta.username,
        ta.is_active,
        ta.is_locked,
        ta.login_attempts,
        ta.created_at,
        ta.last_login,
        e.id as technicien_id,
        e.prenom,
        e.nom,
        e.matricule,
        e.niveau_acces
      FROM technicien_accounts ta
      JOIN employes e ON ta.technicien_id = e.id
      ORDER BY ta.created_at DESC
    `)

    return NextResponse.json({
      success: true,
      accounts: result.rows
    })
  } catch (error) {
    console.error('Erreur GET comptes techniciens:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { technicien_id, username, password } = await request.json()

    if (!technicien_id || !username || !password) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Vérifier que l'employé existe
    const employeResult = await query(
      'SELECT id, prenom, nom, matricule FROM employes WHERE id = $1',
      [technicien_id]
    )

    if (employeResult.rows.length === 0) {
      return NextResponse.json({ error: 'Employé non trouvé' }, { status: 404 })
    }

    // Vérifier que l'employé n'a pas déjà un compte
    const existingAccount = await query(
      'SELECT id FROM technicien_accounts WHERE technicien_id = $1',
      [technicien_id]
    )

    if (existingAccount.rows.length > 0) {
      return NextResponse.json({ error: 'Cet employé a déjà un compte technicien' }, { status: 400 })
    }

    // Vérifier que le nom d'utilisateur n'est pas déjà pris
    const existingUsername = await query(
      'SELECT id FROM technicien_accounts WHERE username = $1',
      [username]
    )

    if (existingUsername.rows.length > 0) {
      return NextResponse.json({ error: 'Ce nom d\'utilisateur est déjà pris' }, { status: 400 })
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 10)

    // Créer le compte
    const result = await query(`
      INSERT INTO technicien_accounts (
        technicien_id,
        username,
        password_hash,
        is_active,
        is_locked,
        login_attempts,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      technicien_id,
      username,
      passwordHash,
      true,  // is_active
      false, // is_locked
      0,     // login_attempts
      new Date()
    ])

    return NextResponse.json({
      success: true,
      account: result.rows[0],
      message: 'Compte technicien créé avec succès'
    })

  } catch (error) {
    console.error('Erreur POST compte technicien:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, is_active, is_locked, password, reset_login_attempts } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }

    let updateFields = []
    let params = []
    let paramIndex = 1

    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex}`)
      params.push(is_active)
      paramIndex++
    }

    if (is_locked !== undefined) {
      updateFields.push(`is_locked = $${paramIndex}`)
      params.push(is_locked)
      paramIndex++
    }

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10)
      updateFields.push(`password_hash = $${paramIndex}`)
      params.push(passwordHash)
      paramIndex++
    }

    // Réinitialiser les tentatives de connexion et déverrouiller le compte
    if (reset_login_attempts) {
      updateFields.push(`login_attempts = $${paramIndex}`)
      params.push(0)
      paramIndex++
      updateFields.push(`is_locked = $${paramIndex}`)
      params.push(false)
      paramIndex++
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'Aucune donnée à mettre à jour' }, { status: 400 })
    }

    params.push(id)
    const queryText = `
      UPDATE technicien_accounts 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await query(queryText, params)

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Compte non trouvé' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      account: result.rows[0],
      message: 'Compte mis à jour avec succès'
    })

  } catch (error) {
    console.error('Erreur PUT compte technicien:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }

    const result = await query(
      'DELETE FROM technicien_accounts WHERE id = $1 RETURNING *',
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Compte non trouvé' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Compte supprimé avec succès'
    })

  } catch (error) {
    console.error('Erreur DELETE compte technicien:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}