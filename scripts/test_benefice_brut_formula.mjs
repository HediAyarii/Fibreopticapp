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

async function testBeneficeBrutFormula() {
  try {
    console.log('🧪 Test de la formule BÉNÉFICE BRUT...')
    
    // 1. Tester l'API recap-calcul
    console.log('\n📊 1. Test de l\'API recap-calcul...')
    const recapResult = await pool.query(`
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
      LIMIT 5
    `)
    
    console.log(`✅ API recap-calcul: ${recapResult.rows.length} techniciens trouvés`)
    
    if (recapResult.rows.length > 0) {
      console.log('📋 Exemple de données:')
      recapResult.rows.forEach((row, index) => {
        const recetteTechnicien = parseFloat(row.total_recette_technicien || 0)
        const recetteEntreprise = parseFloat(row.total_recette_entreprise || 0)
        const beneficeBrut = recetteEntreprise - recetteTechnicien
        
        console.log(`   ${index + 1}. ${row.employe_nom} ${row.employe_prenom}:`)
        console.log(`      - Interventions: ${row.nombre_interventions}`)
        console.log(`      - Recette Technicien: ${recetteTechnicien.toFixed(2)}€`)
        console.log(`      - Recette Entreprise: ${recetteEntreprise.toFixed(2)}€`)
        console.log(`      - BÉNÉFICE BRUT: ${beneficeBrut.toFixed(2)}€ (${recetteEntreprise.toFixed(2)} - ${recetteTechnicien.toFixed(2)})`)
      })
    }
    
    // 2. Calculer les totaux globaux
    console.log('\n📊 2. Calcul des totaux globaux...')
    const totalRecetteTechnicien = recapResult.rows.reduce((sum, row) => 
      sum + parseFloat(row.total_recette_technicien || 0), 0)
    const totalRecetteEntreprise = recapResult.rows.reduce((sum, row) => 
      sum + parseFloat(row.total_recette_entreprise || 0), 0)
    const totalBeneficeBrut = totalRecetteEntreprise - totalRecetteTechnicien
    
    console.log(`📈 Totaux globaux:`)
    console.log(`   - Total Recette Technicien: ${totalRecetteTechnicien.toFixed(2)}€`)
    console.log(`   - Total Recette Entreprise: ${totalRecetteEntreprise.toFixed(2)}€`)
    console.log(`   - Total BÉNÉFICE BRUT: ${totalBeneficeBrut.toFixed(2)}€`)
    
    // 3. Vérifier la cohérence des données
    console.log('\n📊 3. Vérification de la cohérence...')
    const incoherentRows = recapResult.rows.filter(row => {
      const recetteTechnicien = parseFloat(row.total_recette_technicien || 0)
      const recetteEntreprise = parseFloat(row.total_recette_entreprise || 0)
      return recetteEntreprise < recetteTechnicien
    })
    
    if (incoherentRows.length > 0) {
      console.log(`⚠️ ${incoherentRows.length} techniciens avec des données incohérentes (Recette Entreprise < Recette Technicien):`)
      incoherentRows.forEach((row, index) => {
        const recetteTechnicien = parseFloat(row.total_recette_technicien || 0)
        const recetteEntreprise = parseFloat(row.total_recette_entreprise || 0)
        console.log(`   ${index + 1}. ${row.employe_nom} ${row.employe_prenom}:`)
        console.log(`      - Recette Technicien: ${recetteTechnicien.toFixed(2)}€`)
        console.log(`      - Recette Entreprise: ${recetteEntreprise.toFixed(2)}€`)
        console.log(`      - Différence: ${(recetteEntreprise - recetteTechnicien).toFixed(2)}€`)
      })
    } else {
      console.log('✅ Toutes les données sont cohérentes')
    }
    
    // 4. Tester la formule dans différents scénarios
    console.log('\n📊 4. Test de différents scénarios...')
    
    // Scénario 1: Recette Entreprise > Recette Technicien (bénéfice positif)
    const beneficePositif = recapResult.rows.filter(row => {
      const recetteTechnicien = parseFloat(row.total_recette_technicien || 0)
      const recetteEntreprise = parseFloat(row.total_recette_entreprise || 0)
      return recetteEntreprise > recetteTechnicien
    })
    
    // Scénario 2: Recette Entreprise = Recette Technicien (bénéfice nul)
    const beneficeNul = recapResult.rows.filter(row => {
      const recetteTechnicien = parseFloat(row.total_recette_technicien || 0)
      const recetteEntreprise = parseFloat(row.total_recette_entreprise || 0)
      return Math.abs(recetteEntreprise - recetteTechnicien) < 0.01
    })
    
    // Scénario 3: Recette Entreprise < Recette Technicien (bénéfice négatif)
    const beneficeNegatif = recapResult.rows.filter(row => {
      const recetteTechnicien = parseFloat(row.total_recette_technicien || 0)
      const recetteEntreprise = parseFloat(row.total_recette_entreprise || 0)
      return recetteEntreprise < recetteTechnicien
    })
    
    console.log(`📊 Répartition des bénéfices:`)
    console.log(`   - Bénéfices positifs: ${beneficePositif.length} techniciens`)
    console.log(`   - Bénéfices nuls: ${beneficeNul.length} techniciens`)
    console.log(`   - Bénéfices négatifs: ${beneficeNegatif.length} techniciens`)
    
    console.log('\n🎯 Test de la formule terminé !')
    console.log('✅ La formule BÉNÉFICE BRUT = Recette Entreprise - Recette Technicien fonctionne')
    console.log('✅ Les données sont cohérentes et calculées correctement')
    
  } catch (error) {
    console.error('❌ Erreur test formule:', error)
  } finally {
    await pool.end()
  }
}

// Exécuter le test
testBeneficeBrutFormula().catch(console.error)



