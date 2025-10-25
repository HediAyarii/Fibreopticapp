const { query } = require('./lib/database')

async function testSimpleCarburant() {
  try {
    console.log('🧪 Test simple des données de carburant...')
    
    // 1. Vérifier les données de carburant sans filtrage de date
    console.log('\n📊 1. Toutes les données de carburant:')
    const allCarburantResult = await query(`
      SELECT 
        e.nom,
        e.prenom,
        e.matricule,
        COUNT(cc.id) as nb_transactions,
        SUM(CAST(REPLACE(cc.ca_ttc, ',', '.') AS DECIMAL(10,2))) as total_consommation
      FROM employes e
      INNER JOIN carburant_consommation cc ON e.id = cc.employe_assigné
      WHERE cc.ca_ttc IS NOT NULL 
        AND cc.ca_ttc != ''
        AND cc.ca_ttc != '0'
        AND cc.ca_ttc ~ '^[0-9]'
      GROUP BY e.nom, e.prenom, e.matricule
      ORDER BY total_consommation DESC
      LIMIT 10
    `)
    
    console.log(`Employés avec carburant: ${allCarburantResult.rows.length}`)
    allCarburantResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.nom} ${row.prenom} (${row.matricule})`)
      console.log(`     Transactions: ${row.nb_transactions}`)
      console.log(`     Total: ${row.total_consommation}€`)
    })
    
    // 2. Vérifier les données de carburant avec filtrage de date simple
    console.log('\n📅 2. Données de carburant avec filtrage de date:')
    const dateFilteredResult = await query(`
      SELECT 
        e.nom,
        e.prenom,
        e.matricule,
        COUNT(cc.id) as nb_transactions,
        SUM(CAST(REPLACE(cc.ca_ttc, ',', '.') AS DECIMAL(10,2))) as total_consommation,
        MIN(cc.date_livraison) as premiere_date,
        MAX(cc.date_livraison) as derniere_date
      FROM employes e
      INNER JOIN carburant_consommation cc ON e.id = cc.employe_assigné
      WHERE cc.ca_ttc IS NOT NULL 
        AND cc.ca_ttc != ''
        AND cc.ca_ttc != '0'
        AND cc.ca_ttc ~ '^[0-9]'
        AND cc.date_livraison IS NOT NULL 
        AND cc.date_livraison != ''
      GROUP BY e.nom, e.prenom, e.matricule
      ORDER BY total_consommation DESC
      LIMIT 10
    `)
    
    console.log(`Employés avec carburant (avec dates): ${dateFilteredResult.rows.length}`)
    dateFilteredResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.nom} ${row.prenom} (${row.matricule})`)
      console.log(`     Transactions: ${row.nb_transactions}`)
      console.log(`     Total: ${row.total_consommation}€`)
      console.log(`     Période: ${row.premiere_date} à ${row.derniere_date}`)
    })
    
    // 3. Vérifier les données de carburant avec conversion de date
    console.log('\n🔄 3. Données de carburant avec conversion de date:')
    const dateConvertedResult = await query(`
      SELECT 
        e.nom,
        e.prenom,
        e.matricule,
        COUNT(cc.id) as nb_transactions,
        SUM(CAST(REPLACE(cc.ca_ttc, ',', '.') AS DECIMAL(10,2))) as total_consommation
      FROM employes e
      INNER JOIN carburant_consommation cc ON e.id = cc.employe_assigné
      WHERE cc.ca_ttc IS NOT NULL 
        AND cc.ca_ttc != ''
        AND cc.ca_ttc != '0'
        AND cc.ca_ttc ~ '^[0-9]'
        AND cc.date_livraison IS NOT NULL 
        AND cc.date_livraison != ''
        AND cc.date_livraison ~ '^[0-9]'
        AND (
          -- Essayer différents formats de date
          (cc.date_livraison ~ '^[0-9]{2}\.[0-9]{2}\.[0-9]{4}$' AND 
           TO_DATE(cc.date_livraison, 'DD.MM.YYYY') >= '2024-05-01'::date AND 
           TO_DATE(cc.date_livraison, 'DD.MM.YYYY') <= '2024-05-31'::date) OR
          (cc.date_livraison ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND 
           cc.date_livraison::date >= '2024-05-01'::date AND 
           cc.date_livraison::date <= '2024-05-31'::date) OR
          (cc.date_livraison ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' AND 
           TO_DATE(cc.date_livraison, 'DD/MM/YYYY') >= '2024-05-01'::date AND 
           TO_DATE(cc.date_livraison, 'DD/MM/YYYY') <= '2024-05-31'::date)
        )
      GROUP BY e.nom, e.prenom, e.matricule
      ORDER BY total_consommation DESC
    `)
    
    console.log(`Employés avec carburant en mai 2024: ${dateConvertedResult.rows.length}`)
    dateConvertedResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.nom} ${row.prenom} (${row.matricule})`)
      console.log(`     Transactions: ${row.nb_transactions}`)
      console.log(`     Total: ${row.total_consommation}€`)
    })
    
    // 4. Vérifier les données de carburant sans conversion de date
    console.log('\n📅 4. Données de carburant sans conversion de date:')
    const noDateConversionResult = await query(`
      SELECT 
        e.nom,
        e.prenom,
        e.matricule,
        COUNT(cc.id) as nb_transactions,
        SUM(CAST(REPLACE(cc.ca_ttc, ',', '.') AS DECIMAL(10,2))) as total_consommation
      FROM employes e
      INNER JOIN carburant_consommation cc ON e.id = cc.employe_assigné
      WHERE cc.ca_ttc IS NOT NULL 
        AND cc.ca_ttc != ''
        AND cc.ca_ttc != '0'
        AND cc.ca_ttc ~ '^[0-9]'
        AND cc.date_livraison IS NOT NULL 
        AND cc.date_livraison != ''
        AND cc.date_livraison ~ '^[0-9]'
        AND cc.date_livraison LIKE '%05.2024%'
      GROUP BY e.nom, e.prenom, e.matricule
      ORDER BY total_consommation DESC
    `)
    
    console.log(`Employés avec carburant en mai 2024 (sans conversion): ${noDateConversionResult.rows.length}`)
    noDateConversionResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.nom} ${row.prenom} (${row.matricule})`)
      console.log(`     Transactions: ${row.nb_transactions}`)
      console.log(`     Total: ${row.total_consommation}€`)
    })
    
    // 5. Vérifier les données de carburant avec recherche de LOTFI
    console.log('\n🎯 5. Recherche spécifique de LOTFI:')
    const lotfiResult = await query(`
      SELECT 
        e.nom,
        e.prenom,
        e.matricule,
        COUNT(cc.id) as nb_transactions,
        SUM(CAST(REPLACE(cc.ca_ttc, ',', '.') AS DECIMAL(10,2))) as total_consommation
      FROM employes e
      INNER JOIN carburant_consommation cc ON e.id = cc.employe_assigné
      WHERE (LOWER(e.nom) LIKE '%lotfi%' OR LOWER(e.prenom) LIKE '%lotfi%')
        AND cc.ca_ttc IS NOT NULL 
        AND cc.ca_ttc != ''
        AND cc.ca_ttc != '0'
        AND cc.ca_ttc ~ '^[0-9]'
      GROUP BY e.nom, e.prenom, e.matricule
    `)
    
    console.log(`LOTFI trouvé: ${lotfiResult.rows.length}`)
    lotfiResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.nom} ${row.prenom} (${row.matricule})`)
      console.log(`     Transactions: ${row.nb_transactions}`)
      console.log(`     Total: ${row.total_consommation}€`)
    })
    
    console.log('\n✅ Test simple terminé!')
    
  } catch (error) {
    console.error('❌ Erreur lors du test simple:', error)
  }
}

// Exécuter le test si le script est appelé directement
if (require.main === module) {
  testSimpleCarburant()
}

module.exports = { testSimpleCarburant }
