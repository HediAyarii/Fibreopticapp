import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function updateAllEmployeesRevenue() {
  console.log('🔄 Mise à jour automatique des revenus pour tous les employés...')
  
  try {
    // 1. Récupérer tous les employés dans cout_par_salaire
    console.log('\n📋 1. Récupération des employés...')
    const employes = await pool.query(`
      SELECT id, nom, prenom, matricule, mois, annee, total_genere
      FROM cout_par_salaire 
      ORDER BY annee DESC, mois DESC, nom, prenom
    `)
    
    console.log(`✅ ${employes.rows.length} employés trouvés`)
    
    let updated = 0
    let errors = 0
    
    // 2. Pour chaque employé, calculer et mettre à jour le revenu
    for (const employe of employes.rows) {
      try {
        console.log(`\n🔍 Traitement: ${employe.nom} ${employe.prenom} (${employe.matricule})`)
        
        // Construire les dates de début et fin du mois
        const dateFrom = `${employe.annee}-${String(employe.mois).padStart(2, '0')}-01`
        const dateTo = `${employe.annee}-${String(employe.mois).padStart(2, '0')}-${new Date(employe.annee, employe.mois, 0).getDate()}`
        
        // Calculer le revenu avec la correspondance améliorée
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
          WHERE employe_id = $3
          GROUP BY employe_id, employe_nom, employe_prenom, matricule
        `
        
        const revenueResult = await pool.query(revenueQuery, [dateFrom, dateTo, employe.id])
        
        if (revenueResult.rows.length > 0) {
          const revenue = revenueResult.rows[0]
          const totalGenere = parseFloat(revenue.total_recette_technicien) || 0
          
          console.log(`  ✅ Revenu trouvé: ${totalGenere}€ (${revenue.nombre_interventions} interventions)`)
          
          // Mettre à jour le total_genere
          await pool.query(`
            UPDATE cout_par_salaire 
            SET 
              total_genere = $1,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [totalGenere, employe.id])
          
          console.log(`  ✅ Total généré mis à jour: ${totalGenere}€`)
          updated++
        } else {
          console.log(`  ⚠️ Aucun revenu trouvé pour cette période`)
        }
        
      } catch (error) {
        console.error(`  ❌ Erreur pour ${employe.nom} ${employe.prenom}:`, error.message)
        errors++
      }
    }
    
    // 3. Recalculer tous les RAP
    console.log('\n📋 3. Recalcul des RAP...')
    const rapUpdate = await pool.query(`
      UPDATE cout_par_salaire 
      SET 
        rap = calculer_rap_avec_paiements(id),
        updated_at = CURRENT_TIMESTAMP
      WHERE id IN (SELECT id FROM cout_par_salaire)
    `)
    
    console.log(`✅ ${rapUpdate.rowCount} RAP recalculés`)
    
    // 4. Résumé
    console.log('\n🎯 Mise à jour terminée !')
    console.log(`📊 Résultats:`)
    console.log(`  - Employés traités: ${employes.rows.length}`)
    console.log(`  - Mis à jour: ${updated}`)
    console.log(`  - Erreurs: ${errors}`)
    console.log(`  - RAP recalculés: ${rapUpdate.rowCount}`)
    
    console.log('\n✅ L\'application calculera maintenant automatiquement les bonnes valeurs !')
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error.message)
  } finally {
    await pool.end()
  }
}

updateAllEmployeesRevenue()









