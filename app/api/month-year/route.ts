import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    console.log('📅 Récupération des mois et années disponibles...')
    
    // Récupérer tous les mois/années actifs
    const result = await query(`
      SELECT 
        id,
        mois,
        annee,
        nom_mois,
        nom_annee,
        date_debut,
        date_fin,
        statut
      FROM mois_annee 
      WHERE statut = 'actif'
      ORDER BY annee, mois
    `)
    
    console.log(`✅ ${result.rows.length} mois/années récupérés`)
    
    return NextResponse.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    })
    
  } catch (error) {
    console.error('❌ Erreur récupération mois/années:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
