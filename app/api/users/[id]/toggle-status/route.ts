import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id)
    const { is_active } = await request.json()

    // Vérifier si l'utilisateur existe
    const existingUser = await query('SELECT id, role FROM users WHERE id = $1', [userId])
    if (existingUser.rows.length === 0) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Empêcher la désactivation du dernier admin
    if (existingUser.rows[0].role === 'admin' && !is_active) {
      const activeAdminCount = await query(
        'SELECT COUNT(*) as count FROM users WHERE role = $1 AND is_active = true',
        ['admin']
      )
      if (parseInt(activeAdminCount.rows[0].count) <= 1) {
        return NextResponse.json({ error: 'Impossible de désactiver le dernier administrateur actif' }, { status: 400 })
      }
    }

    // Mettre à jour le statut
    await query(
      'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [is_active, userId]
    )

    return NextResponse.json({ 
      message: `Utilisateur ${is_active ? 'activé' : 'désactivé'} avec succès` 
    })
  } catch (error) {
    console.error('Erreur lors du changement de statut:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
