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

async function testTotalGenereSync() {
  try {
    console.log('🧪 Test de la synchronisation du Total Généré...')
    
    // 1. Vérifier l'état actuel
    console.log('\n📊 1. État actuel des Total Généré...')
    const currentState = await pool.query(`
      SELECT 
        nom, prenom, mois, annee, total_genere,
        CASE 
          WHEN total_genere > 0 THEN '✅ Avec recettes'
          ELSE '❌ Sans recettes'
        END as statut
      FROM cout_par_salaire 
      WHERE nom IS NOT NULL AND prenom IS NOT NULL
      ORDER BY total_genere DESC
      LIMIT 10
    `)
    
    console.log(`📋 État actuel (top 10):`)
    currentState.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.nom} ${row.prenom} (${row.mois}/${row.annee}): ${row.total_genere}€ - ${row.statut}`)
    })
    
    // 2. Calculer les totaux réels pour quelques employés
    console.log('\n📊 2. Calcul des totaux réels...')
    const realTotals = await pool.query(`
      SELECT 
        cps.nom,
        cps.prenom,
        cps.mois,
        cps.annee,
        cps.total_genere as total_stocke,
        COALESCE(SUM(
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
        ), 0) as total_calcule,
        ABS(cps.total_genere - COALESCE(SUM(
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
        ), 0)) as difference
      FROM cout_par_salaire cps
      LEFT JOIN interventions i ON 
        LOWER(i.nom_technicien) = LOWER(cps.nom) AND 
        LOWER(i.prenom_technicien) = LOWER(cps.prenom) AND
        (
          (i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND 
           i.cloture_tech ~ '^[0-9]' AND 
           (i.cloture_tech::date >= DATE(cps.annee || '-' || LPAD(cps.mois::text, 2, '0') || '-01') AND 
            i.cloture_tech::date <= (DATE(cps.annee || '-' || LPAD(cps.mois::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))) OR
          (i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND 
           i.cloture_hotline ~ '^[0-9]' AND 
           (i.cloture_hotline::date >= DATE(cps.annee || '-' || LPAD(cps.mois::text, 2, '0') || '-01') AND 
            i.cloture_hotline::date <= (DATE(cps.annee || '-' || LPAD(cps.mois::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))) OR
          (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND 
           i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND 
           i.date_rdv ~ '^[0-9]' AND 
           (i.date_rdv::date >= DATE(cps.annee || '-' || LPAD(cps.mois::text, 2, '0') || '-01') AND 
            i.date_rdv::date <= (DATE(cps.annee || '-' || LPAD(cps.mois::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day')))
        )
      WHERE cps.nom IS NOT NULL AND cps.prenom IS NOT NULL
      GROUP BY cps.id, cps.nom, cps.prenom, cps.mois, cps.annee, cps.total_genere
      ORDER BY ABS(cps.total_genere - COALESCE(SUM(
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
      ), 0)) DESC
      LIMIT 10
    `)
    
    console.log(`📋 Comparaison stocké vs calculé (top 10):`)
    realTotals.rows.forEach((row, index) => {
      const status = Math.abs(row.difference) > 0.01 ? '⚠️ Incohérent' : '✅ Cohérent'
      console.log(`${index + 1}. ${row.nom} ${row.prenom} (${row.mois}/${row.annee}):`)
      console.log(`   - Stocké: ${row.total_stocke}€`)
      console.log(`   - Calculé: ${row.total_calcule}€`)
      console.log(`   - Différence: ${row.difference}€ - ${status}`)
    })
    
    // 3. Statistiques générales
    console.log('\n📊 3. Statistiques générales...')
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_employes,
        COUNT(CASE WHEN total_genere > 0 THEN 1 END) as avec_recettes,
        COUNT(CASE WHEN total_genere = 0 OR total_genere IS NULL THEN 1 END) as sans_recettes,
        AVG(total_genere) as moyenne_recettes
      FROM cout_par_salaire 
      WHERE nom IS NOT NULL AND prenom IS NOT NULL
    `)
    
    const stat = stats.rows[0]
    console.log(`📈 Statistiques:`)
    console.log(`   - Total employés: ${stat.total_employes}`)
    console.log(`   - Avec recettes: ${stat.avec_recettes}`)
    console.log(`   - Sans recettes: ${stat.sans_recettes}`)
    console.log(`   - Moyenne recettes: ${parseFloat(stat.moyenne_recettes || 0).toFixed(2)}€`)
    
    // 4. Vérifier les interventions disponibles
    console.log('\n📊 4. Vérification des interventions...')
    const interventions = await pool.query(`
      SELECT 
        COUNT(*) as total_interventions,
        COUNT(CASE WHEN statut = 'CLOTURE TERMINEE' THEN 1 END) as cloturees,
        COUNT(CASE WHEN articles IS NOT NULL AND articles != '' THEN 1 END) as avec_articles
      FROM interventions
    `)
    
    const interv = interventions.rows[0]
    console.log(`📈 Interventions:`)
    console.log(`   - Total: ${interv.total_interventions}`)
    console.log(`   - Clôturées: ${interv.cloturees}`)
    console.log(`   - Avec articles: ${interv.avec_articles}`)
    
    console.log('\n🎯 Test terminé !')
    console.log('💡 Si vous voyez des incohérences, utilisez le bouton "Synchroniser Total Généré" dans l\'interface')
    
  } catch (error) {
    console.error('❌ Erreur test:', error)
  } finally {
    await pool.end()
  }
}

// Exécuter le test
testTotalGenereSync().catch(console.error)

