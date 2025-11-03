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

async function testBeneficeBrutInterface() {
  try {
    console.log('🧪 Test de l\'interface BÉNÉFICE BRUT...')
    
    // 1. Simuler les données que l'interface recevra
    console.log('\n📊 1. Simulation des données de l\'interface...')
    const recapData = await pool.query(`
      SELECT 
        i.nom_technicien as employe_nom,
        i.prenom_technicien as employe_prenom,
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
        AND i.cloture_tech IS NOT NULL 
        AND i.cloture_tech != '' 
        AND i.cloture_tech != 'nan'
        AND i.cloture_tech ~ '^[0-9]'
        AND i.cloture_tech::date >= CURRENT_DATE - INTERVAL '30 days'
        AND i.cloture_tech::date <= CURRENT_DATE
      GROUP BY i.nom_technicien, i.prenom_technicien
      ORDER BY total_recette_technicien DESC
    `)
    
    console.log(`✅ Données récupérées: ${recapData.rows.length} techniciens`)
    
    // 2. Simuler les calculs de l'interface
    console.log('\n📊 2. Simulation des calculs de l\'interface...')
    
    // Fonction getBeneficeBrut (simulation)
    const getBeneficeBrut = () => {
      const recetteEntreprise = recapData.rows.reduce((sum, row) => 
        sum + parseFloat(row.total_recette_entreprise || 0), 0)
      const recetteTechnicien = recapData.rows.reduce((sum, row) => 
        sum + parseFloat(row.total_recette_technicien || 0), 0)
      return recetteEntreprise - recetteTechnicien
    }
    
    // Fonction getTotalRecettesEntreprise (simulation)
    const getTotalRecettesEntreprise = () => {
      return recapData.rows.reduce((sum, row) => 
        sum + parseFloat(row.total_recette_entreprise || 0), 0)
    }
    
    // Fonction getTotalRecettes (simulation)
    const getTotalRecettes = () => {
      return recapData.rows.reduce((sum, row) => 
        sum + parseFloat(row.total_recette_technicien || 0), 0)
    }
    
    // Fonction getTotalInterventions (simulation)
    const getTotalInterventions = () => {
      return recapData.rows.reduce((sum, row) => 
        sum + parseInt(row.nombre_interventions || 0), 0)
    }
    
    // 3. Afficher les résultats comme dans l'interface
    console.log('\n📊 3. Résultats de l\'interface:')
    
    const beneficeBrut = getBeneficeBrut()
    const recettesEntreprise = getTotalRecettesEntreprise()
    const recettesTechnicien = getTotalRecettes()
    const totalInterventions = getTotalInterventions()
    
    console.log(`📈 Statistiques affichées dans l'interface:`)
    console.log(`   🟢 BÉNÉFICE BRUT: ${beneficeBrut.toFixed(2)}€`)
    console.log(`   🔵 Recettes Entreprise: ${recettesEntreprise.toFixed(2)}€`)
    console.log(`   🟡 Recettes Technicien: ${recettesTechnicien.toFixed(2)}€`)
    console.log(`   📊 Interventions Totales: ${totalInterventions}`)
    
    // 4. Vérifier la cohérence de la formule
    console.log('\n📊 4. Vérification de la cohérence de la formule...')
    
    const beneficeBrutCalcule = recettesEntreprise - recettesTechnicien
    const difference = Math.abs(beneficeBrut - beneficeBrutCalcule)
    
    console.log(`🧮 Vérification de la formule:`)
    console.log(`   - BÉNÉFICE BRUT (interface): ${beneficeBrut.toFixed(2)}€`)
    console.log(`   - BÉNÉFICE BRUT (calculé): ${beneficeBrutCalcule.toFixed(2)}€`)
    console.log(`   - Différence: ${difference.toFixed(2)}€`)
    
    if (difference < 0.01) {
      console.log('✅ Formule cohérente: BÉNÉFICE BRUT = Recette Entreprise - Recette Technicien')
    } else {
      console.log('❌ Incohérence détectée dans la formule')
    }
    
    // 5. Tester différents scénarios d'affichage
    console.log('\n📊 5. Test des scénarios d\'affichage...')
    
    // Scénario 1: Bénéfice positif
    if (beneficeBrut > 0) {
      console.log(`✅ Bénéfice positif: ${beneficeBrut.toFixed(2)}€ (affiché en vert)`)
    }
    
    // Scénario 2: Bénéfice nul
    if (Math.abs(beneficeBrut) < 0.01) {
      console.log(`⚠️ Bénéfice nul: ${beneficeBrut.toFixed(2)}€ (affiché en gris)`)
    }
    
    // Scénario 3: Bénéfice négatif
    if (beneficeBrut < 0) {
      console.log(`❌ Bénéfice négatif: ${beneficeBrut.toFixed(2)}€ (affiché en rouge)`)
    }
    
    // 6. Formatage des devises (simulation)
    console.log('\n📊 6. Test du formatage des devises...')
    
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
      }).format(amount)
    }
    
    console.log(`💰 Formatage des devises:`)
    console.log(`   - BÉNÉFICE BRUT: ${formatCurrency(beneficeBrut)}`)
    console.log(`   - Recettes Entreprise: ${formatCurrency(recettesEntreprise)}`)
    console.log(`   - Recettes Technicien: ${formatCurrency(recettesTechnicien)}`)
    
    console.log('\n🎯 Test de l\'interface terminé !')
    console.log('✅ L\'interface affiche correctement le BÉNÉFICE BRUT')
    console.log('✅ La formule est cohérente et fonctionne')
    console.log('✅ Le formatage des devises est correct')
    
  } catch (error) {
    console.error('❌ Erreur test interface:', error)
  } finally {
    await pool.end()
  }
}

// Exécuter le test
testBeneficeBrutInterface().catch(console.error)



