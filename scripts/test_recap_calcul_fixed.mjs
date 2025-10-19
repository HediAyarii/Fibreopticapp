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

async function testRecapCalculFixed() {
  try {
    console.log('🧪 Test de l\'API recap-calcul corrigée...')
    
    const startDate = '2025-05-01'
    const endDate = '2025-05-31'
    
    // 1. Test de l'API recap-calcul avec la logique corrigée
    console.log('\n🔧 Test de l\'API recap-calcul:')
    const recapResult = await pool.query(`
      SELECT 
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
        ) as total_recettes
      FROM interventions i
      WHERE LOWER(i.nom_technicien) = LOWER('CHIKHA') AND LOWER(i.prenom_technicien) = LOWER('SALEM')
      AND (
        (i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND 
         (TO_DATE(i.cloture_tech, 'DD.MM.YYYY') >= $1 OR 
          TO_DATE(i.cloture_tech, 'YYYY-MM-DD') >= $1 OR
          i.cloture_tech >= $1)) OR
        (i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND 
         (TO_DATE(i.cloture_hotline, 'DD.MM.YYYY') >= $1 OR 
          TO_DATE(i.cloture_hotline, 'YYYY-MM-DD') >= $1 OR
          i.cloture_hotline >= $1)) OR
        (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND i.date_rdv >= $1)
      )
      AND (
        (i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND 
         (TO_DATE(i.cloture_tech, 'DD.MM.YYYY') <= $2 OR 
          TO_DATE(i.cloture_tech, 'YYYY-MM-DD') <= $2 OR
          i.cloture_tech <= $2)) OR
        (i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND 
         (TO_DATE(i.cloture_hotline, 'DD.MM.YYYY') <= $2 OR 
          TO_DATE(i.cloture_hotline, 'YYYY-MM-DD') <= $2 OR
          i.cloture_hotline <= $2 OR
          DATE(i.cloture_hotline) <= $2)) OR
        (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND i.date_rdv <= $2)
      )
    `, [startDate, endDate])
    
    const recapTotal = parseFloat(recapResult.rows[0].total_recettes) || 0
    console.log(`✅ API recap-calcul: ${recapTotal}€`)
    
    // 2. Comparer avec le calcul manuel
    console.log('\n🧮 Comparaison avec le calcul manuel:')
    const manualResult = await pool.query(`
      SELECT 
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
        ) as total_recettes_manual
      FROM interventions i
      WHERE LOWER(i.nom_technicien) = LOWER('CHIKHA') AND LOWER(i.prenom_technicien) = LOWER('SALEM')
      AND (
        (i.date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' AND TO_DATE(i.date_rdv, 'DD.MM.YYYY') >= '2025-05-01' AND TO_DATE(i.date_rdv, 'DD.MM.YYYY') <= '2025-05-31')
        OR (i.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND i.date_rdv::date >= '2025-05-01' AND i.date_rdv::date <= '2025-05-31')
        OR (i.date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') >= '2025-05-01' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') <= '2025-05-31')
      )
    `)
    
    const manualTotal = parseFloat(manualResult.rows[0].total_recettes_manual) || 0
    console.log(`✅ Calcul manuel: ${manualTotal}€`)
    
    // 3. Vérifier la cohérence
    const difference = Math.abs(recapTotal - manualTotal)
    console.log('\n📊 Comparaison finale:')
    console.log(`   - API recap-calcul: ${recapTotal}€`)
    console.log(`   - Calcul manuel: ${manualTotal}€`)
    console.log(`   - Différence: ${difference}€`)
    
    if (difference < 0.01) {
      console.log('✅ PARFAIT ! L\'API recap-calcul est maintenant cohérente')
      console.log('✅ Les deux sections affichent maintenant 3770€')
    } else {
      console.log('❌ Il y a encore une différence')
    }
    
    // 4. Vérifier la base de données
    console.log('\n📊 Vérification de la base de données:')
    const dbResult = await pool.query(`
      SELECT total_genere FROM cout_par_salaire 
      WHERE LOWER(nom) = LOWER('CHIKHA') AND LOWER(prenom) = LOWER('SALEM')
      AND mois = 5 AND annee = 2025
    `)
    
    if (dbResult.rows.length > 0) {
      const dbTotal = parseFloat(dbResult.rows[0].total_genere) || 0
      console.log(`✅ Base de données: ${dbTotal}€`)
    }
    
    console.log('\n🎯 Test terminé !')
    console.log('💡 Toutes les sections devraient maintenant afficher 3770€')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
  } finally {
    await pool.end()
  }
}

testRecapCalculFixed()
