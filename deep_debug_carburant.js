const { query } = require('./lib/database')

async function deepDebugCarburant() {
  try {
    console.log('🔍 Diagnostic approfondi du problème de carburant...')
    
    // 1. Vérifier la structure exacte de la table
    console.log('\n📋 1. Structure détaillée de carburant_consommation:')
    const structureResult = await query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'carburant_consommation'
      ORDER BY ordinal_position
    `)
    
    structureResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'}) - Default: ${row.column_default || 'NULL'}`)
    })
    
    // 2. Vérifier les données brutes
    console.log('\n📊 2. Échantillon de données brutes:')
    const rawDataResult = await query(`
      SELECT 
        id,
        numero_carte,
        employe_assigné,
        date_livraison,
        ca_ttc,
        created_at
      FROM carburant_consommation 
      WHERE ca_ttc IS NOT NULL 
        AND ca_ttc != ''
        AND ca_ttc != '0'
      ORDER BY created_at DESC
      LIMIT 10
    `)
    
    console.log(`Échantillon de ${rawDataResult.rows.length} enregistrements:`)
    rawDataResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ID: ${row.id}, Carte: ${row.numero_carte}`)
      console.log(`     Employé assigné: ${row.employe_assigné}`)
      console.log(`     Date: ${row.date_livraison}, Montant: ${row.ca_ttc}`)
    })
    
    // 3. Vérifier les employés avec des données de carburant
    console.log('\n👥 3. Employés avec données de carburant:')
    const employesCarburantResult = await query(`
      SELECT 
        e.id,
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
      GROUP BY e.id, e.nom, e.prenom, e.matricule
      ORDER BY total_consommation DESC
      LIMIT 10
    `)
    
    console.log(`Employés avec carburant: ${employesCarburantResult.rows.length}`)
    employesCarburantResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.nom} ${row.prenom} (${row.matricule})`)
      console.log(`     Transactions: ${row.nb_transactions}`)
      console.log(`     Total: ${row.total_consommation}€`)
      console.log(`     Période: ${row.premiere_date} à ${row.derniere_date}`)
    })
    
    // 4. Vérifier spécifiquement LOTFI
    console.log('\n🎯 4. Recherche spécifique de LOTFI:')
    const lotfiSearchResult = await query(`
      SELECT 
        e.id,
        e.nom,
        e.prenom,
        e.matricule,
        COUNT(cc.id) as nb_transactions,
        SUM(CAST(REPLACE(cc.ca_ttc, ',', '.') AS DECIMAL(10,2))) as total_consommation
      FROM employes e
      LEFT JOIN carburant_consommation cc ON e.id = cc.employe_assigné
      WHERE (LOWER(e.nom) LIKE '%lotfi%' OR LOWER(e.prenom) LIKE '%lotfi%')
        AND cc.ca_ttc IS NOT NULL 
        AND cc.ca_ttc != ''
        AND cc.ca_ttc != '0'
      GROUP BY e.id, e.nom, e.prenom, e.matricule
    `)
    
    console.log(`LOTFI trouvé: ${lotfiSearchResult.rows.length}`)
    lotfiSearchResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.nom} ${row.prenom} (${row.matricule})`)
      console.log(`     Transactions: ${row.nb_transactions}`)
      console.log(`     Total: ${row.total_consommation}€`)
    })
    
    // 5. Vérifier les données de mai 2024
    console.log('\n📅 5. Données de mai 2024:')
    const maiResult = await query(`
      SELECT 
        e.nom,
        e.prenom,
        e.matricule,
        COUNT(cc.id) as nb_transactions,
        SUM(CAST(REPLACE(cc.ca_ttc, ',', '.') AS DECIMAL(10,2))) as total_consommation
      FROM employes e
      INNER JOIN carburant_consommation cc ON e.id = cc.employe_assigné
      WHERE cc.date_livraison IS NOT NULL 
        AND cc.date_livraison != ''
        AND cc.ca_ttc IS NOT NULL 
        AND cc.ca_ttc != ''
        AND cc.ca_ttc != '0'
        AND TO_DATE(cc.date_livraison, 'DD.MM.YYYY') >= '2024-05-01'::date 
        AND TO_DATE(cc.date_livraison, 'DD.MM.YYYY') <= '2024-05-31'::date
      GROUP BY e.nom, e.prenom, e.matricule
      ORDER BY total_consommation DESC
    `)
    
    console.log(`Employés avec carburant en mai: ${maiResult.rows.length}`)
    maiResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.nom} ${row.prenom} (${row.matricule})`)
      console.log(`     Transactions: ${row.nb_transactions}`)
      console.log(`     Total: ${row.total_consommation}€`)
    })
    
    // 6. Test de la requête de l'API avec debug
    console.log('\n🔧 6. Test de la requête de l\'API avec debug:')
    const apiDebugResult = await query(`
      WITH carburant_data AS (
        SELECT 
          e.nom as employe_nom,
          e.prenom as employe_prenom,
          CONCAT('TECH_', UPPER(SUBSTRING(e.nom, 1, 3)), UPPER(SUBSTRING(e.prenom, 1, 2))) as matricule,
          COUNT(cc.id) as nombre_transactions_carburant,
          SUM(COALESCE(CAST(REPLACE(cc.ca_ttc, ',', '.') AS DECIMAL(10,2)), 0)) as consommation_totale_carburant,
          AVG(COALESCE(CAST(REPLACE(cc.ca_ttc, ',', '.') AS DECIMAL(10,2)), 0)) as consommation_moyenne_carburant
        FROM employes e
        INNER JOIN carburant_consommation cc ON e.id = cc.employe_assigné
        WHERE cc.date_livraison IS NOT NULL 
          AND cc.date_livraison != ''
          AND cc.ca_ttc IS NOT NULL 
          AND cc.ca_ttc != ''
          AND cc.ca_ttc != '0'
          AND TO_DATE(cc.date_livraison, 'DD.MM.YYYY') >= '2024-05-01'::date 
          AND TO_DATE(cc.date_livraison, 'DD.MM.YYYY') <= '2024-05-31'::date
        GROUP BY e.nom, e.prenom
      )
      SELECT * FROM carburant_data
    `)
    
    console.log(`Résultats de l'API: ${apiDebugResult.rows.length}`)
    apiDebugResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.employe_nom} ${row.employe_prenom}`)
      console.log(`     Transactions: ${row.nombre_transactions_carburant}`)
      console.log(`     Consommation: ${row.consommation_totale_carburant}€`)
    })
    
    // 7. Vérifier les problèmes de format de date
    console.log('\n📅 7. Vérification des formats de date:')
    const dateFormatResult = await query(`
      SELECT 
        date_livraison,
        COUNT(*) as count
      FROM carburant_consommation 
      WHERE date_livraison IS NOT NULL 
        AND date_livraison != ''
      GROUP BY date_livraison
      ORDER BY count DESC
      LIMIT 10
    `)
    
    console.log(`Formats de date trouvés:`)
    dateFormatResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. "${row.date_livraison}" (${row.count} occurrences)`)
    })
    
    console.log('\n✅ Diagnostic approfondi terminé!')
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic approfondi:', error)
  }
}

// Exécuter le diagnostic si le script est appelé directement
if (require.main === module) {
  deepDebugCarburant()
}

module.exports = { deepDebugCarburant }
