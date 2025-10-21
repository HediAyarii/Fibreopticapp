import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Début de la libération automatique des assignations expirées')
    
    const pool = getPool()
    
    // Identifier les assignations expirées
    const expiredQuery = `
      SELECT id, carte_id, employe_id, date_fin
      FROM carburant_assignations 
      WHERE statut = 'active' 
        AND date_fin IS NOT NULL 
        AND date_fin < CURRENT_DATE
    `
    
    const expiredResult = await pool.query(expiredQuery)
    
    if (expiredResult.rows.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucune assignation expirée trouvée',
        expired_count: 0,
        liberated_count: 0
      })
    }
    
    console.log(`🔄 ${expiredResult.rows.length} assignation(s) expirée(s) détectée(s)`)
    
    // Désactiver les assignations expirées
    const deactivateQuery = `
      UPDATE carburant_assignations 
      SET statut = 'expired',
          updated_at = NOW(),
          commentaires = CASE 
            WHEN commentaires IS NULL OR commentaires = '' 
            THEN 'Libération automatique - assignation expirée le ' || TO_CHAR(date_fin, 'DD/MM/YYYY')
            ELSE commentaires || ' | Libération automatique - assignation expirée le ' || TO_CHAR(date_fin, 'DD/MM/YYYY')
          END
      WHERE statut = 'active' 
        AND date_fin IS NOT NULL 
        AND date_fin < CURRENT_DATE
      RETURNING id, carte_id, employe_id, date_fin
    `
    
    const deactivateResult = await pool.query(deactivateQuery)
    
    // Créer des mouvements d'historique pour chaque assignation libérée
    for (const assignment of deactivateResult.rows) {
      const movementQuery = `
        INSERT INTO carburant_mouvements (
          numero_carte,
          employe_id_precedent,
          type_mouvement,
          motif,
          commentaires
        ) VALUES ($1, $2, 'liberation_automatique', 'Assignation expirée', 'Libération automatique - date de fin atteinte')
      `
      await pool.query(movementQuery, [assignment.carte_id, assignment.employe_id])
    }
    
    console.log(`✅ ${deactivateResult.rows.length} assignation(s) libérée(s) automatiquement`)
    
    return NextResponse.json({
      success: true,
      message: `Libération automatique terminée`,
      expired_count: expiredResult.rows.length,
      liberated_count: deactivateResult.rows.length,
      liberated_assignations: deactivateResult.rows.map(row => ({
        id: row.id,
        carte_id: row.carte_id,
        employe_id: row.employe_id,
        date_fin: row.date_fin
      }))
    })
    
  } catch (error) {
    console.error('❌ Erreur lors de la libération automatique des assignations:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la libération automatique des assignations',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Vérification des assignations expirées')
    
    const pool = getPool()
    
    // Vérifier les assignations qui vont expirer dans les 7 prochains jours
    const upcomingExpiryQuery = `
      SELECT 
        ca.id,
        ca.carte_id,
        ca.employe_id,
        ca.date_fin,
        e.nom,
        e.prenom,
        e.matricule
      FROM carburant_assignations ca
      LEFT JOIN employes e ON ca.employe_id = e.id
      WHERE ca.statut = 'active' 
        AND ca.date_fin IS NOT NULL 
        AND ca.date_fin BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
      ORDER BY ca.date_fin ASC
    `
    
    const upcomingResult = await pool.query(upcomingExpiryQuery)
    
    // Vérifier les assignations déjà expirées
    const expiredQuery = `
      SELECT 
        ca.id,
        ca.carte_id,
        ca.employe_id,
        ca.date_fin,
        e.nom,
        e.prenom,
        e.matricule
      FROM carburant_assignations ca
      LEFT JOIN employes e ON ca.employe_id = e.id
      WHERE ca.statut = 'active' 
        AND ca.date_fin IS NOT NULL 
        AND ca.date_fin < CURRENT_DATE
      ORDER BY ca.date_fin ASC
    `
    
    const expiredResult = await pool.query(expiredQuery)
    
    return NextResponse.json({
      success: true,
      upcoming_expiry: upcomingResult.rows,
      expired_assignations: expiredResult.rows,
      summary: {
        upcoming_count: upcomingResult.rows.length,
        expired_count: expiredResult.rows.length
      }
    })
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des assignations:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la vérification des assignations',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}




