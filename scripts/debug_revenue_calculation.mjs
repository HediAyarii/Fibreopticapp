import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function debugRevenueCalculation() {
  console.log('🔍 Debug du calcul des revenus pour BECHIRMOULAHI MOHAMED...')
  
  try {
    // 1. Vérifier les interventions pour cet employé
    console.log('\n📋 1. Recherche des interventions...')
    const interventions = await pool.query(`
      SELECT 
        id, num_inter, client, date_rdv, prenom_technicien, nom_technicien,
        articles, statut, type_intervention, cloture_tech, cloture_hotline
      FROM interventions 
      WHERE (
        LOWER(TRIM(nom_technicien)) = LOWER(TRIM('BECHIRMOULAHI')) 
        AND LOWER(TRIM(prenom_technicien)) = LOWER(TRIM('MOHAMED'))
      )
      AND statut = 'CLOTURE TERMINEE'
      ORDER BY date_rdv DESC
      LIMIT 5
    `)
    
    console.log(`✅ ${interventions.rows.length} interventions trouvées`)
    
    if (interventions.rows.length > 0) {
      console.log('\n📊 Détails des interventions:')
      interventions.rows.forEach((inter, index) => {
        console.log(`  ${index + 1}. ${inter.num_inter} - ${inter.client}`)
        console.log(`     Date: ${inter.date_rdv}`)
        console.log(`     Technicien: ${inter.prenom_technicien} ${inter.nom_technicien}`)
        console.log(`     Articles: ${inter.articles}`)
        console.log(`     Statut: ${inter.statut}`)
        console.log(`     Type: ${inter.type_intervention}`)
      })
    } else {
      console.log('❌ Aucune intervention trouvée')
      
      // Chercher avec des variations de nom
      console.log('\n🔍 Recherche avec variations de nom...')
      const variations = await pool.query(`
        SELECT DISTINCT nom_technicien, prenom_technicien, COUNT(*) as count
        FROM interventions 
        WHERE (
          LOWER(nom_technicien) LIKE '%bechir%' 
          OR LOWER(nom_technicien) LIKE '%moulahi%'
          OR LOWER(prenom_technicien) LIKE '%mohamed%'
        )
        AND statut = 'CLOTURE TERMINEE'
        GROUP BY nom_technicien, prenom_technicien
        ORDER BY count DESC
      `)
      
      console.log(`📊 Variations trouvées: ${variations.rows.length}`)
      variations.rows.forEach((var_, index) => {
        console.log(`  ${index + 1}. ${var_.prenom_technicien} ${var_.nom_technicien} (${var_.count} interventions)`)
      })
    }
    
    // 2. Vérifier les employés correspondants
    console.log('\n📋 2. Vérification des employés...')
    const employes = await pool.query(`
      SELECT id, nom, prenom, matricule, statut
      FROM employes 
      WHERE (
        LOWER(TRIM(nom)) = LOWER(TRIM('BECHIRMOULAHI')) 
        AND LOWER(TRIM(prenom)) = LOWER(TRIM('MOHAMED'))
      )
      AND statut = 'actif'
    `)
    
    console.log(`✅ ${employes.rows.length} employé(s) trouvé(s)`)
    employes.rows.forEach((emp, index) => {
      console.log(`  ${index + 1}. ${emp.nom} ${emp.prenom} (${emp.matricule}) - ${emp.statut}`)
    })
    
    // 3. Tester la correspondance avec l'API revenue-calculation
    console.log('\n📋 3. Test de l\'API revenue-calculation...')
    
    // Simuler la requête de l'API
    const dateFrom = '2020-01-01'
    const dateTo = '2030-12-31'
    
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
          -- Utiliser les vrais employés de la table employes
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
          LOWER(TRIM(e.prenom)) = LOWER(TRIM(i.prenom_technicien)) AND 
          LOWER(TRIM(e.nom)) = LOWER(TRIM(i.nom_technicien))
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
      WHERE employe_nom = 'BECHIRMOULAHI' AND employe_prenom = 'MOHAMED'
      GROUP BY employe_id, employe_nom, employe_prenom, matricule
    `
    
    const revenueResult = await pool.query(revenueQuery, [dateFrom, dateTo])
    
    console.log(`📊 Résultat API revenue-calculation: ${revenueResult.rows.length} employé(s)`)
    revenueResult.rows.forEach((emp, index) => {
      console.log(`  ${index + 1}. ${emp.employe_nom} ${emp.employe_prenom}`)
      console.log(`     - Matricule: ${emp.matricule}`)
      console.log(`     - Interventions: ${emp.nombre_interventions}`)
      console.log(`     - Recette: ${emp.total_recette_technicien}€`)
    })
    
    // 4. Vérifier les données company_pricing
    console.log('\n📋 4. Vérification des tarifs...')
    const pricingCount = await pool.query(`
      SELECT COUNT(*) as total FROM company_pricing
    `)
    console.log(`✅ ${pricingCount.rows[0].total} tarifs dans company_pricing`)
    
    // 5. Diagnostic final
    console.log('\n🔍 Diagnostic final:')
    if (interventions.rows.length === 0) {
      console.log('❌ Problème: Aucune intervention trouvée pour cet employé')
      console.log('💡 Solution: Vérifier les noms dans les interventions')
    } else if (revenueResult.rows.length === 0) {
      console.log('❌ Problème: L\'API revenue-calculation ne trouve pas l\'employé')
      console.log('💡 Solution: Problème de correspondance entre interventions et employés')
    } else {
      console.log('✅ Les données sont correctes, le problème est ailleurs')
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du debug:', error.message)
  } finally {
    await pool.end()
  }
}

debugRevenueCalculation()








