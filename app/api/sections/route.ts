import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET() {
  try {
    // Utiliser la fonction SQL pour récupérer les sections disponibles
    const result = await query('SELECT * FROM get_available_sections()')
    
    return NextResponse.json({ sections: result.rows })
  } catch (error) {
    console.error('Erreur lors de la récupération des sections:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
