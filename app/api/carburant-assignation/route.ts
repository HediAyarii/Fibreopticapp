import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    console.log('✅ Connexion PostgreSQL établie avec succès')
    
    const { searchParams } = new URL(request.url)
    const employeId = searchParams.get('employe_id')
    
    // Libérer automatiquement les assignations expirées
    await libererAssignationsExpirees()
    
    let query: string
    let params: any[] = []
    
    if (employeId) {
      // Récupérer la carte carburant assignée aujourd'hui à un employé spécifique
      query = `
        SELECT 
          ca.carte_id as numero_carte,
          ca.employe_id,
          ca.date_assignation,
          ca.date_fin,
          ca.statut,
          ca.created_at,
          e.nom as employe_nom,
          e.prenom as employe_prenom,
          e.matricule as employe_matricule
        FROM carburant_assignations ca
        LEFT JOIN employes e ON ca.employe_id = e.id
        WHERE ca.employe_id = $1 
          AND ca.statut = 'active'
          AND (ca.date_fin IS NULL OR ca.date_fin >= CURRENT_DATE)
          AND ca.statut != 'expired'
        ORDER BY ca.date_assignation DESC
        LIMIT 1
      `
      params = [employeId]
    } else {
      // Récupérer l'historique complet de la consommation carburant
      query = `
        SELECT 
          cc.*,
          e.nom as employe_nom,
          e.prenom as employe_prenom,
          e.matricule as employe_matricule
        FROM carburant_consommation cc
        LEFT JOIN employes e ON cc.employe_assigné = e.id
        ORDER BY cc.date_livraison DESC, cc.created_at DESC
        LIMIT 1000
      `
    }
    
    const startTime = Date.now()
    const pool = getPool()
    const result = await pool.query(query, params)
    const duration = Date.now() - startTime
    
    console.log(`📊 Query executed in ${duration}ms: ${query.substring(0, 100)}...`)
    
    if (employeId) {
      // Retourner l'assignation actuelle pour un employé spécifique
      return NextResponse.json({
        assignation: result.rows[0] || null
      })
    } else {
      // Retourner l'historique complet
      return NextResponse.json(result.rows)
    }
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des assignations:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des assignations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { numero_carte, employe_id, employe_nom, date_assignation, statut, commentaires } = data
    
    console.log('✅ Connexion PostgreSQL établie avec succès')
    
    const pool = getPool()
    
    // Vérifier si l'employé a déjà une carte assignée
    const checkQuery = `
      SELECT id, numero_carte, statut, employe_nom
      FROM carburant_assignations 
      WHERE employe_id = $1 AND statut = 'active'
    `
    
    const checkResult = await pool.query(checkQuery, [employe_id])
    
    if (checkResult.rows.length > 0) {
      const oldAssignment = checkResult.rows[0]
      console.log(`📊 Transfert de carte détecté: ${oldAssignment.numero_carte} de ${oldAssignment.employe_nom} vers ${employe_nom}`)
      
      // Désactiver l'ancienne assignation avec date de fin
      const deactivateQuery = `
        UPDATE carburant_assignations 
        SET statut = 'inactive', 
            date_fin = NOW(),
            commentaires = CASE 
              WHEN commentaires IS NULL OR commentaires = '' 
              THEN 'Transfert vers ' || $2 || ' le ' || TO_CHAR(NOW(), 'DD/MM/YYYY à HH24:MI')
              ELSE commentaires || ' | Transfert vers ' || $2 || ' le ' || TO_CHAR(NOW(), 'DD/MM/YYYY à HH24:MI')
            END,
            updated_at = NOW()
        WHERE employe_id = $1 AND statut = 'active'
      `
      await pool.query(deactivateQuery, [employe_id, employe_nom])
      console.log(`📊 Ancienne carte ${oldAssignment.numero_carte} désactivée pour l'employé ${employe_id}`)
      
      // Retirer l'assignation de la table carburant_consommation pour l'ancienne carte
      const removeOldAssignmentQuery = `
        UPDATE carburant_consommation 
        SET employe_assigné = NULL
        WHERE numero_carte = $1
      `
      await pool.query(removeOldAssignmentQuery, [oldAssignment.numero_carte])
      console.log(`📊 Ancienne assignation retirée de carburant_consommation pour carte ${oldAssignment.numero_carte}`)
    }
    
    // Vérifier si la carte est déjà assignée à un autre employé
    const cardCheckQuery = `
      SELECT id, employe_id, employe_nom, statut
      FROM carburant_assignations 
      WHERE numero_carte = $1 AND statut = 'active'
    `
    
    const cardCheckResult = await pool.query(cardCheckQuery, [numero_carte])
    
    if (cardCheckResult.rows.length > 0) {
      const currentAssignment = cardCheckResult.rows[0]
      console.log(`📊 Carte ${numero_carte} actuellement assignée à ${currentAssignment.employe_nom}, transfert en cours...`)
      
      // Désactiver l'assignation actuelle de la carte
      const deactivateCardQuery = `
        UPDATE carburant_assignations 
        SET statut = 'inactive', 
            date_fin = NOW(),
            commentaires = CASE 
              WHEN commentaires IS NULL OR commentaires = '' 
              THEN 'Transfert de ' || $2 || ' vers ' || $3 || ' le ' || TO_CHAR(NOW(), 'DD/MM/YYYY à HH24:MI')
              ELSE commentaires || ' | Transfert de ' || $2 || ' vers ' || $3 || ' le ' || TO_CHAR(NOW(), 'DD/MM/YYYY à HH24:MI')
            END,
            updated_at = NOW()
        WHERE numero_carte = $1 AND statut = 'active'
      `
      await pool.query(deactivateCardQuery, [numero_carte, currentAssignment.employe_nom, employe_nom])
      console.log(`📊 Carte ${numero_carte} désactivée pour ${currentAssignment.employe_nom}`)
    }
    
    // Créer la nouvelle assignation avec commentaires de transfert
    const transferComment = cardCheckResult.rows.length > 0 
      ? `Assignation le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}${commentaires ? ' | ' + commentaires : ''}`
      : `Nouvelle assignation le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}${commentaires ? ' | ' + commentaires : ''}`
    
    const insertQuery = `
      INSERT INTO carburant_assignations (
        numero_carte, 
        employe_id, 
        employe_nom, 
        date_assignation, 
        statut,
        commentaires,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `
    
    const startTime = Date.now()
    const result = await pool.query(insertQuery, [
      numero_carte,
      employe_id,
      employe_nom,
      date_assignation || new Date().toISOString().split('T')[0],
      statut || 'active',
      transferComment
    ])
    const duration = Date.now() - startTime
    
    console.log(`📊 Query executed in ${duration}ms: ${insertQuery.substring(0, 100)}...`)
    
    // Mettre à jour la table carburant_consommation pour associer la carte à l'employé
    const updateConsumptionQuery = `
      UPDATE carburant_consommation 
      SET employe_assigné = $1
      WHERE numero_carte = $2
    `
    
    await pool.query(updateConsumptionQuery, [employe_id, numero_carte])
    console.log(`📊 Mise à jour carburant_consommation: carte ${numero_carte} assignée à employé ${employe_id}`)
    
    return NextResponse.json({
      success: true,
      assignation: result.rows[0],
      message: `Carte ${numero_carte} assignée avec succès à ${employe_nom}`,
      transfer_info: cardCheckResult.rows.length > 0 ? {
        previous_employee: cardCheckResult.rows[0].employe_nom,
        transfer_date: new Date().toISOString(),
        transfer_type: 'employee_to_employee'
      } : null
    })
  } catch (error) {
    console.error('❌ Erreur lors de l\'assignation de la carte:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'assignation de la carte' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { id, numero_carte, employe_id, employe_nom, date_assignation, statut } = data
    
    console.log('✅ Connexion PostgreSQL établie avec succès')
    
    const updateQuery = `
      UPDATE carburant_assignations 
      SET 
        numero_carte = $1,
        employe_id = $2,
        employe_nom = $3,
        date_assignation = $4,
        statut = $5,
        updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `
    
    const startTime = Date.now()
    const pool4 = getPool()
    const result = await pool4.query(updateQuery, [
      numero_carte,
      employe_id,
      employe_nom,
      date_assignation,
      statut,
      id
    ])
    const duration = Date.now() - startTime
    
    console.log(`📊 Query executed in ${duration}ms: ${updateQuery.substring(0, 100)}...`)
    
    return NextResponse.json({
      success: true,
      assignation: result.rows[0],
      message: 'Assignation mise à jour avec succès'
    })
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de l\'assignation:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'assignation' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de l\'assignation requis' },
        { status: 400 }
      )
    }
    
    console.log('✅ Connexion PostgreSQL établie avec succès')
    
    const deleteQuery = `
      DELETE FROM carburant_assignations 
      WHERE id = $1
      RETURNING *
    `
    
    const startTime = Date.now()
    const pool5 = getPool()
    const result = await pool5.query(deleteQuery, [id])
    const duration = Date.now() - startTime
    
    console.log(`📊 Query executed in ${duration}ms: ${deleteQuery.substring(0, 100)}...`)
    
    return NextResponse.json({
      success: true,
      message: 'Assignation supprimée avec succès'
    })
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de l\'assignation:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'assignation' },
      { status: 500 }
    )
  }
}

// Fonction pour libérer automatiquement les assignations expirées
async function libererAssignationsExpirees() {
  try {
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
    
    if (expiredResult.rows.length > 0) {
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
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la libération automatique des assignations:', error)
  }
}