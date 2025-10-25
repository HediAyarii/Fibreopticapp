import { query } from '@/lib/database'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET - Récupérer les frais d'entreprise par mois
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    if (!month || !year) {
      return NextResponse.json({ error: 'Mois et année requis' }, { status: 400 })
    }

    console.log(`🔍 Recherche des frais d'entreprise pour ${month}/${year}`)

    // Récupérer les frais d'entreprise pour le mois/année spécifié
    const result = await query(`
      SELECT 
        id,
        fournisseur,
        description,
        montant_ttc,
        type_frais,
        date_facture,
        statut,
        created_at,
        updated_at
      FROM frais_entreprise 
      WHERE statut = 'actif'
        AND EXTRACT(MONTH FROM date_facture) = $1 
        AND EXTRACT(YEAR FROM date_facture) = $2
      ORDER BY date_facture DESC, fournisseur
    `, [parseInt(month), parseInt(year)])

    console.log(`✅ Frais d'entreprise trouvés: ${result.rows.length}`)

    return NextResponse.json({
      success: true,
      frais: result.rows,
      total: result.rows.reduce((sum, frais) => sum + parseFloat(frais.montant_ttc || 0), 0)
    })

  } catch (error) {
    console.error('Erreur récupération frais entreprise:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}