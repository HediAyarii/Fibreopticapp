import pkg from 'pg'
const { Pool } = pkg

// Configuration de la base de données
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

async function syncAllTechniciansRevenue() {
  try {
    console.log('🎯 Synchronisation des revenus pour tous les techniciens...')
    console.log('📊 Objectif: Mettre à jour les "Total Généré" dans cout_par_salaire')
    
    // 1. Calculer les revenus pour tous les techniciens
    console.log('\n🧮 Calcul des revenus pour tous les techniciens:')
    const revenueResult = await pool.query(`
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
          AND (
            (i.cloture_tech >= $1 OR i.cloture_hotline >= $1) OR
            (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND i.date_rdv >= $1)
          )
          AND (
            (i.cloture_tech <= $2 OR i.cloture_hotline <= $2) OR
            (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND i.date_rdv <= $2) OR
            (i.cloture_tech IS NULL AND i.cloture_hotline IS NOT NULL AND i.cloture_hotline::date <= $2::date) OR
            (i.cloture_hotline IS NULL AND i.cloture_tech IS NOT NULL AND i.cloture_tech::date <= $2::date)
          )
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
      ORDER BY total_recette_technicien DESC
    `, ['2025-05-01', '2025-05-31'])
    
    console.log(`📋 ${revenueResult.rows.length} techniciens trouvés avec revenus:`)
    revenueResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.employe_nom} ${row.employe_prenom} (${row.matricule}) - ${row.total_recette_technicien}€`)
    })
    
    // 2. Synchroniser chaque technicien
    console.log('\n🔧 Synchronisation des revenus...')
    let updated = 0
    let errors = 0
    
    for (const revenue of revenueResult.rows) {
      try {
        // Fonction de normalisation des noms
        const normalizeName = (name) => {
          return name?.toLowerCase()
            .replace(/[-\s]/g, '') // Supprimer tirets et espaces
            .replace(/ben/g, '') // Supprimer "ben" 
            .replace(/bou/g, '') // Supprimer "bou"
            .trim() || ''
        }
        
        // Trouver l'employé correspondant dans cout_par_salaire
        const coutResult = await pool.query(`
          SELECT id, nom, prenom, matricule, total_genere
          FROM cout_par_salaire 
          WHERE mois = 5 AND annee = 2025
          AND (
            matricule = $1 OR
            (LOWER(nom) = LOWER($2) AND LOWER(prenom) = LOWER($3)) OR
            (LOWER(nom) = LOWER($3) AND LOWER(prenom) = LOWER($2))
          )
        `, [revenue.matricule, revenue.employe_nom, revenue.employe_prenom])
        
        if (coutResult.rows.length > 0) {
          const cout = coutResult.rows[0]
          const newTotal = parseFloat(revenue.total_recette_technicien) || 0
          const currentTotal = parseFloat(cout.total_genere) || 0
          
          if (Math.abs(newTotal - currentTotal) > 0.01) {
            // Mettre à jour le total généré
            await pool.query(`
              UPDATE cout_par_salaire 
              SET 
                total_genere = $1,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = $2
            `, [newTotal, cout.id])
            
            console.log(`✅ ${cout.nom} ${cout.prenom}: ${currentTotal}€ → ${newTotal}€`)
            updated++
          } else {
            console.log(`ℹ️ ${cout.nom} ${cout.prenom}: Déjà à jour (${currentTotal}€)`)
          }
        } else {
          console.log(`⚠️ ${revenue.employe_nom} ${revenue.employe_prenom}: Non trouvé dans cout_par_salaire`)
        }
      } catch (error) {
        console.error(`❌ Erreur pour ${revenue.employe_nom} ${revenue.employe_prenom}:`, error.message)
        errors++
      }
    }
    
    // 3. Recalculer les RAP pour tous les techniciens
    console.log('\n🧮 Recalcul des RAP...')
    const rapResult = await pool.query(`
      SELECT 
        id, nom, prenom, matricule,
        calculer_rap_avec_paiements(id) as nouveau_rap
      FROM cout_par_salaire 
      WHERE mois = 5 AND annee = 2025
      ORDER BY nom, prenom
    `)
    
    console.log(`✅ RAP recalculé pour ${rapResult.rows.length} techniciens`)
    
    // 4. Vérification finale
    console.log('\n✅ Vérification finale...')
    const finalCheck = await pool.query(`
      SELECT 
        nom, prenom, matricule, total_genere, rap
      FROM cout_par_salaire 
      WHERE mois = 5 AND annee = 2025
      ORDER BY total_genere DESC
    `)
    
    console.log(`📊 Résumé final:`)
    finalCheck.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.nom} ${row.prenom} (${row.matricule}) - Total: ${row.total_genere}€ - RAP: ${row.rap}€`)
    })
    
    console.log('\n🎯 Synchronisation terminée !')
    console.log(`✅ ${updated} techniciens mis à jour`)
    console.log(`❌ ${errors} erreurs`)
    console.log('💡 Les "Total Généré" devraient maintenant s\'afficher correctement dans le front-end')
    
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error.message)
  } finally {
    await pool.end()
  }
}

syncAllTechniciansRevenue()
