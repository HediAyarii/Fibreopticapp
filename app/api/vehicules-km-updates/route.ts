import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { writeFile } from "fs/promises"
import { join } from "path"

export const dynamic = 'force-dynamic'

// GET - Liste des MAJ KM (filtrable par statut)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const statut = searchParams.get('statut') // en_attente, validee, rejetee
    const technicien_id = searchParams.get('technicien_id')
    const vehicule_id = searchParams.get('vehicule_id')
    
    let queryText = `
      SELECT 
        ku.*,
        v.matricule, v.marque, v.modele,
        e.nom as technicien_nom, e.prenom as technicien_prenom,
        u.username as validateur_nom
      FROM vehicules_km_updates ku
      LEFT JOIN vehicules v ON ku.vehicule_id = v.id
      LEFT JOIN employes e ON ku.technicien_id = e.id
      LEFT JOIN users u ON ku.validee_par_admin_id = u.id
      WHERE 1=1
    `
    let params: any[] = []
    let paramIndex = 1
    
    if (statut) {
      queryText += ` AND ku.statut = $${paramIndex}`
      params.push(statut)
      paramIndex++
    }
    
    if (technicien_id) {
      queryText += ` AND ku.technicien_id = $${paramIndex}`
      params.push(technicien_id)
      paramIndex++
    }
    
    if (vehicule_id) {
      queryText += ` AND ku.vehicule_id = $${paramIndex}`
      params.push(vehicule_id)
      paramIndex++
    }
    
    queryText += ' ORDER BY ku.date_soumission DESC'
    
    const result = await query(queryText, params)
    
    return NextResponse.json({
      success: true,
      updates: result.rows
    })
  } catch (error: any) {
    console.error('Erreur récupération MAJ KM:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST - Soumission nouvelle MAJ KM par technicien
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const vehicule_id = formData.get('vehicule_id')
    const assignation_id = formData.get('assignation_id')
    const technicien_id = formData.get('technicien_id')
    const km_declare = formData.get('km_declare')
    const type_update = formData.get('type_update') // 'initial', 'mensuel', 'fin_assignation'
    const photo = formData.get('photo') as File

    if (!vehicule_id || !assignation_id || !technicien_id || !km_declare || !photo) {
      return NextResponse.json(
        { success: false, error: 'Données manquantes' },
        { status: 400 }
      )
    }

    // Sauvegarder la photo
    const bytes = await photo.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filename = `km_${vehicule_id}_${Date.now()}_${photo.name}`
    const filepath = join(process.cwd(), 'public', 'uploads', 'vehicules', filename)
    
    await writeFile(filepath, buffer)
    // Utiliser la route API pour servir les images en production
    const photoPath = `/api/uploads/vehicules/${filename}`

    // Insérer dans la BD
    const result = await query(
      `INSERT INTO vehicules_km_updates (
        vehicule_id, assignation_id, technicien_id, km_declare,
        photo_compteur, type_update, statut
      ) VALUES ($1, $2, $3, $4, $5, $6, 'en_attente')
      RETURNING *`,
      [vehicule_id, assignation_id, technicien_id, parseInt(km_declare as string), photoPath, type_update]
    )

    // Mettre à jour le statut de l'assignation
    await query(
      `UPDATE assignations_vehicules 
       SET statut_km = 'en_attente_validation'
       WHERE id = $1`,
      [assignation_id]
    )

    return NextResponse.json({
      success: true,
      update: result.rows[0],
      message: 'MAJ KM soumise avec succès'
    })
  } catch (error: any) {
    console.error('Erreur soumission MAJ KM:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT - Validation ou rejet par admin
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action, admin_id, commentaire_rejet } = body
    // action: 'valider' ou 'rejeter'

    if (!id || !action || !admin_id) {
      return NextResponse.json(
        { success: false, error: 'Données manquantes' },
        { status: 400 }
      )
    }

    // Récupérer les infos de la MAJ
    const updateInfo = await query(
      'SELECT * FROM vehicules_km_updates WHERE id = $1',
      [id]
    )

    if (updateInfo.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'MAJ KM introuvable' },
        { status: 404 }
      )
    }

    const kmUpdate = updateInfo.rows[0]

    if (action === 'valider') {
      // Mettre à jour le statut de la MAJ
      await query(
        `UPDATE vehicules_km_updates 
         SET statut = 'validee', 
             date_validation = CURRENT_TIMESTAMP,
             validee_par_admin_id = $1
         WHERE id = $2`,
        [admin_id, id]
      )

      // Mettre à jour le véhicule
      await query(
        `UPDATE vehicules 
         SET km_actuel = $1, 
             derniere_maj_km = CURRENT_DATE,
             prochaine_echeance_km = DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month') + INTERVAL '1 month - 1 day'
         WHERE id = $2`,
        [kmUpdate.km_declare, kmUpdate.vehicule_id]
      )

      // Mettre à jour l'assignation
      if (kmUpdate.type_update === 'initial') {
        await query(
          `UPDATE assignations_vehicules 
           SET km_debut = $1, km_actuel = $1, statut_km = 'a_jour', date_derniere_maj = CURRENT_DATE
           WHERE id = $2`,
          [kmUpdate.km_declare, kmUpdate.assignation_id]
        )
      } else if (kmUpdate.type_update === 'fin_assignation') {
        await query(
          `UPDATE assignations_vehicules 
           SET km_fin = $1, km_actuel = $1, statut_km = 'terminee', date_derniere_maj = CURRENT_DATE
           WHERE id = $2`,
          [kmUpdate.km_declare, kmUpdate.assignation_id]
        )
      } else {
        await query(
          `UPDATE assignations_vehicules 
           SET km_actuel = $1, statut_km = 'a_jour', date_derniere_maj = CURRENT_DATE
           WHERE id = $2`,
          [kmUpdate.km_declare, kmUpdate.assignation_id]
        )
      }

      return NextResponse.json({
        success: true,
        message: 'MAJ KM validée avec succès'
      })

    } else if (action === 'rejeter') {
      await query(
        `UPDATE vehicules_km_updates 
         SET statut = 'rejetee', 
             date_validation = CURRENT_TIMESTAMP,
             validee_par_admin_id = $1,
             commentaire_rejet = $2
         WHERE id = $3`,
        [admin_id, commentaire_rejet, id]
      )

      // Remettre le statut en attente pour que le technicien resoumettre
      await query(
        `UPDATE assignations_vehicules 
         SET statut_km = CASE 
           WHEN $1 = 'initial' THEN 'initial_attente'
           ELSE 'en_attente_validation'
         END
         WHERE id = $2`,
        [kmUpdate.type_update, kmUpdate.assignation_id]
      )

      return NextResponse.json({
        success: true,
        message: 'MAJ KM rejetée'
      })
    }

    return NextResponse.json(
      { success: false, error: 'Action invalide' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('Erreur validation MAJ KM:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
