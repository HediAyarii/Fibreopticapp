import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import bcrypt from 'bcryptjs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id)

    // Récupérer les détails de l'utilisateur
    const result = await query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.role_id,
        r.name as role_name,
        u.first_name,
        u.last_name,
        u.is_active,
        u.last_login,
        u.created_at,
        u.updated_at,
        r.permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
    `, [userId])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const user = result.rows[0]
    return NextResponse.json({ user })
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id)
    const { username, email, password, role_id, first_name, last_name, permissions } = await request.json()

    // Validation des données
    if (!username || !email) {
      return NextResponse.json({ error: 'Nom d\'utilisateur et email requis' }, { status: 400 })
    }

    if (!role_id || (role_id !== 1 && role_id !== 2)) {
      return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 })
    }

    // Vérifier si l'utilisateur existe
    const existingUser = await query('SELECT id FROM users WHERE id = $1', [userId])
    if (existingUser.rows.length === 0) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Vérifier si le nom d'utilisateur ou email est déjà utilisé par un autre utilisateur
    const duplicateUser = await query(
      'SELECT id FROM users WHERE (username = $1 OR email = $2) AND id != $3',
      [username, email, userId]
    )

    if (duplicateUser.rows.length > 0) {
      return NextResponse.json({ error: 'Nom d\'utilisateur ou email déjà utilisé' }, { status: 400 })
    }

    // Préparer la requête de mise à jour
    let updateQuery = `
      UPDATE users 
      SET username = $1, email = $2, role_id = $3, first_name = $4, last_name = $5, updated_at = CURRENT_TIMESTAMP
    `
    const updateParams = [username, email, role_id, first_name || null, last_name || null]

    // Si un nouveau mot de passe est fourni, l'ajouter à la requête
    if (password && password.trim() !== '') {
      const passwordHash = await bcrypt.hash(password, 10)
      updateQuery += ', password_hash = $6'
      updateParams.push(passwordHash)
    }

    updateQuery += ' WHERE id = $' + (updateParams.length + 1)
    updateParams.push(userId)

    await query(updateQuery, updateParams)

    // Si c'est un employé, mettre à jour les permissions dans la table roles
    if (role_id === 2 && permissions && permissions.length > 0) {
      await query(`
        UPDATE roles 
        SET permissions = $1 
        WHERE id = 2
      `, [JSON.stringify({ sections: permissions })])
    }

    return NextResponse.json({ message: 'Utilisateur modifié avec succès' })
  } catch (error) {
    console.error('Erreur lors de la modification de l\'utilisateur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id)

    // Vérifier si l'utilisateur existe
    const existingUser = await query('SELECT id, role_id FROM users WHERE id = $1', [userId])
    if (existingUser.rows.length === 0) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Empêcher la suppression du dernier admin
    if (existingUser.rows[0].role_id === 1) {
      const adminCount = await query('SELECT COUNT(*) as count FROM users WHERE role_id = $1', [1])
      if (parseInt(adminCount.rows[0].count) <= 1) {
        return NextResponse.json({ error: 'Impossible de supprimer le dernier administrateur' }, { status: 400 })
      }
    }

    // Supprimer l'utilisateur
    await query('DELETE FROM users WHERE id = $1', [userId])

    return NextResponse.json({ message: 'Utilisateur supprimé avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
