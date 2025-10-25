const { query } = require('./lib/database')

async function testLotfiMaiCarburant() {
  try {
    console.log('🧪 Test spécifique pour LOTFI en mai...')
    
    // Test avec mai 2024
    const startDate = '2024-05-01'
    const endDate = '2024-05-31'
    
    console.log(`📅 Test pour la période: ${startDate} à ${endDate}`)
    
    // 1. Vérifier les données de carburant pour LOTFI
    console.log('\n🔍 1. Vérification des données carburant pour LOTFI:')
    const lotfiCarburantResult = await query(`
      SELECT 
        cc.id,
        cc.numero_carte,
        cc.date_livraison,
        cc.ca_ttc,
        cc.employe_assigné,
        e.nom,
        e.prenom,
        e.matricule
      FROM carburant_consommation cc
      LEFT JOIN employes e ON cc.employe_assigné = e.id
      WHERE LOWER(e.nom) LIKE '%lotfi%' 
        OR LOWER(e.prenom) LIKE '%lotfi%'
        OR LOWER(e.nom || ' ' || e.prenom) LIKE '%lotfi%'
      ORDER BY cc.date_livraison DESC
    `)
    
    console.log(`Nombre de transactions trouvées pour LOTFI: ${lotfiCarburantResult.rows.length}`)
    lotfiCarburantResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. Date: ${row.date_livraison}, Montant: ${row.ca_ttc}€, Employé: ${row.nom} ${row.prenom}`)
    })
    
    // 2. Vérifier tous les employés avec consommation en mai
    console.log('\n🔍 2. Tous les employés avec consommation en mai:')
    const maiCarburantResult = await query(`
      SELECT 
        e.nom,
        e.prenom,
        e.matricule,
        COUNT(cc.id) as nb_transactions,
        SUM(CAST(REPLACE(cc.ca_ttc, ',', '.') AS DECIMAL(10,2))) as total_consommation
      FROM employes e
      LEFT JOIN carburant_consommation cc ON e.id = cc.employe_assigné
      WHERE cc.date_livraison IS NOT NULL 
        AND cc.date_livraison != ''
        AND cc.ca_ttc IS NOT NULL 
        AND cc.ca_ttc != ''
        AND TO_DATE(cc.date_livraison, 'DD.MM.YYYY') >= $1::date 
        AND TO_DATE(cc.date_livraison, 'DD.MM.YYYY') <= $2::date
      GROUP BY e.nom, e.prenom, e.matricule
      ORDER BY total_consommation DESC
    `, [startDate, endDate])
    
    console.log(`Nombre d'employés avec consommation en mai: ${maiCarburantResult.rows.length}`)
    maiCarburantResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.nom} ${row.prenom} (${row.matricule})`)
      console.log(`   Transactions: ${row.nb_transactions}, Total: ${row.total_consommation}€`)
    })
    
    // 3. Test de la requête complète comme dans l'API
    console.log('\n🔍 3. Test de la requête complète de l\'API:')
    const apiTestResult = await query(`
      WITH interventions_data AS (
        SELECT 
          i.nom_technicien as employe_nom,
          i.prenom_technicien as employe_prenom,
          CONCAT('TECH_', UPPER(SUBSTRING(i.nom_technicien, 1, 3)), UPPER(SUBSTRING(i.prenom_technicien, 1, 2))) as matricule,
          COUNT(*) as nombre_interventions,
          SUM(
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
            END
          ) as total_recette_technicien,
          SUM(
            CASE 
              WHEN i.statut = 'CLOTURE TERMINEE' THEN
                COALESCE(
                  (SELECT SUM(
                    CASE 
                      WHEN cp.prix_base IS NOT NULL THEN cp.prix_base
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
            END
          ) as total_recette_entreprise
        FROM interventions i
        WHERE i.statut = 'CLOTURE TERMINEE'
          AND i.articles IS NOT NULL 
          AND i.articles != ''
          AND (
            (i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND 
             i.cloture_tech ~ '^[0-9]' AND 
             (i.cloture_tech::date >= $1::date AND i.cloture_tech::date <= $2::date)) OR
            (i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND 
             i.cloture_hotline ~ '^[0-9]' AND 
             (i.cloture_hotline::date >= $1::date AND i.cloture_hotline::date <= $2::date)) OR
            (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND 
             i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND 
             i.date_rdv ~ '^[0-9]' AND 
             (i.date_rdv::date >= $1::date AND i.date_rdv::date <= $2::date))
          )
        GROUP BY i.nom_technicien, i.prenom_technicien
      ),
      carburant_data AS (
        SELECT 
          e.nom as employe_nom,
          e.prenom as employe_prenom,
          CONCAT('TECH_', UPPER(SUBSTRING(e.nom, 1, 3)), UPPER(SUBSTRING(e.prenom, 1, 2))) as matricule,
          COUNT(cc.id) as nombre_transactions_carburant,
          SUM(COALESCE(CAST(REPLACE(cc.ca_ttc, ',', '.') AS DECIMAL(10,2)), 0)) as consommation_totale_carburant,
          AVG(COALESCE(CAST(REPLACE(cc.ca_ttc, ',', '.') AS DECIMAL(10,2)), 0)) as consommation_moyenne_carburant
        FROM employes e
        LEFT JOIN carburant_consommation cc ON e.id = cc.employe_assigné
        WHERE cc.date_livraison IS NOT NULL 
          AND cc.date_livraison != ''
          AND cc.ca_ttc IS NOT NULL 
          AND cc.ca_ttc != ''
          AND TO_DATE(cc.date_livraison, 'DD.MM.YYYY') >= $1::date 
          AND TO_DATE(cc.date_livraison, 'DD.MM.YYYY') <= $2::date
        GROUP BY e.nom, e.prenom
      )
      SELECT 
        COALESCE(id.employe_nom, cd.employe_nom) as employe_nom,
        COALESCE(id.employe_prenom, cd.employe_prenom) as employe_prenom,
        COALESCE(id.matricule, cd.matricule) as matricule,
        COALESCE(id.nombre_interventions, 0) as nombre_interventions,
        COALESCE(id.total_recette_technicien, 0) as total_recette_technicien,
        COALESCE(id.total_recette_entreprise, 0) as total_recette_entreprise,
        COALESCE(cd.nombre_transactions_carburant, 0) as nombre_transactions_carburant,
        COALESCE(cd.consommation_totale_carburant, 0) as consommation_totale_carburant,
        COALESCE(cd.consommation_moyenne_carburant, 0) as consommation_moyenne_carburant
      FROM interventions_data id
      FULL OUTER JOIN carburant_data cd ON id.employe_nom = cd.employe_nom AND id.employe_prenom = cd.employe_prenom
      ORDER BY COALESCE(id.total_recette_technicien, 0) DESC
    `, [startDate, endDate])
    
    console.log(`Nombre de résultats de l'API: ${apiTestResult.rows.length}`)
    apiTestResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.employe_nom} ${row.employe_prenom} (${row.matricule})`)
      console.log(`   Interventions: ${row.nombre_interventions}`)
      console.log(`   Recettes Technicien: ${Number(row.total_recette_technicien).toFixed(2)}€`)
      console.log(`   Recettes Entreprise: ${Number(row.total_recette_entreprise).toFixed(2)}€`)
      console.log(`   Transactions Carburant: ${row.nombre_transactions_carburant}`)
      console.log(`   Consommation Carburant: ${Number(row.consommation_totale_carburant).toFixed(2)}€`)
    })
    
    console.log('\n✅ Test terminé!')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test si le script est appelé directement
if (require.main === module) {
  testLotfiMaiCarburant()
}

module.exports = { testLotfiMaiCarburant }
