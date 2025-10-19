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

async function testCoutParSalaireApi() {
  try {
    console.log('🔍 Test de l\'API cout-par-salaire pour CHIKHA SALEM...')
    
    // 1. Simuler l'appel API avec les paramètres mai 2025
    console.log('\n📊 Simulation de l\'API cout-par-salaire (mois=5, annee=2025)...')
    
    const coutsResult = await pool.query(`
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
      WHERE mois = 5 AND annee = 2025
      ORDER BY annee DESC, mois DESC, nom, prenom
    `)
    
    console.log(`📋 ${coutsResult.rows.length} enregistrements trouvés pour mai 2025:`)
    coutsResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.nom} ${row.prenom} (${row.matricule}) - Total: ${row.total_genere}€`)
    })
    
    // 2. Trouver CHIKHA SALEM spécifiquement
    const chikhaSalem = coutsResult.rows.find(row => 
      row.nom.toLowerCase() === 'chikha' && row.prenom.toLowerCase() === 'salem'
    )
    
    if (chikhaSalem) {
      console.log('\n🎯 CHIKHA SALEM trouvé:')
      console.log(`   - ID: ${chikhaSalem.id}`)
      console.log(`   - Nom: ${chikhaSalem.nom} ${chikhaSalem.prenom}`)
      console.log(`   - Matricule: ${chikhaSalem.matricule}`)
      console.log(`   - Total Généré: ${chikhaSalem.total_genere}€`)
      console.log(`   - RAP: ${chikhaSalem.rap}€`)
      console.log(`   - Mis à jour: ${chikhaSalem.updated_at}`)
      
      // 3. Simuler le calcul de revenus comme dans l'API
      console.log('\n🧮 Simulation du calcul de revenus...')
      
      const dateFrom = '2025-05-01'
      const dateTo = '2025-05-31'
      
      console.log(`📅 Période: ${dateFrom} à ${dateTo}`)
      
      // Requête de calcul des revenus (identique à l'API)
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
      
      const revenueResult = await pool.query(revenueQuery, [dateFrom, dateTo])
      
      console.log(`📊 ${revenueResult.rows.length} employés trouvés avec revenus:`)
      revenueResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.employe_nom} ${row.employe_prenom} (${row.matricule}) - ${row.total_recette_technicien}€`)
      })
      
      // 4. Chercher CHIKHA SALEM dans les résultats
      const chikhaInRevenue = revenueResult.rows.find(emp => 
        emp.matricule === chikhaSalem.matricule
      )
      
      if (!chikhaInRevenue) {
        console.log('\n❌ CHIKHA SALEM non trouvé par matricule, recherche par nom...')
        
        // Fonction de normalisation des noms (identique à l'API)
        const normalizeName = (name) => {
          return name?.toLowerCase()
            .replace(/[-\s]/g, '') // Supprimer tirets et espaces
            .replace(/ben/g, '') // Supprimer "ben" 
            .replace(/bou/g, '') // Supprimer "bou"
            .trim() || ''
        }
        
        const chikhaInRevenueByName = revenueResult.rows.find((emp) => {
          const empNom = normalizeName(emp.employe_nom)
          const empPrenom = normalizeName(emp.employe_prenom)
          const coutNom = normalizeName(chikhaSalem.nom)
          const coutPrenom = normalizeName(chikhaSalem.prenom)
          
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
          
          // Correspondance partielle
          const nomMatch = empNom.includes(coutNom) || coutNom.includes(empNom) || 
                         empNom.includes(coutPrenom) || coutPrenom.includes(empNom)
          const prenomMatch = empPrenom.includes(coutPrenom) || coutPrenom.includes(empPrenom) ||
                             empPrenom.includes(coutNom) || coutNom.includes(empPrenom)
          
          if (nomMatch && prenomMatch) {
            console.log(`    - Correspondance partielle trouvée`)
            return true
          }
          
          return false
        })
        
        if (chikhaInRevenueByName) {
          console.log(`✅ CHIKHA SALEM trouvé par nom: ${chikhaInRevenueByName.employe_nom} ${chikhaInRevenueByName.employe_prenom}`)
          console.log(`✅ Total recette: ${chikhaInRevenueByName.total_recette_technicien}€`)
          
          // Mettre à jour la base de données
          console.log('\n🔧 Mise à jour de la base de données...')
          await pool.query(`
            UPDATE cout_par_salaire 
            SET 
              total_genere = $1,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [chikhaInRevenueByName.total_recette_technicien, chikhaSalem.id])
          
          console.log(`✅ Total généré mis à jour: ${chikhaInRevenueByName.total_recette_technicien}€`)
        } else {
          console.log('❌ CHIKHA SALEM non trouvé dans les revenus')
        }
      } else {
        console.log(`✅ CHIKHA SALEM trouvé par matricule: ${chikhaInRevenue.total_recette_technicien}€`)
        
        // Mettre à jour la base de données
        console.log('\n🔧 Mise à jour de la base de données...')
        await pool.query(`
          UPDATE cout_par_salaire 
          SET 
            total_genere = $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [chikhaInRevenue.total_recette_technicien, chikhaSalem.id])
        
        console.log(`✅ Total généré mis à jour: ${chikhaInRevenue.total_recette_technicien}€`)
      }
      
    } else {
      console.log('❌ CHIKHA SALEM non trouvé dans cout_par_salaire pour mai 2025')
    }
    
    // 5. Vérification finale
    console.log('\n✅ Vérification finale...')
    const finalCheck = await pool.query(`
      SELECT total_genere, updated_at FROM cout_par_salaire 
      WHERE LOWER(nom) = LOWER('CHIKHA') AND LOWER(prenom) = LOWER('SALEM')
      AND mois = 5 AND annee = 2025
    `)
    
    if (finalCheck.rows.length > 0) {
      const row = finalCheck.rows[0]
      console.log(`✅ Valeur finale: ${row.total_genere}€ (mis à jour: ${row.updated_at})`)
    }
    
    console.log('\n🎯 Test terminé !')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
  } finally {
    await pool.end()
  }
}

testCoutParSalaireApi()
