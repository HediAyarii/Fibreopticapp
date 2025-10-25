const { query } = require('./lib/database')

async function testApiMaterielFix() {
  try {
    console.log('🧪 Test de l\'API Récap Calcul avec matériel...')
    
    // Test avec mai 2025
    const startDate = '2025-05-01'
    const endDate = '2025-05-31'
    
    console.log(`📅 Test pour la période: ${startDate} à ${endDate}`)
    
    // Test de la requête complète de l'API
    const result = await query(`
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
    
    console.log('📊 Résultats de l\'API:')
    console.log(`Nombre de techniciens trouvés: ${result.rows.length}`)
    
    // Rechercher spécifiquement HAMDI BEN CHEDLI
    const hamdiData = result.rows.find(row => 
      row.employe_nom && row.employe_prenom && 
      (row.employe_nom.toLowerCase().includes('hamdi') && 
       row.employe_prenom.toLowerCase().includes('chedli'))
    )
    
    if (hamdiData) {
      console.log('\n🎯 Données trouvées pour HAMDI BEN CHEDLI:')
      console.log(`Nom: ${hamdiData.employe_nom} ${hamdiData.employe_prenom}`)
      console.log(`Matricule: ${hamdiData.matricule}`)
      console.log(`Interventions: ${hamdiData.nombre_interventions}`)
      console.log(`Recettes Technicien: ${Number(hamdiData.total_recette_technicien).toFixed(2)}€`)
      console.log(`Recettes Entreprise: ${Number(hamdiData.total_recette_entreprise).toFixed(2)}€`)
      console.log(`Transactions Carburant: ${hamdiData.nombre_transactions_carburant}`)
      console.log(`Consommation Carburant: ${Number(hamdiData.consommation_totale_carburant).toFixed(2)}€`)
      console.log(`Affectations Matériel: ${hamdiData.nombre_affectations_materiel}`)
      console.log(`Quantité Matériel: ${hamdiData.quantite_totale_materiel}`)
      console.log(`Valeur Matériel: ${Number(hamdiData.valeur_totale_materiel).toFixed(2)}€`)
      console.log(`Prix Moyen Matériel: ${Number(hamdiData.prix_moyen_materiel).toFixed(2)}€`)
      
      // Test de conversion JavaScript
      console.log('\n🔧 Test de conversion JavaScript:')
      const valeurMateriel = Number(hamdiData.valeur_totale_materiel)
      console.log(`Valeur brute: ${hamdiData.valeur_totale_materiel}`)
      console.log(`Type: ${typeof hamdiData.valeur_totale_materiel}`)
      console.log(`Conversion: ${valeurMateriel}`)
      console.log(`Is NaN: ${isNaN(valeurMateriel)}`)
      console.log(`Is Number: ${!isNaN(valeurMateriel)}`)
    } else {
      console.log('\n❌ HAMDI BEN CHEDLI non trouvé dans les résultats')
    }
    
    // Afficher tous les résultats
    console.log('\n📋 Tous les résultats:')
    result.rows.forEach((row, index) => {
      const beneficeNet = (row.total_recette_entreprise || 0) - (row.total_recette_technicien || 0)
      const ratioCarburantRecettes = row.total_recette_entreprise > 0 ? 
        (row.consommation_totale_carburant / row.total_recette_entreprise) * 100 : 0
      
      console.log(`\n${index + 1}. ${row.employe_nom} ${row.employe_prenom} (${row.matricule})`)
      console.log(`   Interventions: ${row.nombre_interventions}`)
      console.log(`   Recettes Technicien: ${Number(row.total_recette_technicien).toFixed(2)}€`)
      console.log(`   Recettes Entreprise: ${Number(row.total_recette_entreprise).toFixed(2)}€`)
      console.log(`   Bénéfice Net: ${beneficeNet.toFixed(2)}€`)
      console.log(`   Transactions Carburant: ${row.nombre_transactions_carburant}`)
      console.log(`   Consommation Carburant: ${Number(row.consommation_totale_carburant).toFixed(2)}€`)
      console.log(`   Affectations Matériel: ${row.nombre_affectations_materiel}`)
      console.log(`   Quantité Matériel: ${row.quantite_totale_materiel}`)
      console.log(`   Valeur Matériel: ${Number(row.valeur_totale_materiel).toFixed(2)}€`)
      console.log(`   Prix Moyen Matériel: ${Number(row.prix_moyen_materiel).toFixed(2)}€`)
    })
    
    console.log('\n✅ Test de l\'API terminé avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur lors du test de l\'API:', error)
  }
}

// Exécuter le test si le script est appelé directement
if (require.main === module) {
  testApiMaterielFix()
}

module.exports = { testApiMaterielFix }
