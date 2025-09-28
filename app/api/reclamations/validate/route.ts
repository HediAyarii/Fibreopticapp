import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { addNoCacheHeaders } from '@/lib/cache-headers'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { reclamationId, action, adminComment } = await request.json()
    
    console.log('🔍 Debug validation réclamation:', {
      reclamationId,
      action,
      adminComment,
      reclamationIdType: typeof reclamationId,
      parsedId: parseInt(reclamationId)
    })
    
    if (!reclamationId || !action) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Vérifier que la réclamation existe et est en cours
    const reclamationResult = await query(
      'SELECT * FROM reclamations WHERE id = $1 AND statut = $2',
      [parseInt(reclamationId), 'en_cours']
    )

    if (reclamationResult.rows.length === 0) {
      return NextResponse.json({ error: 'Réclamation non trouvée ou déjà traitée' }, { status: 404 })
    }

    let newStatus = ''
    let message = ''

    if (action === 'approve') {
      newStatus = 'resolue'
      message = 'Réclamation validée et marquée comme résolue'
    } else if (action === 'reject') {
      newStatus = 'ouverte'
      message = 'Réclamation rejetée, retournée au technicien'
    } else {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
    }

    // Mettre à jour le statut de la réclamation
    const commentToAdd = adminComment && adminComment.trim() !== '' ? adminComment.trim() : null
    const parsedId = parseInt(reclamationId)
    
    console.log('🔍 Debug UPDATE query:', {
      newStatus,
      commentToAdd,
      parsedId,
      params: [newStatus, commentToAdd, parsedId]
    })
    
    // Requête simplifiée pour éviter les problèmes de type
    if (commentToAdd) {
      await query(`
        UPDATE reclamations 
        SET 
          statut = $1,
          commentaires_internes = COALESCE(commentaires_internes, '') || '\n\nCommentaire admin: ' || $2,
          updated_at = NOW()
        WHERE id = $3
      `, [newStatus, commentToAdd, parsedId])
    } else {
      await query(`
        UPDATE reclamations 
        SET 
          statut = $1,
          updated_at = NOW()
        WHERE id = $2
      `, [newStatus, parsedId])
    }

    console.log(`✅ Réclamation ${reclamationId} ${action === 'approve' ? 'validée' : 'rejetée'} par l'admin`)

    const response = NextResponse.json({
      success: true,
      message,
      newStatus
    })
    
    return addNoCacheHeaders(response)

  } catch (error) {
    console.error('Erreur validation réclamation:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
