import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export const dynamic = 'force-dynamic'

// POST - Synchroniser les techniciens manquants (qui ont généré mais pas dans l'import)
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Recherche des techniciens manquants (ont généré mais pas dans import)...')
    
    const { searchParams } = new URL(request.url)
    const moisParam = searchParams.get('mois')
    const anneeParam = searchParams.get('annee')
    
    // Si mois/année spécifiés, filtrer, sinon traiter tous les mois
    let dateFilter = ''
    const params: any[] = []
    
    if (moisParam && anneeParam) {
      dateFilter = `
        AND EXTRACT(MONTH FROM i.date_rdv::date) = $1
        AND EXTRACT(YEAR FROM i.date_rdv::date) = $2
      `
      params.push(parseInt(moisParam), parseInt(anneeParam))
    }
    
    // 1. Trouver les techniciens avec interventions CLOTUREES mais PAS dans cout_par_salaire
    const techniciensMaquantsQuery = `
      SELECT DISTINCT
        i.nom_technicien,
        i.prenom_technicien,
        EXTRACT(MONTH FROM i.date_rdv::date)::int as mois,
        EXTRACT(YEAR FROM i.date_rdv::date)::int as annee,
        COUNT(*) as nb_interventions_cloturees
      FROM interventions i
      WHERE i.statut = 'CLOTURE TERMINEE'
        AND i.date_rdv IS NOT NULL 
        AND i.date_rdv != '' 
        AND i.date_rdv != 'nan'
        AND i.date_rdv ~ '^[0-9]'
        AND i.nom_technicien IS NOT NULL
        AND i.nom_technicien != ''
        AND i.nom_technicien != 'nan'
        ${dateFilter}
        AND NOT EXISTS (
          SELECT 1 FROM cout_par_salaire cps 
          WHERE LOWER(TRIM(cps.nom)) = LOWER(TRIM(i.nom_technicien)) 
            AND LOWER(TRIM(cps.prenom)) = LOWER(TRIM(i.prenom_technicien))
            AND cps.mois = EXTRACT(MONTH FROM i.date_rdv::date)
            AND cps.annee = EXTRACT(YEAR FROM i.date_rdv::date)
        )
      GROUP BY i.nom_technicien, i.prenom_technicien, 
               EXTRACT(MONTH FROM i.date_rdv::date), 
               EXTRACT(YEAR FROM i.date_rdv::date)
      ORDER BY annee DESC, mois DESC, nb_interventions_cloturees DESC
    `
    
    const techniciensMaquants = await query(techniciensMaquantsQuery, params)
    
    console.log(`📊 ${techniciensMaquants.rows.length} techniciens manquants trouvés`)
    
    let totalCreated = 0
    const created: any[] = []
    const errors: any[] = []
    
    // 2. Pour chaque technicien manquant, créer un enregistrement
    for (const tech of techniciensMaquants.rows) {
      try {
        console.log(`👤 Création: ${tech.nom_technicien} ${tech.prenom_technicien} (${tech.mois}/${tech.annee})`)
        
        // Chercher si l'employé existe dans la table employes pour récupérer matricule et taxe
        const employeResult = await query(`
          SELECT id, matricule, pourcentage_taxe
          FROM employes
          WHERE LOWER(TRIM(nom)) = LOWER(TRIM($1))
            AND LOWER(TRIM(prenom)) = LOWER(TRIM($2))
            AND statut = 'actif'
          LIMIT 1
        `, [tech.nom_technicien, tech.prenom_technicien])
        
        const employe = employeResult.rows[0]
        const matricule = employe?.matricule || null
        const taxe = employe?.pourcentage_taxe || 0
        const employeId = employe?.id || null
        
        // Insérer le technicien manquant avec valeurs vides (0) pour salaires
        const insertResult = await query(`
          INSERT INTO cout_par_salaire (
            nom, prenom, mois, annee,
            salaire_net, salaire_brut, cout_total, charge,
            taxe, impot, penalite, prime,
            total_genere, rap,
            matricule, employe_id,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4,
            0, 0, 0, 0,
            $5, 0, 0, 0,
            0, 0,
            $6, $7,
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
          RETURNING id
        `, [
          tech.nom_technicien,
          tech.prenom_technicien,
          tech.mois,
          tech.annee,
          taxe,
          matricule,
          employeId
        ])
        
        const newId = insertResult.rows[0].id
        
        // Calculer le total généré pour ce technicien
        const totalGenereResult = await query(`
          SELECT COALESCE(SUM(
            CASE 
              WHEN i.statut = 'CLOTURE TERMINEE' THEN
                COALESCE(
                  (SELECT SUM(
                    CASE 
                      WHEN TRIM(SPLIT_PART(article_item, 'x', 1)) = 'DEP_OFFE' 
                           AND i.articles LIKE '%SAV%' THEN 0
                      WHEN cp.prix_tech IS NOT NULL THEN 
                        cp.prix_tech * COALESCE(NULLIF(TRIM(SPLIT_PART(article_item, 'x', 2)), '')::INTEGER, 1)
                      ELSE 0
                    END
                  )
                  FROM unnest(string_to_array(i.articles, ',')) as article_item
                  LEFT JOIN company_pricing cp ON 
                    TRIM(SPLIT_PART(article_item, 'x', 1)) = cp.service_code
                    AND cp.company_name = CASE 
                      WHEN i.grille LIKE '%AXECOM%' THEN 'AXECOM'
                      ELSE 'ERT OUEST'
                    END
                    AND cp.category = CASE 
                      WHEN i.type_intervention IN ('RACC', 'RECO', 'RECC') THEN 'RACC'
                      ELSE 'SAV'
                    END
                  WHERE article_item != 'nan' 
                    AND TRIM(article_item) != ''
                  ), 0
                )
              ELSE 0
            END
          ), 0) as total_genere
          FROM interventions i
          WHERE i.statut = 'CLOTURE TERMINEE'
            AND i.articles IS NOT NULL 
            AND i.articles != ''
            AND LOWER(TRIM(i.nom_technicien)) = LOWER(TRIM($1))
            AND LOWER(TRIM(i.prenom_technicien)) = LOWER(TRIM($2))
            AND EXTRACT(MONTH FROM i.date_rdv::date) = $3
            AND EXTRACT(YEAR FROM i.date_rdv::date) = $4
            AND i.date_rdv IS NOT NULL 
            AND i.date_rdv != '' 
            AND i.date_rdv != 'nan'
            AND i.date_rdv ~ '^[0-9]'
        `, [tech.nom_technicien, tech.prenom_technicien, tech.mois, tech.annee])
        
        const totalGenere = parseFloat(totalGenereResult.rows[0]?.total_genere) || 0
        
        // Mettre à jour avec le total généré et calculer le RAP
        // RAP = total_genere - salaire_net - impot + prime = total_genere (car tout est 0)
        await query(`
          UPDATE cout_par_salaire
          SET total_genere = $1,
              rap = $1,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [totalGenere, newId])
        
        totalCreated++
        created.push({
          nom: tech.nom_technicien,
          prenom: tech.prenom_technicien,
          mois: tech.mois,
          annee: tech.annee,
          nb_interventions: tech.nb_interventions_cloturees,
          total_genere: totalGenere,
          matricule: matricule
        })
        
        console.log(`  ✅ Créé avec ID ${newId}, Total Généré: ${totalGenere}€`)
        
      } catch (error: any) {
        console.error(`  ❌ Erreur pour ${tech.nom_technicien} ${tech.prenom_technicien}:`, error.message)
        errors.push({
          nom: tech.nom_technicien,
          prenom: tech.prenom_technicien,
          mois: tech.mois,
          annee: tech.annee,
          error: error.message
        })
      }
    }
    
    console.log(`🎯 Synchronisation terminée: ${totalCreated} créés, ${errors.length} erreurs`)
    
    return NextResponse.json({
      success: true,
      message: `${totalCreated} techniciens manquants ajoutés`,
      total_found: techniciensMaquants.rows.length,
      total_created: totalCreated,
      total_errors: errors.length,
      created,
      errors
    })
    
  } catch (error: any) {
    console.error('❌ Erreur sync techniciens manquants:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

// GET - Lister les techniciens manquants sans les créer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const moisParam = searchParams.get('mois')
    const anneeParam = searchParams.get('annee')
    
    let dateFilter = ''
    const params: any[] = []
    
    if (moisParam && anneeParam) {
      dateFilter = `
        AND EXTRACT(MONTH FROM i.date_rdv::date) = $1
        AND EXTRACT(YEAR FROM i.date_rdv::date) = $2
      `
      params.push(parseInt(moisParam), parseInt(anneeParam))
    }
    
    const techniciensMaquantsQuery = `
      SELECT DISTINCT
        i.nom_technicien,
        i.prenom_technicien,
        EXTRACT(MONTH FROM i.date_rdv::date)::int as mois,
        EXTRACT(YEAR FROM i.date_rdv::date)::int as annee,
        COUNT(*) as nb_interventions_cloturees
      FROM interventions i
      WHERE i.statut = 'CLOTURE TERMINEE'
        AND i.date_rdv IS NOT NULL 
        AND i.date_rdv != '' 
        AND i.date_rdv != 'nan'
        AND i.date_rdv ~ '^[0-9]'
        AND i.nom_technicien IS NOT NULL
        AND i.nom_technicien != ''
        AND i.nom_technicien != 'nan'
        ${dateFilter}
        AND NOT EXISTS (
          SELECT 1 FROM cout_par_salaire cps 
          WHERE LOWER(TRIM(cps.nom)) = LOWER(TRIM(i.nom_technicien)) 
            AND LOWER(TRIM(cps.prenom)) = LOWER(TRIM(i.prenom_technicien))
            AND cps.mois = EXTRACT(MONTH FROM i.date_rdv::date)
            AND cps.annee = EXTRACT(YEAR FROM i.date_rdv::date)
        )
      GROUP BY i.nom_technicien, i.prenom_technicien, 
               EXTRACT(MONTH FROM i.date_rdv::date), 
               EXTRACT(YEAR FROM i.date_rdv::date)
      ORDER BY annee DESC, mois DESC, nb_interventions_cloturees DESC
    `
    
    const result = await query(techniciensMaquantsQuery, params)
    
    return NextResponse.json({
      success: true,
      total: result.rows.length,
      techniciens_manquants: result.rows
    })
    
  } catch (error: any) {
    console.error('❌ Erreur GET techniciens manquants:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
