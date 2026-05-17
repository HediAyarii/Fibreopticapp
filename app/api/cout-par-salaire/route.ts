import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { ensureReclaFreeTable } from "@/lib/ensure-recla-free-table"

export const dynamic = 'force-dynamic'

// Helper: build date filter for matching intervention dates to a month/year
function buildDateFilter(moisParam: string, anneeParam: string): string {
  return `
    (
      (i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND 
       i.cloture_tech ~ '^[0-9]' AND (
         (i.cloture_tech ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' AND i.cloture_tech::date >= DATE(${anneeParam} || '-' || LPAD(${moisParam}::text, 2, '0') || '-01') AND i.cloture_tech::date <= (DATE(${anneeParam} || '-' || LPAD(${moisParam}::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))
         OR
         (i.cloture_tech ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' AND TO_DATE(SUBSTRING(i.cloture_tech FROM 1 FOR 10), 'DD/MM/YYYY') >= DATE(${anneeParam} || '-' || LPAD(${moisParam}::text, 2, '0') || '-01') AND TO_DATE(SUBSTRING(i.cloture_tech FROM 1 FOR 10), 'DD/MM/YYYY') <= (DATE(${anneeParam} || '-' || LPAD(${moisParam}::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))
       )) OR
      (i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND 
       i.cloture_hotline ~ '^[0-9]' AND (
         (i.cloture_hotline ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' AND i.cloture_hotline::date >= DATE(${anneeParam} || '-' || LPAD(${moisParam}::text, 2, '0') || '-01') AND i.cloture_hotline::date <= (DATE(${anneeParam} || '-' || LPAD(${moisParam}::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))
         OR
         (i.cloture_hotline ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' AND TO_DATE(SUBSTRING(i.cloture_hotline FROM 1 FOR 10), 'DD/MM/YYYY') >= DATE(${anneeParam} || '-' || LPAD(${moisParam}::text, 2, '0') || '-01') AND TO_DATE(SUBSTRING(i.cloture_hotline FROM 1 FOR 10), 'DD/MM/YYYY') <= (DATE(${anneeParam} || '-' || LPAD(${moisParam}::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))
       )) OR
      (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND 
       i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND 
       i.date_rdv ~ '^[0-9]' AND (
         (i.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' AND i.date_rdv::date >= DATE(${anneeParam} || '-' || LPAD(${moisParam}::text, 2, '0') || '-01') AND i.date_rdv::date <= (DATE(${anneeParam} || '-' || LPAD(${moisParam}::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))
         OR
         (i.date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') >= DATE(${anneeParam} || '-' || LPAD(${moisParam}::text, 2, '0') || '-01') AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') <= (DATE(${anneeParam} || '-' || LPAD(${moisParam}::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))
       ))
    )
  `
}

// GET - Récupérer les coûts par salarié avec filtres (OPTIMISÉ - 1 seule requête)
export async function GET(request: NextRequest) {
  try {
    await ensureReclaFreeTable()
    const { searchParams } = new URL(request.url)
    const mois = searchParams.get('mois')
    const annee = searchParams.get('annee')
    
    let whereClause = ''
    const params: any[] = []
    
    if (mois && annee) {
      whereClause = 'WHERE cps.mois = $1 AND cps.annee = $2'
      params.push(parseInt(mois), parseInt(annee))
    } else if (mois) {
      whereClause = 'WHERE cps.mois = $1'
      params.push(parseInt(mois))
    } else if (annee) {
      whereClause = 'WHERE cps.annee = $1'
      params.push(parseInt(annee))
    }

    const dateFilter = buildDateFilter('cps.mois', 'cps.annee')
    
    // UNE SEULE requête qui calcule tout : revenu, paiements, amendes, primes, RAP
    const sqlQuery = `
      WITH 
      -- Pré-calculer le revenu par matricule/mois/année
      revenue_by_matricule AS (
        SELECT 
          CONCAT('TECH_', UPPER(SUBSTRING(SPLIT_PART(i.nom_technicien, ' ', 1), 1, 3)), UPPER(SUBSTRING(SPLIT_PART(i.prenom_technicien, ' ', 1), 1, 2))) as matricule_calc,
          i.mois_cloture,
          i.annee_cloture,
          COALESCE(SUM(
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
          ), 0) as total_genere
        FROM (
          SELECT i.*,
            -- Extraire mois/année de la date de clôture
            CASE
              WHEN i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND i.cloture_tech ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
                THEN EXTRACT(MONTH FROM i.cloture_tech::date)::int
              WHEN i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND i.cloture_tech ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}'
                THEN EXTRACT(MONTH FROM TO_DATE(SUBSTRING(i.cloture_tech FROM 1 FOR 10), 'DD/MM/YYYY'))::int
              WHEN i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND i.cloture_hotline ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
                THEN EXTRACT(MONTH FROM i.cloture_hotline::date)::int
              WHEN i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND i.cloture_hotline ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}'
                THEN EXTRACT(MONTH FROM TO_DATE(SUBSTRING(i.cloture_hotline FROM 1 FOR 10), 'DD/MM/YYYY'))::int
              WHEN i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND i.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
                THEN EXTRACT(MONTH FROM i.date_rdv::date)::int
              WHEN i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND i.date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}'
                THEN EXTRACT(MONTH FROM TO_DATE(i.date_rdv, 'DD/MM/YYYY'))::int
              ELSE NULL
            END as mois_cloture,
            CASE
              WHEN i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND i.cloture_tech ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
                THEN EXTRACT(YEAR FROM i.cloture_tech::date)::int
              WHEN i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND i.cloture_tech ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}'
                THEN EXTRACT(YEAR FROM TO_DATE(SUBSTRING(i.cloture_tech FROM 1 FOR 10), 'DD/MM/YYYY'))::int
              WHEN i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND i.cloture_hotline ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
                THEN EXTRACT(YEAR FROM i.cloture_hotline::date)::int
              WHEN i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND i.cloture_hotline ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}'
                THEN EXTRACT(YEAR FROM TO_DATE(SUBSTRING(i.cloture_hotline FROM 1 FOR 10), 'DD/MM/YYYY'))::int
              WHEN i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND i.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
                THEN EXTRACT(YEAR FROM i.date_rdv::date)::int
              WHEN i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND i.date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}'
                THEN EXTRACT(YEAR FROM TO_DATE(i.date_rdv, 'DD/MM/YYYY'))::int
              ELSE NULL
            END as annee_cloture
          FROM interventions i
          WHERE i.statut = 'CLOTURE TERMINEE'
            AND i.articles IS NOT NULL 
            AND i.articles != ''
        ) i
        WHERE i.mois_cloture IS NOT NULL AND i.annee_cloture IS NOT NULL
        GROUP BY matricule_calc, i.mois_cloture, i.annee_cloture
      ),
      -- Pré-calculer les paiements par cout_par_salaire_id
      paiements_totaux AS (
        SELECT cout_par_salaire_id, COALESCE(SUM(montant_verse), 0) as total_paiements
        FROM paiements_employes
        GROUP BY cout_par_salaire_id
      ),
      -- Pré-calculer les primes par cout_par_salaire_id
      primes_totaux AS (
        SELECT cout_par_salaire_id, COALESCE(SUM(montant), 0) as total_primes
        FROM primes_employes
        GROUP BY cout_par_salaire_id
      ),
      -- Pré-calculer les amendes par matricule/mois/année
      amendes_totaux AS (
        SELECT 
          e.matricule,
          EXTRACT(MONTH FROM av.date_amende)::int as mois,
          EXTRACT(YEAR FROM av.date_amende)::int as annee,
          COALESCE(SUM(av.montant), 0) as total_amendes
        FROM amendes_vehicules av
        JOIN employes e ON av.employe_id = e.id
        WHERE e.matricule IS NOT NULL
        GROUP BY e.matricule, EXTRACT(MONTH FROM av.date_amende), EXTRACT(YEAR FROM av.date_amende)
      ),
      -- Pré-calculer les recla free confirmées par matricule/mois/année
      -- IMPORTANT: Utilise date_confirmation pour déterminer la période de facturation
      recla_free_totaux AS (
        SELECT
          e.matricule,
          EXTRACT(MONTH FROM rf.date_confirmation)::int as mois,
          EXTRACT(YEAR FROM rf.date_confirmation)::int as annee,
          COALESCE(SUM(rf.montant_technicien), 0) as total_recla_free
        FROM recla_free rf
        JOIN employes e ON rf.employe_id = e.id
        WHERE rf.confirmer = TRUE
          AND rf.date_confirmation IS NOT NULL
        GROUP BY e.matricule, EXTRACT(MONTH FROM rf.date_confirmation), EXTRACT(YEAR FROM rf.date_confirmation)
      )
      SELECT 
        cps.id,
        cps.nom,
        cps.prenom,
        cps.salaire_net,
        cps.salaire_brut,
        cps.cout_total,
        cps.charge,
        cps.mois,
        cps.annee,
        cps.matricule,
        -- Taxe synchronisée via employes
        COALESCE(e.pourcentage_taxe, 50) as taxe,
        COALESCE(e.nom, cps.nom) as nom_employe,
        COALESCE(e.prenom, cps.prenom) as prenom_employe,
        -- Impôt recalculé
        CASE 
          WHEN ABS(COALESCE(e.pourcentage_taxe, 50) - 100) < 0.01 THEN 0
          WHEN ABS(COALESCE(e.pourcentage_taxe, 50) - 50) < 0.01 THEN cps.charge / 2
          WHEN ABS(COALESCE(e.pourcentage_taxe, 50)) < 0.01 THEN cps.charge
          ELSE cps.charge * (COALESCE(e.pourcentage_taxe, 50) / 100)
        END as impot,
        cps.penalite,
        cps.prime,
        -- Primes
        COALESCE(pt.total_primes, 0) as total_primes,
        -- Total généré (recalculé en temps réel + recla free confirmées)
        COALESCE(rev.total_genere, 0) + COALESCE(rft.total_recla_free, 0) as total_genere,
        -- Paiements
        COALESCE(pai.total_paiements, 0) as total_paiements,
        -- Amendes
        COALESCE(am.total_amendes, 0) as total_amendes,
        -- Recla Free confirmées
        COALESCE(rft.total_recla_free, 0) as total_recla_free,
        -- RAP = Total Généré (incl. recla free) - Salaire Net - Impôt + Primes - Pénalités - Paiements - Amendes
        (
          COALESCE(rev.total_genere, 0) + COALESCE(rft.total_recla_free, 0)
          - cps.salaire_net 
          - CASE 
              WHEN ABS(COALESCE(e.pourcentage_taxe, 50) - 100) < 0.01 THEN 0
              WHEN ABS(COALESCE(e.pourcentage_taxe, 50) - 50) < 0.01 THEN cps.charge / 2
              WHEN ABS(COALESCE(e.pourcentage_taxe, 50)) < 0.01 THEN cps.charge
              ELSE cps.charge * (COALESCE(e.pourcentage_taxe, 50) / 100)
            END
          + COALESCE(pt.total_primes, 0) 
          - COALESCE(cps.penalite, 0) 
          - COALESCE(pai.total_paiements, 0)
          - COALESCE(am.total_amendes, 0)
        ) as rap,
        cps.created_at,
        cps.updated_at
      FROM cout_par_salaire cps
      LEFT JOIN employes e ON cps.matricule IS NOT NULL AND cps.matricule = e.matricule AND e.statut = 'actif'
      LEFT JOIN revenue_by_matricule rev ON cps.matricule IS NOT NULL AND rev.matricule_calc = cps.matricule AND rev.mois_cloture = cps.mois AND rev.annee_cloture = cps.annee
      LEFT JOIN paiements_totaux pai ON pai.cout_par_salaire_id = cps.id
      LEFT JOIN primes_totaux pt ON pt.cout_par_salaire_id = cps.id
      LEFT JOIN amendes_totaux am ON cps.matricule IS NOT NULL AND am.matricule = cps.matricule AND am.mois = cps.mois AND am.annee = cps.annee
      LEFT JOIN recla_free_totaux rft ON cps.matricule IS NOT NULL AND rft.matricule = cps.matricule AND rft.mois = cps.mois AND rft.annee = cps.annee
      ${whereClause}
      ORDER BY cps.annee DESC, cps.mois DESC, cps.nom, cps.prenom
    `

    const result = await query(sqlQuery, params)

    return NextResponse.json({
      success: true,
      couts: result.rows,
      total: result.rows.length
    })
    
  } catch (error) {
    console.error("Erreur GET cout-par-salaire:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST - Créer ou importer des coûts par salarié
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (data.importData && Array.isArray(data.importData)) {
      // Import en lot
      let inserted = 0
      let updated = 0
      let errors = 0
      
      console.log('Données reçues pour import:', data.importData)
      
      for (const item of data.importData) {
        try {
          const { nom, prenom, salaire_net, salaire_brut, cout_total, charge, mois, annee, matricule, taxe } = item
          
          console.log('Traitement de:', { nom, prenom, salaire_net, salaire_brut, cout_total, charge, mois, annee })
          
          // Validation des données
          if (!nom || !prenom || mois === undefined || annee === undefined) {
            console.error('Données manquantes pour:', item)
            errors++
            continue
          }
          
          // Validation et nettoyage des types numériques
          const cleanNumeric = (value: any): number => {
            if (typeof value === 'number') return value
            if (typeof value === 'string') {
              // Nettoyer la chaîne (espaces, guillemets, virgules)
              const cleaned = value.replace(/[\s\u00A0\u2000-\u200B\u2028\u2029\u202F\u205F\u3000]/g, '')
                                 .replace(/["""]/g, '')
                                 .replace(',', '.')
              return parseFloat(cleaned) || 0
            }
            return 0
          }
          
                 const salaireNet = cleanNumeric(salaire_net)
                 const salaireBrut = cleanNumeric(salaire_brut)
                 const coutTotal = cleanNumeric(cout_total)
                 const chargeValue = cleanNumeric(charge)
                 const taxeValue = cleanNumeric(taxe) || 0
                 
                 // Calculer l'impôt selon la logique
                 let impotValue = 0
                 if (Math.abs(taxeValue - 100) < 0.01) {
                   impotValue = 0
                 } else if (Math.abs(taxeValue - 50) < 0.01) {
                   impotValue = chargeValue / 2
                 } else if (Math.abs(taxeValue) < 0.01) {
                   impotValue = chargeValue
                 } else {
                   impotValue = chargeValue * (taxeValue / 100)
                 }
                 
                 console.log('Valeurs converties:', { salaireNet, salaireBrut, coutTotal, chargeValue, taxeValue, impotValue, matricule: matricule || 'N/A' })
          
          // Vérifier si l'enregistrement existe déjà
          const existing = await query(
            'SELECT id FROM cout_par_salaire WHERE nom = $1 AND prenom = $2 AND mois = $3 AND annee = $4',
            [nom, prenom, mois, annee]
          )
          
          if (existing.rows.length > 0) {
            // Mettre à jour
            await query(`
              UPDATE cout_par_salaire 
              SET salaire_net = $1, salaire_brut = $2, cout_total = $3, charge = $4, matricule = $5, taxe = $6, impot = $7, updated_at = CURRENT_TIMESTAMP
              WHERE nom = $8 AND prenom = $9 AND mois = $10 AND annee = $11
            `, [salaireNet, salaireBrut, coutTotal, chargeValue, matricule, taxeValue, impotValue, nom, prenom, mois, annee])
            updated++
            console.log('Mis à jour:', nom, prenom, matricule ? `(matricule: ${matricule})` : '')
          } else {
            // Insérer
            await query(`
              INSERT INTO cout_par_salaire (nom, prenom, salaire_net, salaire_brut, cout_total, charge, mois, annee, matricule, taxe, impot)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [nom, prenom, salaireNet, salaireBrut, coutTotal, chargeValue, mois, annee, matricule, taxeValue, impotValue])
            inserted++
            console.log('Inséré:', nom, prenom, matricule ? `(matricule: ${matricule})` : '')
          }
        } catch (error) {
          console.error('Erreur traitement item:', item, error)
          errors++
        }
      }
      
      return NextResponse.json({
        success: true,
        message: `Import terminé: ${inserted} nouveaux, ${updated} mis à jour${errors > 0 ? `, ${errors} erreurs` : ''}`,
        inserted,
        updated,
        errors
      })
    } else {
      // Création d'un seul enregistrement
      const { nom, prenom, salaire_net, salaire_brut, cout_total, charge, mois, annee } = data
      
      const result = await query(`
        INSERT INTO cout_par_salaire (nom, prenom, salaire_net, salaire_brut, cout_total, charge, mois, annee)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [nom, prenom, salaire_net, salaire_brut, cout_total, charge, mois, annee])
      
      return NextResponse.json({
        success: true,
        cout: result.rows[0]
      })
    }
    
  } catch (error) {
    console.error("Erreur POST cout-par-salaire:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// PUT - Mettre à jour un coût par salarié
export async function PUT(request: NextRequest) {
  try {
    const { id, ...updateData } = await request.json()
    
    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 })
    }
    
    const updateFields: string[] = []
    const params: any[] = []
    let paramIndex = 1
    
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`)
        params.push(value)
        paramIndex++
      }
    })
    
    if (updateFields.length === 0) {
      return NextResponse.json({ error: "Aucune donnée à mettre à jour" }, { status: 400 })
    }
    
    params.push(id)
    const queryText = `
      UPDATE cout_par_salaire 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `
    
    const result = await query(queryText, params)
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Coût non trouvé" }, { status: 400 })
    }
    
    // Si la prime ou la pénalité a été mise à jour, recalculer le RAP
    if (updateData.prime !== undefined || updateData.penalite !== undefined) {
      const cout = result.rows[0]
      const impot = parseFloat(cout.charge) * 0.5 // Calculer l'impôt (50% de la charge)
      const penalite = parseFloat(cout.penalite || 0)
      const newRap = parseFloat(cout.total_genere) - parseFloat(cout.salaire_net) - impot + parseFloat(cout.prime) - penalite
      
      // Désactiver temporairement les triggers pour éviter les conflits
      await query('ALTER TABLE cout_par_salaire DISABLE TRIGGER trigger_recalcul_rap;')
      await query('ALTER TABLE cout_par_salaire DISABLE TRIGGER trigger_calcul_rap_auto;')
      
      try {
        // Mettre à jour le RAP dans la base de données
        await query(`
          UPDATE cout_par_salaire 
          SET rap = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [newRap, cout.id])
        
        // Récupérer les données mises à jour
        const updatedResult = await query(`
          SELECT * FROM cout_par_salaire WHERE id = $1
        `, [cout.id])
        
        return NextResponse.json({
          success: true,
          cout: updatedResult.rows[0]
        })
      } finally {
        // Réactiver les triggers
        await query('ALTER TABLE cout_par_salaire ENABLE TRIGGER trigger_recalcul_rap;')
        await query('ALTER TABLE cout_par_salaire ENABLE TRIGGER trigger_calcul_rap_auto;')
      }
    }
    
    return NextResponse.json({
      success: true,
      cout: result.rows[0]
    })
    
  } catch (error) {
    console.error("Erreur PUT cout-par-salaire:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// DELETE - Supprimer un coût par salarié
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 })
    }
    
    const result = await query('DELETE FROM cout_par_salaire WHERE id = $1 RETURNING *', [id])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Coût non trouvé" }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      message: "Coût supprimé avec succès"
    })
    
  } catch (error) {
    console.error("Erreur DELETE cout-par-salaire:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}