import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

// GET - Récupérer les coûts par salarié avec filtres
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mois = searchParams.get('mois')
    const annee = searchParams.get('annee')
    
    let whereClause = ''
    const params: any[] = []
    let paramIndex = 1
    
    if (mois && annee) {
      whereClause = 'WHERE mois = $1 AND annee = $2'
      params.push(parseInt(mois), parseInt(annee))
    } else if (mois) {
      whereClause = 'WHERE mois = $1'
      params.push(parseInt(mois))
    } else if (annee) {
      whereClause = 'WHERE annee = $1'
      params.push(parseInt(annee))
    }
    
    // Récupérer les données de base
    const result = await query(`
      SELECT 
        id,
        nom,
        prenom,
        salaire_net,
        salaire_brut,
        cout_total,
        charge,
        mois,
        annee,
        matricule,
        taxe,
        impot,
        penalite,
        total_genere,
        rap,
        created_at,
        updated_at
      FROM cout_par_salaire 
      ${whereClause}
      ORDER BY annee DESC, mois DESC, nom, prenom
    `, params)
    
    // Calculer le total généré pour chaque employé en utilisant l'API revenue-calculation
    const coutsWithRevenue = await Promise.all(
      result.rows.map(async (cout: any) => {
        try {
          if (cout.matricule && cout.mois && cout.annee) {
            // Construire les dates de début et fin du mois
            const dateFrom = `${cout.annee}-${String(cout.mois).padStart(2, '0')}-01`
            const dateTo = `${cout.annee}-${String(cout.mois).padStart(2, '0')}-${new Date(cout.annee, cout.mois, 0).getDate()}`
            
            console.log(`🔍 Calcul pour ${cout.nom} ${cout.prenom} (${cout.matricule}): ${dateFrom} à ${dateTo}`)
            
                   // Calculer directement les revenus depuis la base de données avec correspondance améliorée
                   const revenueQuery = `
                     WITH intervention_revenue AS (
                       SELECT 
                         i.id as intervention_id,
                         i.num_inter,
                         i.client,
                         i.date_rdv,
                         i.prenom_technicien,
                         i.nom_technicien,
                         i.cloture_tech,
                         i.cloture_hotline,
                         i.articles,
                         i.statut,
                         i.type_intervention,
                         -- Correspondance améliorée avec normalisation des noms
                         COALESCE(e.id, -1) as employe_id,
                         COALESCE(e.nom, i.nom_technicien) as employe_nom,
                         COALESCE(e.prenom, i.prenom_technicien) as employe_prenom,
                         COALESCE(e.matricule, CONCAT('TECH_', UPPER(SUBSTRING(i.nom_technicien, 1, 3)), UPPER(SUBSTRING(i.prenom_technicien, 1, 2)))) as matricule,
                         -- Calculer les recettes basées sur les articles
                         CASE 
                           WHEN i.statut = 'CLOTURE TERMINEE' THEN
                             COALESCE(
                               (SELECT SUM(
                                 CASE 
                                   WHEN cp.prix_tech IS NOT NULL THEN cp.prix_tech
                                   ELSE 0
                                 END
                               )
                               FROM unnest(string_to_array(i.articles, ',')) as article_item
                               LEFT JOIN company_pricing cp ON 
                                 TRIM(SPLIT_PART(article_item, 'x', 1)) = cp.service_code
                                 AND cp.company_name = 'ERT OUEST'
                                 AND cp.category = i.type_intervention
                               ), 0
                             )
                           ELSE 0
                         END as recette_technicien
                       FROM interventions i
                       LEFT JOIN employes e ON (
                         -- Correspondance améliorée avec normalisation
                         (
                           LOWER(TRIM(e.prenom)) = LOWER(TRIM(i.prenom_technicien)) AND 
                           LOWER(TRIM(e.nom)) = LOWER(TRIM(i.nom_technicien))
                         ) OR (
                           -- Correspondance avec tirets (ex: Mohamed-Bechir vs BECHIRMOULAHI)
                           LOWER(REGEXP_REPLACE(e.prenom, '[^a-zA-Z0-9]', '', 'g')) = LOWER(REGEXP_REPLACE(i.prenom_technicien, '[^a-zA-Z0-9]', '', 'g')) AND
                           LOWER(REGEXP_REPLACE(e.nom, '[^a-zA-Z0-9]', '', 'g')) = LOWER(REGEXP_REPLACE(i.nom_technicien, '[^a-zA-Z0-9]', '', 'g'))
                         ) OR (
                           -- Correspondance inversée
                           LOWER(TRIM(e.prenom)) = LOWER(TRIM(i.nom_technicien)) AND 
                           LOWER(TRIM(e.nom)) = LOWER(TRIM(i.prenom_technicien))
                         ) OR (
                           -- Correspondance partielle (contient)
                           (
                             LOWER(e.prenom) LIKE '%' || LOWER(i.prenom_technicien) || '%' OR
                             LOWER(i.prenom_technicien) LIKE '%' || LOWER(e.prenom) || '%'
                           ) AND (
                             LOWER(e.nom) LIKE '%' || LOWER(i.nom_technicien) || '%' OR
                             LOWER(i.nom_technicien) LIKE '%' || LOWER(e.nom) || '%'
                           )
                         )
                       )
                       WHERE i.statut = 'CLOTURE TERMINEE'
                         AND i.articles IS NOT NULL 
                         AND i.articles != ''
                         AND (i.cloture_tech >= $1 OR i.cloture_hotline >= $1)
                         AND (i.cloture_tech <= $2 OR i.cloture_hotline <= $2)
                     )
                     SELECT 
                       employe_id,
                       employe_nom,
                       employe_prenom,
                       matricule,
                       COUNT(*) as nombre_interventions,
                       SUM(recette_technicien) as total_recette_technicien
                     FROM intervention_revenue
                     GROUP BY employe_id, employe_nom, employe_prenom, matricule
                   `
            
            const revenueResult = await query(revenueQuery, [dateFrom, dateTo])
            
            if (revenueResult.rows.length > 0) {
              // Fonction de normalisation des noms
              const normalizeName = (name: string) => {
                return name?.toLowerCase()
                  .replace(/[-\s]/g, '') // Supprimer tirets et espaces
                  .replace(/ben/g, '') // Supprimer "ben" 
                  .replace(/bou/g, '') // Supprimer "bou"
                  .trim() || ''
              }
              
              // Trouver l'employé correspondant par matricule ET par nom
              let employeeRevenue = revenueResult.rows.find((emp: any) => 
                emp.matricule === cout.matricule
              )
              
              console.log(`  - Recherche par matricule ${cout.matricule}: ${employeeRevenue ? 'TROUVÉ' : 'NON TROUVÉ'}`)
              
              // Si pas trouvé par matricule, essayer par nom avec correspondance intelligente
              if (!employeeRevenue) {
                console.log(`  - Recherche par nom: ${cout.nom} ${cout.prenom}`)
                employeeRevenue = revenueResult.rows.find((emp: any) => {
                  const empNom = normalizeName(emp.employe_nom)
                  const empPrenom = normalizeName(emp.employe_prenom)
                  const coutNom = normalizeName(cout.nom)
                  const coutPrenom = normalizeName(cout.prenom)
                  
                  console.log(`    - Comparaison: "${empNom} ${empPrenom}" vs "${coutNom} ${coutPrenom}"`)
                  
                  // Correspondance exacte
                  if (empNom === coutNom && empPrenom === coutPrenom) {
                    console.log(`    - Correspondance exacte trouvée`)
                    return true
                  }
                  
                  // Correspondance inversée
                  if (empNom === coutPrenom && empPrenom === coutNom) {
                    console.log(`    - Correspondance inversée trouvée`)
                    return true
                  }
                  
                  // Correspondance partielle - nom contient ou est contenu
                  const nomMatch = empNom.includes(coutNom) || coutNom.includes(empNom) || 
                                 empNom.includes(coutPrenom) || coutPrenom.includes(empNom)
                  const prenomMatch = empPrenom.includes(coutPrenom) || coutPrenom.includes(empPrenom) ||
                                     empPrenom.includes(coutNom) || coutNom.includes(empPrenom)
                  
                  if (nomMatch && prenomMatch) {
                    console.log(`    - Correspondance partielle trouvée`)
                    return true
                  }
                  
                  // Correspondance avec tirets (ex: Mohamed-Bechir vs BECHIRMOULAHI)
                  const empNomClean = empNom.replace(/-/g, '')
                  const coutNomClean = coutNom.replace(/-/g, '')
                  const empPrenomClean = empPrenom.replace(/-/g, '')
                  const coutPrenomClean = coutPrenom.replace(/-/g, '')
                  
                  if (empNomClean.includes(coutNomClean) && empPrenomClean.includes(coutPrenomClean)) {
                    console.log(`    - Correspondance avec tirets trouvée`)
                    return true
                  }
                  if (empNomClean.includes(coutPrenomClean) && empPrenomClean.includes(coutNomClean)) {
                    console.log(`    - Correspondance inversée avec tirets trouvée`)
                    return true
                  }
                  
                  return false
                })
                console.log(`  - Recherche par nom: ${employeeRevenue ? 'TROUVÉ' : 'NON TROUVÉ'}`)
              }
              
                     const totalGenere = employeeRevenue ? parseFloat(employeeRevenue.total_recette_technicien) || 0 : 0
                     
                     console.log(`  - Employé trouvé: ${employeeRevenue ? 'OUI' : 'NON'}`)
                     if (employeeRevenue) {
                       console.log(`  - Nom dans revenue: ${employeeRevenue.employe_nom} ${employeeRevenue.employe_prenom}`)
                       console.log(`  - Matricule dans revenue: ${employeeRevenue.matricule}`)
                     }
                     console.log(`  - Total généré: ${totalGenere}€`)
                     
                     // Mettre à jour automatiquement le total_genere dans la base de données
                     if (totalGenere > 0) {
                       try {
                         await query(`
                           UPDATE cout_par_salaire 
                           SET 
                             total_genere = $1,
                             updated_at = CURRENT_TIMESTAMP
                           WHERE id = $2
                         `, [totalGenere, cout.id])
                         console.log(`  - Total généré mis à jour en base: ${totalGenere}€`)
                       } catch (updateError) {
                         console.error(`  - Erreur mise à jour total_genere:`, updateError)
                       }
                     }
                     
                     // Calculer les pénalités pour ce mois
                     console.log(`🔍 Calcul des pénalités pour ${cout.nom} ${cout.prenom} (${cout.mois}/${cout.annee})`)
                     
                     let totalPenalites = 0
                     if (cout.matricule) {
                       try {
                         // Calculer les pénalités basées sur date_attribution et correspondance d'employé
                         const penalitesQuery = `
                           SELECT 
                             p.id,
                             p.montant,
                             p.date_attribution,
                             p.motif,
                             p.type_penalite,
                             e.nom as employe_nom,
                             e.prenom as employe_prenom,
                             e.matricule as employe_matricule
                           FROM penalites p
                           LEFT JOIN employes e ON p.employe_id = e.id
                           WHERE (
                             -- Correspondance par matricule
                             e.matricule = $1
                             OR
                             -- Correspondance par nom/prénom avec normalisation
                             (
                               LOWER(TRIM(e.prenom)) = LOWER(TRIM($2)) AND 
                               LOWER(TRIM(e.nom)) = LOWER(TRIM($3))
                             ) OR (
                               -- Correspondance inversée
                               LOWER(TRIM(e.prenom)) = LOWER(TRIM($3)) AND 
                               LOWER(TRIM(e.nom)) = LOWER(TRIM($2))
                             ) OR (
                               -- Correspondance avec tirets (ex: Mohamed-Bechir vs BECHIRMOULAHI)
                               LOWER(REGEXP_REPLACE(e.prenom, '[^a-zA-Z0-9]', '', 'g')) = LOWER(REGEXP_REPLACE($2, '[^a-zA-Z0-9]', '', 'g')) AND
                               LOWER(REGEXP_REPLACE(e.nom, '[^a-zA-Z0-9]', '', 'g')) = LOWER(REGEXP_REPLACE($3, '[^a-zA-Z0-9]', '', 'g'))
                             ) OR (
                               -- Correspondance inversée avec tirets
                               LOWER(REGEXP_REPLACE(e.prenom, '[^a-zA-Z0-9]', '', 'g')) = LOWER(REGEXP_REPLACE($3, '[^a-zA-Z0-9]', '', 'g')) AND
                               LOWER(REGEXP_REPLACE(e.nom, '[^a-zA-Z0-9]', '', 'g')) = LOWER(REGEXP_REPLACE($2, '[^a-zA-Z0-9]', '', 'g'))
                             )
                           )
                           AND EXTRACT(YEAR FROM p.date_attribution) = $4
                           AND EXTRACT(MONTH FROM p.date_attribution) = $5
                           ORDER BY p.date_attribution DESC
                         `
                         
                         const penalitesResult = await query(penalitesQuery, [
                           cout.matricule,
                           cout.prenom,
                           cout.nom,
                           cout.annee,
                           cout.mois
                         ])
                         
                         totalPenalites = penalitesResult.rows.reduce((sum, penalite) => {
                           const montant = parseFloat(penalite.montant) || 0
                           console.log(`    - Pénalité: ${penalite.motif} (${penalite.type_penalite}) = ${montant}€ - ${penalite.date_attribution}`)
                           return sum + montant
                         }, 0)
                         
                         console.log(`  - Total pénalités trouvées: ${penalitesResult.rows.length}`)
                         console.log(`  - Montant total pénalités: ${totalPenalites}€`)
                         
                         // Mettre à jour la colonne penalite dans cout_par_salaire
                  if (totalPenalites > 0) {
                    await query(`
                      UPDATE cout_par_salaire 
                      SET 
                        penalite = $1,
                        updated_at = CURRENT_TIMESTAMP
                      WHERE id = $2
                    `, [totalPenalites, cout.id])
                    console.log(`  - Pénalités mises à jour en base: ${totalPenalites}€`)
                    
                    // Les pénalités sont maintenant déduites directement du RAP via la fonction calculer_rap_avec_paiements
                    console.log(`🔧 Pénalités calculées: ${totalPenalites}€ (déduites directement du RAP)`)
                  }
                         
                       } catch (penaliteError) {
                         console.error(`  - Erreur calcul pénalités:`, penaliteError)
                       }
                     } else {
                       console.log(`  - Pas de matricule pour calculer les pénalités`)
                     }
              
                     // Gérer les déductions de pénalités automatiques
                     if (totalPenalites > 0) {
                       console.log(`🔧 Gestion des déductions de pénalités: ${totalPenalites}€`)
                       
                       try {
                         // Vérifier s'il y a déjà une déduction de pénalité pour ce mois
                         const existingPenaliteDeduction = await query(`
                           SELECT id, montant_verse 
                           FROM paiements_employes 
                           WHERE cout_par_salaire_id = $1 
                             AND commentaires LIKE '%Déduction pénalités%'
                             AND EXTRACT(YEAR FROM date_paiement) = $2
                             AND EXTRACT(MONTH FROM date_paiement) = $3
                           LIMIT 1
                         `, [cout.id, cout.annee, cout.mois])
                         
                         if (existingPenaliteDeduction.rows.length === 0) {
                           // Créer une déduction automatique pour les pénalités
                           const deductionPenalite = await query(`
                             INSERT INTO paiements_employes (
                               cout_par_salaire_id,
                               employe_id,
                               montant_verse,
                               date_paiement,
                               methode_paiement,
                               reference_paiement,
                               commentaires,
                               statut
                             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                             RETURNING *
                           `, [
                             cout.id,
                             cout.employe_id || null, // Utiliser l'employe_id si disponible
                             -totalPenalites, // Montant négatif pour déduction
                             new Date(cout.annee, cout.mois - 1, 1).toISOString().split('T')[0], // Premier jour du mois
                             'deduction_penalite',
                             `PENALITE-${cout.mois}-${cout.annee}`,
                             `Déduction pénalités automatique - ${cout.mois}/${cout.annee} (${totalPenalites.toFixed(2)}€)`,
                             'confirme'
                           ])
                           
                           console.log(`  ✅ Déduction de pénalité créée: -${totalPenalites.toFixed(2)}€`)
                         } else {
                           const existingDeduction = existingPenaliteDeduction.rows[0]
                           const existingAmount = parseFloat(existingDeduction.montant_verse) || 0
                           
                           if (Math.abs(existingAmount) !== totalPenalites) {
                             // Mettre à jour la déduction existante si le montant a changé
                             await query(`
                               UPDATE paiements_employes 
                               SET 
                                 montant_verse = $1,
                                 commentaires = $2,
                                 updated_at = CURRENT_TIMESTAMP
                               WHERE id = $3
                             `, [
                               -totalPenalites,
                               `Déduction pénalités automatique - ${cout.mois}/${cout.annee} (${totalPenalites.toFixed(2)}€)`,
                               existingDeduction.id
                             ])
                             
                             console.log(`  ✅ Déduction de pénalité mise à jour: -${totalPenalites.toFixed(2)}€`)
                           } else {
                             console.log(`  ℹ️ Déduction de pénalité déjà à jour: -${totalPenalites.toFixed(2)}€`)
                           }
                         }
                       } catch (deductionError) {
                         console.error(`  ❌ Erreur création déduction pénalité:`, deductionError)
                       }
                     }
                     
                     // Calculer le RAP avec les paiements (utiliser la fonction de la base de données)
                     const rapResult = await query(`
                       SELECT calculer_rap_avec_paiements($1) as rap_actuel
                     `, [cout.id])
                     
                     const rapValue = parseFloat(rapResult.rows[0].rap_actuel) || 0
                     
                     // Récupérer le total des paiements pour affichage
                     const paiementsResult = await query(`
                       SELECT calculer_total_paiements($1) as total_paiements
                     `, [cout.id])
                     
                     const totalPaiements = parseFloat(paiementsResult.rows[0].total_paiements) || 0
                     
                     console.log(`  - RAP avec paiements: ${rapValue.toFixed(2)}€ (paiements: ${totalPaiements.toFixed(2)}€)`)
              
              return {
                ...cout,
                total_genere: totalGenere,
                penalite: totalPenalites,
                rap: rapValue,
                total_paiements: totalPaiements
              }
            } else {
              console.log(`  - Erreur API revenue-calculation: ${revenueData.error}`)
              
              // Calculer les pénalités même sans revenus
              let totalPenalites = 0
              if (cout.matricule) {
                try {
                  const penalitesQuery = `
                    SELECT 
                      p.id,
                      p.montant,
                      p.date_attribution,
                      p.motif,
                      p.type_penalite,
                      e.nom as employe_nom,
                      e.prenom as employe_prenom,
                      e.matricule as employe_matricule
                    FROM penalites p
                    LEFT JOIN employes e ON p.employe_id = e.id
                    WHERE (
                      e.matricule = $1
                      OR
                      (LOWER(TRIM(e.prenom)) = LOWER(TRIM($2)) AND LOWER(TRIM(e.nom)) = LOWER(TRIM($3)))
                      OR
                      (LOWER(TRIM(e.prenom)) = LOWER(TRIM($3)) AND LOWER(TRIM(e.nom)) = LOWER(TRIM($2)))
                    )
                    AND EXTRACT(YEAR FROM p.date_attribution) = $4
                    AND EXTRACT(MONTH FROM p.date_attribution) = $5
                    ORDER BY p.date_attribution DESC
                  `
                  
                  const penalitesResult = await query(penalitesQuery, [
                    cout.matricule,
                    cout.prenom,
                    cout.nom,
                    cout.annee,
                    cout.mois
                  ])
                  
                  totalPenalites = penalitesResult.rows.reduce((sum, penalite) => {
                    const montant = parseFloat(penalite.montant) || 0
                    return sum + montant
                  }, 0)
                  
                  if (totalPenalites > 0) {
                    await query(`
                      UPDATE cout_par_salaire 
                      SET 
                        penalite = $1,
                        updated_at = CURRENT_TIMESTAMP
                      WHERE id = $2
                    `, [totalPenalites, cout.id])
                  }
                  
                } catch (penaliteError) {
                  console.error(`  - Erreur calcul pénalités:`, penaliteError)
                }
              }
              
              // Calculer le RAP même sans revenus (avec paiements)
              const rapResult = await query(`
                SELECT calculer_rap_avec_paiements($1) as rap_actuel
              `, [cout.id])
              
              const rapValue = parseFloat(rapResult.rows[0].rap_actuel) || 0
              
              const paiementsResult = await query(`
                SELECT calculer_total_paiements($1) as total_paiements
              `, [cout.id])
              
              const totalPaiements = parseFloat(paiementsResult.rows[0].total_paiements) || 0
              
              return {
                ...cout,
                total_genere: 0,
                penalite: totalPenalites,
                rap: rapValue,
                total_paiements: totalPaiements
              }
            }
          } else {
            // Calculer les pénalités même sans informations complètes
            let totalPenalites = 0
            if (cout.matricule) {
              try {
                const penalitesQuery = `
                  SELECT 
                    p.id,
                    p.montant,
                    p.date_attribution,
                    p.motif,
                    p.type_penalite,
                    e.nom as employe_nom,
                    e.prenom as employe_prenom,
                    e.matricule as employe_matricule
                  FROM penalites p
                  LEFT JOIN employes e ON p.employe_id = e.id
                  WHERE (
                    e.matricule = $1
                    OR
                    (LOWER(TRIM(e.prenom)) = LOWER(TRIM($2)) AND LOWER(TRIM(e.nom)) = LOWER(TRIM($3)))
                    OR
                    (LOWER(TRIM(e.prenom)) = LOWER(TRIM($3)) AND LOWER(TRIM(e.nom)) = LOWER(TRIM($2)))
                  )
                  AND EXTRACT(YEAR FROM p.date_attribution) = $4
                  AND EXTRACT(MONTH FROM p.date_attribution) = $5
                  ORDER BY p.date_attribution DESC
                `
                
                const penalitesResult = await query(penalitesQuery, [
                  cout.matricule,
                  cout.prenom,
                  cout.nom,
                  cout.annee,
                  cout.mois
                ])
                
                totalPenalites = penalitesResult.rows.reduce((sum, penalite) => {
                  const montant = parseFloat(penalite.montant) || 0
                  return sum + montant
                }, 0)
                
                if (totalPenalites > 0) {
                  await query(`
                    UPDATE cout_par_salaire 
                    SET 
                      penalite = $1,
                      updated_at = CURRENT_TIMESTAMP
                    WHERE id = $2
                  `, [totalPenalites, cout.id])
                }
                
              } catch (penaliteError) {
                console.error(`  - Erreur calcul pénalités:`, penaliteError)
              }
            }
            
            // Calculer le RAP même sans informations complètes (avec paiements)
            const rapResult = await query(`
              SELECT calculer_rap_avec_paiements($1) as rap_actuel
            `, [cout.id])
            
            const rapValue = parseFloat(rapResult.rows[0].rap_actuel) || 0
            
            const paiementsResult = await query(`
              SELECT calculer_total_paiements($1) as total_paiements
            `, [cout.id])
            
            const totalPaiements = parseFloat(paiementsResult.rows[0].total_paiements) || 0
            
            return {
              ...cout,
              total_genere: 0,
              penalite: totalPenalites,
              rap: rapValue,
              total_paiements: totalPaiements
            }
          }
        } catch (error) {
          console.error(`Erreur calcul total généré pour ${cout.nom} ${cout.prenom}:`, error)
          
          // En cas d'erreur, essayer de calculer au moins le RAP avec paiements
          try {
            const rapResult = await query(`
              SELECT calculer_rap_avec_paiements($1) as rap_actuel
            `, [cout.id])
            
            const rapValue = parseFloat(rapResult.rows[0].rap_actuel) || 0
            
            const paiementsResult = await query(`
              SELECT calculer_total_paiements($1) as total_paiements
            `, [cout.id])
            
            const totalPaiements = parseFloat(paiementsResult.rows[0].total_paiements) || 0
            
            return {
              ...cout,
              total_genere: 0,
              rap: rapValue,
              total_paiements: totalPaiements,
              error: error.message
            }
          } catch (rapError) {
            return {
              ...cout,
              total_genere: 0,
              rap: 0,
              total_paiements: 0,
              error: error.message
            }
          }
        }
      })
    )
    
    return NextResponse.json({
      success: true,
      couts: coutsWithRevenue,
      total: coutsWithRevenue.length
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
      return NextResponse.json({ error: "Coût non trouvé" }, { status: 404 })
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
