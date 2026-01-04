import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export const dynamic = 'force-dynamic'

// POST - Synchroniser les techniciens manquants basé sur MATRICULE
// Trouve les employés qui ont des interventions ce mois mais pas d'entrée dans cout_par_salaire
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Recherche des techniciens manquants par MATRICULE...')
    
    const { searchParams } = new URL(request.url)
    const moisParam = searchParams.get('mois')
    const anneeParam = searchParams.get('annee')
    
    if (!moisParam || !anneeParam) {
      return NextResponse.json({
        success: false,
        error: 'Mois et année requis'
      }, { status: 400 })
    }
    
    const mois = parseInt(moisParam)
    const annee = parseInt(anneeParam)
    
    console.log(`📅 Période: ${mois}/${annee}`)
    
    // 1. Trouver tous les MATRICULES qui ont des interventions clôturées ce mois
    // en joignant avec la table employes via le matricule généré
    const matriculesAvecInterventionsQuery = `
      WITH interventions_par_matricule AS (
        SELECT DISTINCT
          e.matricule,
          e.id as employe_id,
          e.nom,
          e.prenom,
          e.pourcentage_taxe,
          COUNT(i.id) as nb_interventions
        FROM employes e
        INNER JOIN interventions i ON (
          -- Correspondance via matricule généré depuis les interventions
          CONCAT('TECH_', UPPER(SUBSTRING(TRIM(i.nom_technicien), 1, 3)), UPPER(SUBSTRING(TRIM(i.prenom_technicien), 1, 2))) = e.matricule
          OR (LOWER(TRIM(i.nom_technicien)) = LOWER(TRIM(e.nom)) AND LOWER(TRIM(i.prenom_technicien)) = LOWER(TRIM(e.prenom)))
        )
        WHERE e.statut = 'actif'
          AND e.matricule IS NOT NULL
          AND i.statut = 'CLOTURE TERMINEE'
          AND i.date_rdv IS NOT NULL 
          AND i.date_rdv != '' 
          AND i.date_rdv != 'nan'
          AND i.date_rdv ~ '^[0-9]'
          AND (
            -- Format YYYY-MM-DD
            (i.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' 
             AND EXTRACT(MONTH FROM i.date_rdv::date) = $1
             AND EXTRACT(YEAR FROM i.date_rdv::date) = $2)
            OR
            -- Format DD/MM/YYYY  
            (i.date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}'
             AND EXTRACT(MONTH FROM TO_DATE(SUBSTRING(i.date_rdv FROM 1 FOR 10), 'DD/MM/YYYY')) = $1
             AND EXTRACT(YEAR FROM TO_DATE(SUBSTRING(i.date_rdv FROM 1 FOR 10), 'DD/MM/YYYY')) = $2)
          )
        GROUP BY e.matricule, e.id, e.nom, e.prenom, e.pourcentage_taxe
        HAVING COUNT(i.id) > 0
      )
      SELECT ipm.*
      FROM interventions_par_matricule ipm
      WHERE NOT EXISTS (
        SELECT 1 FROM cout_par_salaire cps 
        WHERE cps.matricule = ipm.matricule
          AND cps.mois = $1
          AND cps.annee = $2
      )
      ORDER BY ipm.nb_interventions DESC
    `
    
    const matriculesManquants = await query(matriculesAvecInterventionsQuery, [mois, annee])
    
    console.log(`📊 ${matriculesManquants.rows.length} matricules manquants trouvés`)
    
    let totalCreated = 0
    const created: any[] = []
    const errors: any[] = []
    
    // 2. Pour chaque matricule manquant, créer un enregistrement
    for (const emp of matriculesManquants.rows) {
      try {
        console.log(`👤 Création: ${emp.nom} ${emp.prenom} (${emp.matricule}) - ${emp.nb_interventions} interventions`)
        
        const taxe = emp.pourcentage_taxe || 50
        
        // Calculer le total généré pour ce matricule
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
          JOIN employes e ON (
            CONCAT('TECH_', UPPER(SUBSTRING(TRIM(i.nom_technicien), 1, 3)), UPPER(SUBSTRING(TRIM(i.prenom_technicien), 1, 2))) = e.matricule
            OR (LOWER(TRIM(i.nom_technicien)) = LOWER(TRIM(e.nom)) AND LOWER(TRIM(i.prenom_technicien)) = LOWER(TRIM(e.prenom)))
          )
          WHERE e.matricule = $1
            AND i.statut = 'CLOTURE TERMINEE'
            AND i.articles IS NOT NULL 
            AND i.articles != ''
            AND i.date_rdv IS NOT NULL 
            AND i.date_rdv != '' 
            AND i.date_rdv != 'nan'
            AND i.date_rdv ~ '^[0-9]'
            AND (
              (i.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' 
               AND EXTRACT(MONTH FROM i.date_rdv::date) = $2
               AND EXTRACT(YEAR FROM i.date_rdv::date) = $3)
              OR
              (i.date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}'
               AND EXTRACT(MONTH FROM TO_DATE(SUBSTRING(i.date_rdv FROM 1 FOR 10), 'DD/MM/YYYY')) = $2
               AND EXTRACT(YEAR FROM TO_DATE(SUBSTRING(i.date_rdv FROM 1 FOR 10), 'DD/MM/YYYY')) = $3)
            )
        `, [emp.matricule, mois, annee])
        
        const totalGenere = parseFloat(totalGenereResult.rows[0]?.total_genere) || 0
        
        // Insérer le technicien manquant avec les données de l'employé
        const insertResult = await query(`
          INSERT INTO cout_par_salaire (
            nom, prenom, mois, annee,
            salaire_net, salaire_brut, cout_total, charge,
            taxe, impot, penalite, prime,
            total_genere, rap,
            matricule,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4,
            0, 0, 0, 0,
            $5, 0, 0, 0,
            $6, $6,
            $7,
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
          RETURNING id
        `, [
          emp.nom,
          emp.prenom,
          mois,
          annee,
          taxe,
          totalGenere,
          emp.matricule
        ])
        
        const newId = insertResult.rows[0].id
        
        totalCreated++
        created.push({
          id: newId,
          nom: emp.nom,
          prenom: emp.prenom,
          matricule: emp.matricule,
          taxe: taxe,
          nb_interventions: emp.nb_interventions,
          total_genere: totalGenere
        })
        
        console.log(`  ✅ Créé ID ${newId}: ${emp.nom} ${emp.prenom} (${emp.matricule}) - Total Généré: ${totalGenere}€`)
        
      } catch (error: any) {
        console.error(`  ❌ Erreur pour ${emp.nom} ${emp.prenom} (${emp.matricule}):`, error.message)
        errors.push({
          nom: emp.nom,
          prenom: emp.prenom,
          matricule: emp.matricule,
          error: error.message
        })
      }
    }
    
    console.log(`🎯 Synchronisation terminée: ${totalCreated} créés, ${errors.length} erreurs`)
    
    return NextResponse.json({
      success: true,
      message: `${totalCreated} techniciens manquants ajoutés`,
      total_found: matriculesManquants.rows.length,
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

// GET - Lister les techniciens manquants par MATRICULE sans les créer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const moisParam = searchParams.get('mois')
    const anneeParam = searchParams.get('annee')
    
    if (!moisParam || !anneeParam) {
      return NextResponse.json({
        success: false,
        error: 'Mois et année requis'
      }, { status: 400 })
    }
    
    const mois = parseInt(moisParam)
    const annee = parseInt(anneeParam)
    
    // Trouver les matricules avec interventions mais pas dans cout_par_salaire
    const matriculesManquantsQuery = `
      WITH interventions_par_matricule AS (
        SELECT DISTINCT
          e.matricule,
          e.nom,
          e.prenom,
          e.pourcentage_taxe,
          COUNT(i.id) as nb_interventions
        FROM employes e
        INNER JOIN interventions i ON (
          CONCAT('TECH_', UPPER(SUBSTRING(TRIM(i.nom_technicien), 1, 3)), UPPER(SUBSTRING(TRIM(i.prenom_technicien), 1, 2))) = e.matricule
          OR (LOWER(TRIM(i.nom_technicien)) = LOWER(TRIM(e.nom)) AND LOWER(TRIM(i.prenom_technicien)) = LOWER(TRIM(e.prenom)))
        )
        WHERE e.statut = 'actif'
          AND e.matricule IS NOT NULL
          AND i.statut = 'CLOTURE TERMINEE'
          AND i.date_rdv IS NOT NULL 
          AND i.date_rdv != '' 
          AND i.date_rdv != 'nan'
          AND i.date_rdv ~ '^[0-9]'
          AND (
            (i.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' 
             AND EXTRACT(MONTH FROM i.date_rdv::date) = $1
             AND EXTRACT(YEAR FROM i.date_rdv::date) = $2)
            OR
            (i.date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}'
             AND EXTRACT(MONTH FROM TO_DATE(SUBSTRING(i.date_rdv FROM 1 FOR 10), 'DD/MM/YYYY')) = $1
             AND EXTRACT(YEAR FROM TO_DATE(SUBSTRING(i.date_rdv FROM 1 FOR 10), 'DD/MM/YYYY')) = $2)
          )
        GROUP BY e.matricule, e.nom, e.prenom, e.pourcentage_taxe
        HAVING COUNT(i.id) > 0
      )
      SELECT ipm.*
      FROM interventions_par_matricule ipm
      WHERE NOT EXISTS (
        SELECT 1 FROM cout_par_salaire cps 
        WHERE cps.matricule = ipm.matricule
          AND cps.mois = $1
          AND cps.annee = $2
      )
      ORDER BY ipm.nb_interventions DESC
    `
    
    const result = await query(matriculesManquantsQuery, [mois, annee])
    
    return NextResponse.json({
      success: true,
      total: result.rows.length,
      mois,
      annee,
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
