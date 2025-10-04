import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

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
    // Récupérer les employés depuis la table employes avec leurs informations complètes
    const result = await query(`
      SELECT 
        id,
        prenom,
        nom,
        matricule,
        niveau_acces,
        statut,
        email,
        telephone,
        date_embauche,
        salaire_base,
        taux_horaire,
        pourcentage_taxe,
        heures_travaillees,
        heures_supplementaires,
        prime_performance,
        penalites_total,
        date_derniere_evaluation,
        created_at,
        updated_at
      FROM employes 
      WHERE statut = 'actif'
      ORDER BY nom, prenom
    `)

    // Enrichir avec les informations d'assignation de cartes
    const employesWithCards = await Promise.all(
      result.rows.map(async (employee: any) => {
        try {
          // Récupérer l'assignation active de cet employé
          const cardResult = await query(`
            SELECT 
              ca.carte_id,
              ca.date_assignation,
              ca.date_fin,
              ca.date_fin,
              ca.statut,
              c.montant as montant_carte
            FROM carburant_assignations ca
            LEFT JOIN carburant c ON ca.carte_id = c.numero_carte
            WHERE ca.employe_id = $1 
              AND ca.statut = 'active'
              AND (ca.date_fin IS NULL OR ca.date_fin > CURRENT_DATE)
            ORDER BY ca.date_assignation DESC
            LIMIT 1
          `, [employee.id])

          const activeCard = cardResult.rows[0]
          
          return {
            ...employee,
            numero_carte_actuelle: activeCard?.numero_carte || null,
            date_debut_assignation: activeCard?.date_debut || null,
            date_fin_prevue_assignation: activeCard?.date_fin_prevue || null,
            montant_carte_actuelle: activeCard?.montant_carte || null,
            statut_assignation: activeCard?.statut || null
          }
        } catch (cardError) {
          console.error(`Erreur récupération carte pour employé ${employee.id}:`, cardError)
          return {
            ...employee,
            numero_carte_actuelle: null,
            date_debut_assignation: null,
            date_fin_prevue_assignation: null,
            montant_carte_actuelle: null,
            statut_assignation: null
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      employes: employesWithCards
    })
  } catch (error) {
    console.error('Erreur GET employes:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      prenom,
      nom,
      matricule,
      niveau_acces,
      statut,
      email,
      telephone,
      date_embauche
    } = await request.json()

    if (!prenom || !nom || !matricule) {
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
    const { id, ...updateData } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }

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
      date_derniere_evaluation: 'date'
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

    // Synchronisation automatique des taxes si pourcentage_taxe a été modifié
    if (updateData.pourcentage_taxe !== undefined) {
      try {
        console.log(`🔄 Synchronisation automatique des taxes pour l'employé ${result.rows[0].nom} ${result.rows[0].prenom}`)
        
        // Mettre à jour les enregistrements cout_par_salaire correspondants
        const syncResult = await query(`
          UPDATE cout_par_salaire 
          SET 
            taxe = $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE matricule = $2
          RETURNING id, nom, prenom, mois, annee, taxe
        `, [updateData.pourcentage_taxe, result.rows[0].matricule])
        
        if (syncResult.rows.length > 0) {
          console.log(`✅ ${syncResult.rows.length} enregistrement(s) cout_par_salaire mis à jour`)
          
          // Recalculer les impôts pour les enregistrements mis à jour
          for (const cout of syncResult.rows) {
            let impot = 0
            const taxe = parseFloat(updateData.pourcentage_taxe) || 0
            
            // Récupérer la charge pour ce cout
            const chargeResult = await query(`
              SELECT charge FROM cout_par_salaire WHERE id = $1
            `, [cout.id])
            
            if (chargeResult.rows.length > 0) {
              const charge = parseFloat(chargeResult.rows[0].charge) || 0
              
              if (Math.abs(taxe - 100) < 0.01) {
                impot = 0
              } else if (Math.abs(taxe - 50) < 0.01) {
                impot = charge / 2
              } else if (Math.abs(taxe) < 0.01) {
                impot = charge
              } else {
                impot = charge
              }
              
              // Mettre à jour l'impôt
              await query(`
                UPDATE cout_par_salaire 
                SET 
                  impot = $1,
                  updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
              `, [impot, cout.id])
            }
          }
          
          console.log(`✅ Impôts recalculés pour ${syncResult.rows.length} enregistrement(s)`)
        } else {
          console.log(`⚠️ Aucun enregistrement cout_par_salaire trouvé pour le matricule ${result.rows[0].matricule}`)
        }
        
      } catch (syncError) {
        console.error('❌ Erreur lors de la synchronisation des taxes:', syncError)
        // Ne pas faire échouer la mise à jour de l'employé si la synchronisation échoue
      }
    }

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
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }

    const result = await query(
      'DELETE FROM employes WHERE id = $1 RETURNING *',
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Employé non trouvé' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Employé supprimé avec succès'
    })

  } catch (error) {
    console.error('Erreur DELETE employe:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}