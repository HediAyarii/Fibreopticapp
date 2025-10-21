import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    console.log('🔍 Récupération des utilisateurs...')
    
    // D'abord, vérifier si la table users existe
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `)
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Table users n\'existe pas')
      return NextResponse.json({ error: 'Table users non trouvée' }, { status: 500 })
    }
    
    console.log('✅ Table users existe')
    
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
        u.updated_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
    `)

    console.log(`✅ ${result.rows.length} utilisateurs trouvés`)
    return NextResponse.json({ users: result.rows })
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des utilisateurs:', error)
    console.error('Stack:', error.stack)
    return NextResponse.json({ 
      error: 'Erreur serveur', 
      details: error.message 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { username, email, password, role_id, first_name, last_name, permissions } = await request.json()

    // Validation des données
    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Nom d\'utilisateur, email et mot de passe requis' }, { status: 400 })
    }

    if (!role_id || (role_id !== 1 && role_id !== 2)) {
      return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 })
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    )

    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: 'Nom d\'utilisateur ou email déjà utilisé' }, { status: 400 })
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 10)

    // Créer l'utilisateur
    const result = await query(`
      INSERT INTO users (username, email, password_hash, role_id, first_name, last_name)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, username, email, role_id, first_name, last_name, is_active, created_at
    `, [
      username,
      email,
      passwordHash,
      role_id,
      first_name || null,
      last_name || null
    ])

    // Si c'est un employé, mettre à jour les permissions dans la table roles
    if (role_id === 2 && permissions && permissions.length > 0) {
      await query(`
        UPDATE roles 
        SET permissions = $1 
        WHERE id = 2
      `, [JSON.stringify({ sections: permissions })])
    }

    return NextResponse.json({ 
      message: 'Utilisateur créé avec succès',
      user: result.rows[0]
    })
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
