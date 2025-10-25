const { query } = require('./lib/database')

async function testMaterielIntegration() {
  try {
    console.log('🧪 Test de l\'intégration du matériel dans Récap Calcul...')
    
    // Test avec mai 2025
    const startDate = '2025-05-01'
    const endDate = '2025-05-31'
    
    console.log(`📅 Test pour la période: ${startDate} à ${endDate}`)
    
    // 1. Vérifier les données de matériel existantes
    console.log('\n📊 1. Vérification des données de matériel:')
    const materielResult = await query(`
      SELECT 
        m.id,
        m.nom_equipement,
        m.type_materiel,
        m.prix_unitaire,
        m.quantite
      FROM materiel m
      WHERE m.prix_unitaire IS NOT NULL 
        AND m.prix_unitaire > 0
      ORDER BY m.prix_unitaire DESC
      LIMIT 10
    `)
    
    console.log(`Équipements trouvés: ${materielResult.rows.length}`)
    materielResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.nom_equipement} (${row.type_materiel}) - ${row.prix_unitaire}€`)
    })
    
    // 2. Vérifier les affectations de matériel
    console.log('\n📋 2. Vérification des affectations de matériel:')
    const affectationsResult = await query(`
      SELECT 
        am.id,
        am.employe_id,
        am.materiel_id,
        am.quantite_assignee,
        am.date_affectation,
        am.statut,
        e.nom,
        e.prenom,
        m.nom_equipement,
        m.prix_unitaire
      FROM affectations_materiel am
      INNER JOIN employes e ON am.employe_id = e.id
      INNER JOIN materiel m ON am.materiel_id = m.id
      WHERE am.statut = 'active'
        AND am.date_affectation >= $1::date 
        AND am.date_affectation <= $2::date
      ORDER BY am.date_affectation DESC
      LIMIT 10
    `, [startDate, endDate])
    
    console.log(`Affectations trouvées: ${affectationsResult.rows.length}`)
    affectationsResult.rows.forEach((row, index) => {
      const valeur = row.quantite_assignee * row.prix_unitaire
      console.log(`  ${index + 1}. ${row.nom} ${row.prenom} - ${row.nom_equipement} (${row.quantite_assignee}x) = ${valeur}€`)
    })
    
    // 3. Test de la requête de matériel pour l'API
    console.log('\n🔧 3. Test de la requête de matériel pour l\'API:')
    const materielDataResult = await query(`
      WITH materiel_data AS (
        SELECT 
          e.nom as employe_nom,
          e.prenom as employe_prenom,
          CONCAT('TECH_', UPPER(SUBSTRING(e.nom, 1, 3)), UPPER(SUBSTRING(e.prenom, 1, 2))) as matricule,
          COUNT(am.id) as nombre_affectations_materiel,
          SUM(am.quantite_assignee) as quantite_totale_materiel,
          SUM(COALESCE(m.prix_unitaire, 0) * am.quantite_assignee) as valeur_totale_materiel,
          AVG(COALESCE(m.prix_unitaire, 0)) as prix_moyen_materiel
        FROM employes e
        INNER JOIN affectations_materiel am ON e.id = am.employe_id
        INNER JOIN materiel m ON am.materiel_id = m.id
        WHERE am.statut = 'active'
          AND am.date_affectation >= $1::date 
          AND am.date_affectation <= $2::date
        GROUP BY e.nom, e.prenom
      )
      SELECT * FROM materiel_data
      ORDER BY valeur_totale_materiel DESC
    `, [startDate, endDate])
    
    console.log(`Résultats de l'API matériel: ${materielDataResult.rows.length}`)
    materielDataResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.employe_nom} ${row.employe_prenom}`)
      console.log(`     Affectations: ${row.nombre_affectations_materiel}`)
      console.log(`     Quantité: ${row.quantite_totale_materiel}`)
      console.log(`     Valeur: ${row.valeur_totale_materiel}€`)
      console.log(`     Prix moyen: ${row.prix_moyen_materiel}€`)
    })
    
    // 4. Rechercher spécifiquement HAMDI BEN CHEDLI
    console.log('\n🎯 4. Recherche de HAMDI BEN CHEDLI:')
    const hamdiResult = await query(`
      SELECT 
        e.nom,
        e.prenom,
        e.matricule,
        COUNT(am.id) as nombre_affectations,
        SUM(am.quantite_assignee) as quantite_totale,
        SUM(COALESCE(m.prix_unitaire, 0) * am.quantite_assignee) as valeur_totale
      FROM employes e
      INNER JOIN affectations_materiel am ON e.id = am.employe_id
      INNER JOIN materiel m ON am.materiel_id = m.id
      WHERE (LOWER(e.nom) LIKE '%hamdi%' AND LOWER(e.prenom) LIKE '%chedli%')
        AND am.statut = 'active'
        AND am.date_affectation >= $1::date 
        AND am.date_affectation <= $2::date
      GROUP BY e.nom, e.prenom, e.matricule
    `, [startDate, endDate])
    
    console.log(`HAMDI BEN CHEDLI trouvé: ${hamdiResult.rows.length}`)
    hamdiResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.nom} ${row.prenom} (${row.matricule})`)
      console.log(`     Affectations: ${row.nombre_affectations}`)
      console.log(`     Quantité: ${row.quantite_totale}`)
      console.log(`     Valeur totale: ${row.valeur_totale}€`)
    })
    
    // 5. Test de la requête complète de l'API Récap Calcul
    console.log('\n🧪 5. Test de la requête complète de l\'API Récap Calcul:')
    const fullResult = await query(`
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
        INNER JOIN carburant_assignations ca ON e.id = ca.employe_id
        INNER JOIN carburant_consommation cc ON ca.carte_id = cc.numero_carte
        WHERE cc.ca_ttc IS NOT NULL 
          AND cc.ca_ttc != ''
          AND cc.ca_ttc != '0'
          AND cc.ca_ttc ~ '^[0-9]'
          AND (
            cc.date_livraison LIKE '%05.2025%' OR cc.date_livraison LIKE '%05/2025%' OR cc.date_livraison LIKE '%2025-05%'
          )
        GROUP BY e.nom, e.prenom
      ),
      materiel_data AS (
        SELECT 
          e.nom as employe_nom,
          e.prenom as employe_prenom,
          CONCAT('TECH_', UPPER(SUBSTRING(e.nom, 1, 3)), UPPER(SUBSTRING(e.prenom, 1, 2))) as matricule,
          COUNT(am.id) as nombre_affectations_materiel,
          SUM(am.quantite_assignee) as quantite_totale_materiel,
          SUM(COALESCE(m.prix_unitaire, 0) * am.quantite_assignee) as valeur_totale_materiel,
          AVG(COALESCE(m.prix_unitaire, 0)) as prix_moyen_materiel
        FROM employes e
        INNER JOIN affectations_materiel am ON e.id = am.employe_id
        INNER JOIN materiel m ON am.materiel_id = m.id
        WHERE am.statut = 'active'
          AND am.date_affectation >= $1::date 
          AND am.date_affectation <= $2::date
        GROUP BY e.nom, e.prenom
      )
      SELECT 
        COALESCE(id.employe_nom, cd.employe_nom, md.employe_nom) as employe_nom,
        COALESCE(id.employe_prenom, cd.employe_prenom, md.employe_prenom) as employe_prenom,
        COALESCE(id.matricule, cd.matricule, md.matricule) as matricule,
        COALESCE(id.nombre_interventions, 0) as nombre_interventions,
        COALESCE(id.total_recette_technicien, 0) as total_recette_technicien,
        COALESCE(id.total_recette_entreprise, 0) as total_recette_entreprise,
        COALESCE(cd.nombre_transactions_carburant, 0) as nombre_transactions_carburant,
        COALESCE(cd.consommation_totale_carburant, 0) as consommation_totale_carburant,
        COALESCE(cd.consommation_moyenne_carburant, 0) as consommation_moyenne_carburant,
        COALESCE(md.nombre_affectations_materiel, 0) as nombre_affectations_materiel,
        COALESCE(md.quantite_totale_materiel, 0) as quantite_totale_materiel,
        COALESCE(md.valeur_totale_materiel, 0) as valeur_totale_materiel,
        COALESCE(md.prix_moyen_materiel, 0) as prix_moyen_materiel
      FROM interventions_data id
      FULL OUTER JOIN carburant_data cd ON id.employe_nom = cd.employe_nom AND id.employe_prenom = cd.employe_prenom
      FULL OUTER JOIN materiel_data md ON COALESCE(id.employe_nom, cd.employe_nom) = md.employe_nom AND COALESCE(id.employe_prenom, cd.employe_prenom) = md.employe_prenom
      ORDER BY COALESCE(id.total_recette_technicien, 0) DESC
    `, [startDate, endDate])
    
    console.log(`Résultats complets: ${fullResult.rows.length}`)
    fullResult.rows.forEach((row, index) => {
      console.log(`\n${index + 1}. ${row.employe_nom} ${row.employe_prenom} (${row.matricule})`)
      console.log(`   Interventions: ${row.nombre_interventions}`)
      console.log(`   Recettes Technicien: ${Number(row.total_recette_technicien).toFixed(2)}€`)
      console.log(`   Recettes Entreprise: ${Number(row.total_recette_entreprise).toFixed(2)}€`)
      console.log(`   Transactions Carburant: ${row.nombre_transactions_carburant}`)
      console.log(`   Consommation Carburant: ${Number(row.consommation_totale_carburant).toFixed(2)}€`)
      console.log(`   Affectations Matériel: ${row.nombre_affectations_materiel}`)
      console.log(`   Quantité Matériel: ${row.quantite_totale_materiel}`)
      console.log(`   Valeur Matériel: ${Number(row.valeur_totale_materiel).toFixed(2)}€`)
    })
    
    console.log('\n✅ Test d\'intégration du matériel terminé avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur lors du test d\'intégration du matériel:', error)
  }
}

// Exécuter le test si le script est appelé directement
if (require.main === module) {
  testMaterielIntegration()
}

module.exports = { testMaterielIntegration }
