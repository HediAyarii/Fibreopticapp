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

async function debugMissingIntervention() {
  try {
    console.log('🔍 Debug de l\'intervention manquante (ID: 1762)...')
    
    // 1. Analyser l'intervention manquante en détail
    console.log('\n📋 Détails de l\'intervention ID 1762:')
    const intervention = await pool.query(`
      SELECT 
        id, num_inter, date_rdv, cloture_tech, cloture_hotline, statut, articles, type_intervention,
        nom_technicien, prenom_technicien
      FROM interventions 
      WHERE id = 1762
    `)
    
    if (intervention.rows.length > 0) {
      const row = intervention.rows[0]
      console.log(`✅ Intervention trouvée:`)
      console.log(`   - ID: ${row.id}`)
      console.log(`   - Num: ${row.num_inter}`)
      console.log(`   - Date RDV: ${row.date_rdv}`)
      console.log(`   - Clôture Tech: ${row.cloture_tech}`)
      console.log(`   - Clôture Hotline: ${row.cloture_hotline}`)
      console.log(`   - Statut: ${row.statut}`)
      console.log(`   - Articles: ${row.articles}`)
      console.log(`   - Type: ${row.type_intervention}`)
      console.log(`   - Technicien: ${row.nom_technicien} ${row.prenom_technicien}`)
      
      // 2. Vérifier les conditions de l'API corrigée
      console.log('\n🔧 Test des conditions de l\'API corrigée:')
      
      const dateFrom = '2025-05-01'
      const dateTo = '2025-05-31'
      
      console.log(`📅 Période: ${dateFrom} à ${dateTo}`)
      
      // Condition 1: statut = 'CLOTURE TERMINEE'
      const condition1 = row.statut === 'CLOTURE TERMINEE'
      console.log(`✅ Condition 1 (statut): ${condition1} (${row.statut})`)
      
      // Condition 2: articles IS NOT NULL AND articles != ''
      const condition2 = row.articles && row.articles !== ''
      console.log(`✅ Condition 2 (articles): ${condition2} (${row.articles})`)
      
      // Condition 3: cloture_tech >= dateFrom OR cloture_hotline >= dateFrom
      const condition3a = row.cloture_tech && row.cloture_tech >= dateFrom
      const condition3b = row.cloture_hotline && row.cloture_hotline >= dateFrom
      const condition3 = condition3a || condition3b
      console.log(`✅ Condition 3a (cloture_tech >= ${dateFrom}): ${condition3a} (${row.cloture_tech})`)
      console.log(`✅ Condition 3b (cloture_hotline >= ${dateFrom}): ${condition3b} (${row.cloture_hotline})`)
      console.log(`✅ Condition 3 (cloture >= dateFrom): ${condition3}`)
      
      // Condition 4: cloture_tech IS NULL AND cloture_hotline IS NULL AND date_rdv >= dateFrom
      const condition4a = !row.cloture_tech || row.cloture_tech === 'nan' || row.cloture_tech === null
      const condition4b = !row.cloture_hotline || row.cloture_hotline === 'nan' || row.cloture_hotline === null
      const condition4c = row.date_rdv && row.date_rdv >= dateFrom
      const condition4 = condition4a && condition4b && condition4c
      console.log(`✅ Condition 4a (cloture_tech IS NULL): ${condition4a} (${row.cloture_tech})`)
      console.log(`✅ Condition 4b (cloture_hotline IS NULL): ${condition4b} (${row.cloture_hotline})`)
      console.log(`✅ Condition 4c (date_rdv >= ${dateFrom}): ${condition4c} (${row.date_rdv})`)
      console.log(`✅ Condition 4 (fallback date_rdv): ${condition4}`)
      
      // Condition 5: cloture_tech <= dateTo OR cloture_hotline <= dateTo
      const condition5a = row.cloture_tech && row.cloture_tech <= dateTo
      const condition5b = row.cloture_hotline && row.cloture_hotline <= dateTo
      const condition5 = condition5a || condition5b
      console.log(`✅ Condition 5a (cloture_tech <= ${dateTo}): ${condition5a} (${row.cloture_tech})`)
      console.log(`✅ Condition 5b (cloture_hotline <= ${dateTo}): ${condition5b} (${row.cloture_hotline})`)
      console.log(`✅ Condition 5 (cloture <= dateTo): ${condition5}`)
      
      // Condition 6: cloture_tech IS NULL AND cloture_hotline IS NULL AND date_rdv <= dateTo
      const condition6a = !row.cloture_tech || row.cloture_tech === 'nan' || row.cloture_tech === null
      const condition6b = !row.cloture_hotline || row.cloture_hotline === 'nan' || row.cloture_hotline === null
      const condition6c = row.date_rdv && row.date_rdv <= dateTo
      const condition6 = condition6a && condition6b && condition6c
      console.log(`✅ Condition 6a (cloture_tech IS NULL): ${condition6a} (${row.cloture_tech})`)
      console.log(`✅ Condition 6b (cloture_hotline IS NULL): ${condition6b} (${row.cloture_hotline})`)
      console.log(`✅ Condition 6c (date_rdv <= ${dateTo}): ${condition6c} (${row.date_rdv})`)
      console.log(`✅ Condition 6 (fallback date_rdv): ${condition6}`)
      
      // Résultat final
      const conditionStart = condition3 || condition4
      const conditionEnd = condition5 || condition6
      const conditionFinal = conditionStart && conditionEnd
      
      console.log(`\n🎯 Résultat final:`)
      console.log(`   - Condition début: ${conditionStart} (cloture OU fallback)`)
      console.log(`   - Condition fin: ${conditionEnd} (cloture OU fallback)`)
      console.log(`   - Condition finale: ${conditionFinal}`)
      
      if (!conditionFinal) {
        console.log('❌ L\'intervention ne passe pas les conditions de l\'API')
        
        // Analyser pourquoi
        if (!conditionStart) {
          console.log('❌ Problème avec la condition de début')
          if (!condition3 && !condition4) {
            console.log('   - Ni cloture ni fallback ne fonctionnent')
          }
        }
        if (!conditionEnd) {
          console.log('❌ Problème avec la condition de fin')
          if (!condition5 && !condition6) {
            console.log('   - Ni cloture ni fallback ne fonctionnent')
          }
        }
      } else {
        console.log('✅ L\'intervention devrait passer les conditions de l\'API')
      }
      
      // 3. Tester la requête exacte de l'API
      console.log('\n🧪 Test de la requête exacte de l\'API:')
      const apiTest = await pool.query(`
        SELECT 
          i.id, i.num_inter, i.date_rdv, i.cloture_tech, i.cloture_hotline, i.statut, i.articles,
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
          END as recette
        FROM interventions i
        WHERE i.id = 1762
          AND i.statut = 'CLOTURE TERMINEE'
          AND i.articles IS NOT NULL 
          AND i.articles != ''
          AND (
            (i.cloture_tech >= $1 OR i.cloture_hotline >= $1) OR
            (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND i.date_rdv >= $1)
          )
          AND (
            (i.cloture_tech <= $2 OR i.cloture_hotline <= $2) OR
            (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND i.date_rdv <= $2)
          )
      `, [dateFrom, dateTo])
      
      if (apiTest.rows.length > 0) {
        console.log(`✅ L'intervention passe le test de l'API: ${apiTest.rows[0].recette}€`)
      } else {
        console.log('❌ L\'intervention ne passe pas le test de l\'API')
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du debug:', error.message)
  } finally {
    await pool.end()
  }
}

debugMissingIntervention()
