import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import bcrypt from 'bcryptjs'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const result = await query(`
      SELECT 
        ta.id,
        ta.technicien_id,
        ta.username,
        ta.is_active,
        ta.is_locked,
        ta.login_attempts,
        ta.last_login,
        ta.created_at,
        e.prenom as technicien_prenom,
        e.nom as technicien_nom,
        e.matricule as technicien_matricule,
        e.email as technicien_email,
        e.niveau_acces as technicien_niveau_acces
      FROM technicien_accounts ta
      JOIN employes e ON ta.technicien_id = e.id
      ORDER BY ta.created_at DESC
    `)

    return NextResponse.json({
      success: true,
      accounts: result.rows
    })

  } catch (error) {
    console.error("Erreur GET technicien accounts:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { technicien_id, username, password, is_active = true } = await request.json()

    if (!technicien_id || !username) {
      return NextResponse.json({ error: "ID technicien et nom d'utilisateur requis" }, { status: 400 })
    }

    // Vérifier si le technicien existe
    const technicienResult = await query(
      'SELECT id, prenom, nom, matricule FROM employes WHERE id = $1',
      [technicien_id]
    )

    if (technicienResult.rows.length === 0) {
      return NextResponse.json({ error: "Technicien non trouvé" }, { status: 404 })
    }

    // Vérifier si le nom d'utilisateur existe déjà
    const existingUser = await query(
      'SELECT id FROM technicien_accounts WHERE username = $1',
      [username]
    )

    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: "Nom d'utilisateur déjà utilisé" }, { status: 400 })
    }

    // Vérifier si le technicien a déjà un compte
    const existingAccount = await query(
      'SELECT id FROM technicien_accounts WHERE technicien_id = $1',
      [technicien_id]
    )

    if (existingAccount.rows.length > 0) {
      return NextResponse.json({ error: "Ce technicien a déjà un compte" }, { status: 400 })
    }

    // Générer le mot de passe
    let passwordHash
    if (password && password.trim()) {
      passwordHash = await bcrypt.hash(password, 10)
    } else {
      // Mot de passe par défaut : matricule + "123"
      const technicien = technicienResult.rows[0]
      const defaultPassword = technicien.matricule + "123"
      passwordHash = await bcrypt.hash(defaultPassword, 10)
    }

    // Créer le compte
    const result = await query(
      `INSERT INTO technicien_accounts (technicien_id, username, password_hash, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [technicien_id, username, passwordHash, is_active]
    )

    return NextResponse.json({
      success: true,
      account: result.rows[0],
      message: "Compte technicien créé avec succès"
    })

  } catch (error) {
    console.error("Erreur POST technicien accounts:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, is_active, is_locked, password } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID du compte requis" }, { status: 400 })
    }

    let updateQuery = 'UPDATE technicien_accounts SET '
    const params: any[] = []
    let paramCount = 0

    if (is_active !== undefined) {
      paramCount++
      updateQuery += `is_active = $${paramCount}, `
      params.push(is_active)
    }

    if (is_locked !== undefined) {
      paramCount++
      updateQuery += `is_locked = $${paramCount}, `
      params.push(is_locked)
    }

    if (password && password.trim()) {
      paramCount++
      const passwordHash = await bcrypt.hash(password, 10)
      updateQuery += `password_hash = $${paramCount}, `
      params.push(passwordHash)
    }

    // Supprimer la virgule finale
    updateQuery = updateQuery.slice(0, -2)

    paramCount++
    updateQuery += ` WHERE id = $${paramCount} RETURNING *`
    params.push(id)

    const result = await query(updateQuery, params)

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Compte non trouvé" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      account: result.rows[0],
      message: "Compte mis à jour avec succès"
    })

  } catch (error) {
    console.error("Erreur PUT technicien accounts:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "ID du compte requis" }, { status: 400 })
    }

    const result = await query(
      'DELETE FROM technicien_accounts WHERE id = $1 RETURNING *',
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Compte non trouvé" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Compte supprimé avec succès"
    })

  } catch (error) {
    console.error("Erreur DELETE technicien accounts:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
