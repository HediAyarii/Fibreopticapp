import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { logHistorique, getClientIP, getUserAgent } from '@/lib/historique'
// import { broadcastEmployeeUpdate, broadcastPersonalDataUpdate } from '../employees-updates/route' // Supprimé pour éviter les erreurs de build

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// Fonction utilitaire pour traiter les valeurs de date et numérique
function processValue(value: any, fieldType: 'date' | 'numeric' | 'text'): any {
  if (value === '' || value === undefined) {
    return null
  }
  
  if (fieldType === 'numeric') {
    // Pour les champs numériques, convertir en nombre ou null
    const numValue = parseFloat(value)
    return isNaN(numValue) ? null : numValue
  }
  
  return value
}

export async function GET() {
  try {
    // Requête optimisée avec LEFT JOIN pour éviter N+1 queries
    const result = await query(`
      SELECT 
        e.id,
        e.prenom,
        e.nom,
        e.matricule,
        e.niveau_acces,
        e.statut,
        e.email,
        e.telephone,
        e.date_embauche,
        e.salaire_base,
        e.taux_horaire,
        e.pourcentage_taxe,
        e.heures_travaillees,
        e.heures_supplementaires,
        e.prime_performance,
        e.penalites_total,
        e.date_derniere_evaluation,
        e.rib_salaire,
        e.rib2,
        e.created_at,
        e.updated_at,
        ca.carte_id as numero_carte_actuelle,
        ca.date_assignation as date_debut_assignation,
        ca.date_fin as date_fin_prevue_assignation,
        c.montant as montant_carte_actuelle,
        ca.statut as statut_assignation
      FROM employes e
      LEFT JOIN LATERAL (
        SELECT carte_id, date_assignation, date_fin, statut
        FROM carburant_assignations
        WHERE employe_id = e.id 
          AND statut = 'active'
          AND (date_fin IS NULL OR date_fin > CURRENT_DATE)
        ORDER BY date_assignation DESC
        LIMIT 1
      ) ca ON true
      LEFT JOIN carburant c ON ca.carte_id = c.numero_carte
      WHERE e.statut = 'actif'
      ORDER BY e.nom, e.prenom
    `)

    return NextResponse.json({
      success: true,
      employes: result.rows
    })
  } catch (error) {
    console.error('Erreur GET employes:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      prenom,
      nom,
      matricule,
      niveau_acces,
      statut,
      email,
      telephone,
      date_embauche,
      _user
    } = body

    if (!prenom || !nom || !matricule || 
        prenom.trim() === '' || nom.trim() === '' || matricule.trim() === '') {
      return NextResponse.json({ error: 'Prénom, nom et matricule requis' }, { status: 400 })
    }

    // Vérifier que le matricule n'existe pas déjà
    const existingEmployee = await query(
      'SELECT id FROM employes WHERE matricule = $1',
      [matricule]
    )

    if (existingEmployee.rows.length > 0) {
      return NextResponse.json({ error: 'Ce matricule existe déjà' }, { status: 400 })
    }

    const result = await query(`
      INSERT INTO employes (
        prenom,
        nom,
        matricule,
        niveau_acces,
        statut,
        email,
        telephone,
        date_embauche,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      prenom,
      nom,
      matricule,
      niveau_acces || 'technicien',
      statut || 'actif',
      email || null,
      telephone || null,
      processValue(date_embauche, 'date'),
      new Date()
    ])

    // Enregistrer dans l'historique
    await logHistorique({
      userName: _user?.email || _user?.name || 'Utilisateur inconnu',
      action: 'CREATE',
      tableName: 'employes',
      recordId: result.rows[0].id,
      section: 'Employés',
      description: `Nouvel employé - ${prenom} ${nom} - Matricule: ${matricule} - Niveau: ${niveau_acces || 'technicien'}`,
      newValues: result.rows[0],
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request)
    })

    return NextResponse.json({
      success: true,
      employe: result.rows[0],
      message: 'Employé créé avec succès'
    })

  } catch (error) {
    console.error('Erreur POST employe:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, _user, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }

    // Récupérer les anciennes valeurs avant la mise à jour
    const oldDataResult = await query('SELECT * FROM employes WHERE id = $1', [id])
    
    if (oldDataResult.rows.length === 0) {
      return NextResponse.json({ error: 'Employé non trouvé' }, { status: 404 })
    }
    
    const oldData = oldDataResult.rows[0]

    const updateFields: string[] = []
    const params: any[] = []
    let paramIndex = 1

    // Définir les types de champs
    const fieldTypes: { [key: string]: 'date' | 'numeric' | 'text' } = {
      date_embauche: 'date',
      salaire_base: 'numeric',
      taux_horaire: 'numeric',
      pourcentage_taxe: 'numeric',
      heures_travaillees: 'numeric',
      heures_supplementaires: 'numeric',
      prime_performance: 'numeric',
      penalites_total: 'numeric',
      date_derniere_evaluation: 'date',
      rib_salaire: 'text',
      rib2: 'text'
    }

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        // Traiter les valeurs selon leur type
        const fieldType = fieldTypes[key] || 'text'
        const processedValue = processValue(value, fieldType)
        
        updateFields.push(`${key} = $${paramIndex}`)
        params.push(processedValue)
        paramIndex++
      }
    })

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'Aucune donnée à mettre à jour' }, { status: 400 })
    }

    params.push(id)
    const queryText = `
      UPDATE employes 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await query(queryText, params)

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Employé non trouvé' }, { status: 404 })
    }

    const newData = result.rows[0]

    // Générer une description détaillée des modifications
    const changes: string[] = []
    
    if (oldData.statut !== newData.statut) {
      changes.push(`Statut: ${oldData.statut} → ${newData.statut}`)
    }
    if (oldData.niveau_acces !== newData.niveau_acces) {
      changes.push(`Niveau: ${oldData.niveau_acces} → ${newData.niveau_acces}`)
    }
    if (oldData.salaire_base !== newData.salaire_base) {
      changes.push(`Salaire: ${oldData.salaire_base || 'N/A'}€ → ${newData.salaire_base || 'N/A'}€`)
    }
    if (oldData.pourcentage_taxe !== newData.pourcentage_taxe) {
      changes.push(`Taxe: ${oldData.pourcentage_taxe || 0}% → ${newData.pourcentage_taxe || 0}%`)
    }
    if (oldData.email !== newData.email) {
      changes.push(`Email: ${oldData.email || 'N/A'} → ${newData.email || 'N/A'}`)
    }
    if (oldData.telephone !== newData.telephone) {
      changes.push(`Téléphone: ${oldData.telephone || 'N/A'} → ${newData.telephone || 'N/A'}`)
    }
    if (oldData.rib_salaire !== newData.rib_salaire) {
      changes.push(`RIB modifié`)
    }
    
    const detailedDescription = changes.length > 0 
      ? `${oldData.prenom} ${oldData.nom} (${oldData.matricule}) - ${changes.join(', ')}`
      : `${oldData.prenom} ${oldData.nom} (${oldData.matricule}) (aucune modification détectable)`

    // Diffusion des mises à jour supprimée (utilise le polling automatique à la place)
    console.log(`📡 Employé ${result.rows[0].prenom} ${result.rows[0].nom} mis à jour (ID: ${id})`)

    // Synchronisation automatique des taxes si pourcentage_taxe a été modifié
    if (updateData.pourcentage_taxe !== undefined) {
      try {
        console.log(`🔄 Synchronisation automatique des taxes pour l'employé ${result.rows[0].nom} ${result.rows[0].prenom}`)
        
        // Désactiver temporairement les triggers pour éviter les conflits
        await query('ALTER TABLE cout_par_salaire DISABLE TRIGGER ALL;')
        
        try {
          // Mettre à jour les enregistrements cout_par_salaire correspondants
          const syncResult = await query(`
            UPDATE cout_par_salaire 
            SET 
              taxe = $1,
              updated_at = CURRENT_TIMESTAMP
            WHERE matricule = $2
            RETURNING id, nom, prenom, mois, annee, taxe, charge
          `, [updateData.pourcentage_taxe, result.rows[0].matricule])
        
        if (syncResult.rows.length > 0) {
          console.log(`✅ ${syncResult.rows.length} enregistrement(s) cout_par_salaire mis à jour`)
          
          // Recalculer les impôts pour les enregistrements mis à jour
          for (const cout of syncResult.rows) {
            let impot = 0
            const taxe = parseFloat(updateData.pourcentage_taxe) || 0
            const charge = parseFloat(cout.charge) || 0
            
            if (Math.abs(taxe - 100) < 0.01) {
              impot = 0
            } else if (Math.abs(taxe - 50) < 0.01) {
              impot = charge / 2
            } else if (Math.abs(taxe) < 0.01) {
              impot = charge
            } else {
              impot = charge * (taxe / 100)
            }
            
            // Mettre à jour l'impôt
            await query(`
              UPDATE cout_par_salaire 
              SET 
                impot = $1,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = $2
            `, [impot, cout.id])
            
            console.log(`     - ${cout.nom} ${cout.prenom} (${cout.mois}/${cout.annee}): impôt = ${impot}€`)
          }
          
          console.log(`✅ Impôts recalculés pour ${syncResult.rows.length} enregistrement(s)`)
        } else {
          console.log(`⚠️ Aucun enregistrement cout_par_salaire trouvé pour le matricule ${result.rows[0].matricule}`)
        }
        
        } finally {
          // Réactiver les triggers
          await query('ALTER TABLE cout_par_salaire ENABLE TRIGGER ALL;')
        }
        
      } catch (syncError) {
        console.error('❌ Erreur lors de la synchronisation des taxes:', syncError)
        // Ne pas faire échouer la mise à jour de l'employé si la synchronisation échoue
      }
    }

    // Enregistrer dans l'historique
    await logHistorique({
      userName: _user?.email || _user?.name || 'Utilisateur inconnu',
      action: 'UPDATE',
      tableName: 'employes',
      recordId: id,
      section: 'Employés',
      description: `Modification employé - ${detailedDescription}`,
      oldValues: oldData,
      newValues: result.rows[0],
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request)
    })

    return NextResponse.json({
      success: true,
      employe: result.rows[0],
      message: 'Employé mis à jour avec succès'
    })

  } catch (error) {
    console.error('Erreur PUT employe:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, _user } = body

    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }

    // Récupérer les données avant suppression
    const oldDataResult = await query('SELECT * FROM employes WHERE id = $1', [id])
    
    if (oldDataResult.rows.length === 0) {
      return NextResponse.json({ error: 'Employé non trouvé' }, { status: 404 })
    }
    
    const deletedData = oldDataResult.rows[0]

    const result = await query(
      'DELETE FROM employes WHERE id = $1 RETURNING *',
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Employé non trouvé' }, { status: 404 })
    }

    // Enregistrer dans l'historique
    await logHistorique({
      userName: _user?.email || _user?.name || 'Utilisateur inconnu',
      action: 'DELETE',
      tableName: 'employes',
      recordId: parseInt(id),
      section: 'Employés',
      description: `Suppression employé - ${deletedData.prenom} ${deletedData.nom} - Matricule: ${deletedData.matricule} - ${deletedData.niveau_acces}`,
      oldValues: deletedData,
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request)
    })

    return NextResponse.json({
      success: true,
      message: 'Employé supprimé avec succès'
    })

  } catch (error) {
    console.error('Erreur DELETE employe:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}