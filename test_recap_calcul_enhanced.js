const { query } = require('./lib/database')

async function testRecapCalculEnhanced() {
  try {
    console.log('🧪 Test de l\'API Récap Calcul améliorée...')
    
    // Test avec des dates récentes
    const startDate = '2024-12-01'
    const endDate = '2024-12-31'
    
    console.log(`📅 Test pour la période: ${startDate} à ${endDate}`)
    
    const result = await query(`
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
      ORDER BY total_recette_technicien DESC
      LIMIT 5
    `, [startDate, endDate])
    
    console.log('📊 Résultats du test:')
    console.log(`Nombre de techniciens trouvés: ${result.rows.length}`)
    
    result.rows.forEach((row, index) => {
      const beneficeNet = (row.total_recette_entreprise || 0) - (row.total_recette_technicien || 0)
      console.log(`\n${index + 1}. ${row.employe_nom} ${row.employe_prenom} (${row.matricule})`)
      console.log(`   Interventions: ${row.nombre_interventions}`)
      console.log(`   Recettes Technicien: ${Number(row.total_recette_technicien).toFixed(2)}€`)
      console.log(`   Recettes Entreprise: ${Number(row.total_recette_entreprise).toFixed(2)}€`)
      console.log(`   Bénéfice Net: ${beneficeNet.toFixed(2)}€`)
    })
    
    // Calculer les totaux
    const totalRecettesTechnicien = result.rows.reduce((sum, row) => sum + (Number(row.total_recette_technicien) || 0), 0)
    const totalRecettesEntreprise = result.rows.reduce((sum, row) => sum + (Number(row.total_recette_entreprise) || 0), 0)
    const totalBeneficeNet = totalRecettesEntreprise - totalRecettesTechnicien
    
    console.log('\n📈 Totaux:')
    console.log(`Total Recettes Technicien: ${totalRecettesTechnicien.toFixed(2)}€`)
    console.log(`Total Recettes Entreprise: ${totalRecettesEntreprise.toFixed(2)}€`)
    console.log(`Total Bénéfice Net: ${totalBeneficeNet.toFixed(2)}€`)
    
    console.log('\n✅ Test terminé avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test si le script est appelé directement
if (require.main === module) {
  testRecapCalculEnhanced()
}

module.exports = { testRecapCalculEnhanced }
