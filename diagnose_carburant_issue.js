const { query } = require('./lib/database')

async function diagnoseCarburantIssue() {
  try {
    console.log('🔍 Diagnostic complet du problème de carburant...')
    
    // 1. Vérifier la structure de la table
    console.log('\n📋 1. Structure de la table carburant_consommation:')
    const structureResult = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'carburant_consommation'
      ORDER BY ordinal_position
    `)
    
    structureResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
    })
    
    // 2. Vérifier les données de LOTFI spécifiquement
    console.log('\n👤 2. Recherche de LOTFI dans les employés:')
    const lotfiEmployesResult = await query(`
      SELECT id, nom, prenom, matricule
      FROM employes 
      WHERE LOWER(nom) LIKE '%lotfi%' 
         OR LOWER(prenom) LIKE '%lotfi%'
         OR LOWER(nom || ' ' || prenom) LIKE '%lotfi%'
    `)
    
    console.log(`Employés trouvés avec LOTFI: ${lotfiEmployesResult.rows.length}`)
    lotfiEmployesResult.rows.forEach(row => {
      console.log(`  ID: ${row.id}, Nom: ${row.nom}, Prénom: ${row.prenom}, Matricule: ${row.matricule}`)
    })
    
    // 3. Vérifier les données de carburant pour LOTFI
    if (lotfiEmployesResult.rows.length > 0) {
      const lotfiId = lotfiEmployesResult.rows[0].id
      console.log(`\n⛽ 3. Données de carburant pour LOTFI (ID: ${lotfiId}):`)
      
      const lotfiCarburantResult = await query(`
        SELECT 
          id,
          numero_carte,
          date_livraison,
          ca_ttc,
          employe_assigné,
          created_at
        FROM carburant_consommation 
        WHERE employe_assigné = $1
        ORDER BY date_livraison DESC
        LIMIT 10
      `, [lotfiId])
      
      console.log(`Transactions carburant trouvées: ${lotfiCarburantResult.rows.length}`)
      lotfiCarburantResult.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. Date: ${row.date_livraison}, Montant: ${row.ca_ttc}€`)
      })
      
      // 4. Vérifier les données de mai 2024 pour LOTFI
      console.log(`\n📅 4. Données de mai 2024 pour LOTFI:`)
      const maiLotfiResult = await query(`
        SELECT 
          COUNT(*) as nb_transactions,
          SUM(CAST(REPLACE(ca_ttc, ',', '.') AS DECIMAL(10,2))) as total_consommation
        FROM carburant_consommation 
        WHERE employe_assigné = $1
          AND date_livraison IS NOT NULL 
          AND date_livraison != ''
          AND ca_ttc IS NOT NULL 
          AND ca_ttc != ''
          AND TO_DATE(date_livraison, 'DD.MM.YYYY') >= '2024-05-01'::date 
          AND TO_DATE(date_livraison, 'DD.MM.YYYY') <= '2024-05-31'::date
      `, [lotfiId])
      
      console.log(`Transactions en mai: ${maiLotfiResult.rows[0].nb_transactions}`)
      console.log(`Consommation totale en mai: ${maiLotfiResult.rows[0].total_consommation}€`)
    }
    
    // 5. Vérifier tous les employés avec consommation en mai
    console.log('\n📊 5. Tous les employés avec consommation en mai 2024:')
    const maiAllResult = await query(`
      SELECT 
        e.id,
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
        AND TO_DATE(cc.date_livraison, 'DD.MM.YYYY') >= '2024-05-01'::date 
        AND TO_DATE(cc.date_livraison, 'DD.MM.YYYY') <= '2024-05-31'::date
      GROUP BY e.id, e.nom, e.prenom, e.matricule
      ORDER BY total_consommation DESC
    `)
    
    console.log(`Nombre d'employés avec consommation en mai: ${maiAllResult.rows.length}`)
    maiAllResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.nom} ${row.prenom} (${row.matricule})`)
      console.log(`     Transactions: ${row.nb_transactions}, Total: ${row.total_consommation}€`)
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
          AND TO_DATE(cc.date_livraison, 'DD.MM.YYYY') >= '2024-05-01'::date 
          AND TO_DATE(cc.date_livraison, 'DD.MM.YYYY') <= '2024-05-31'::date
        GROUP BY e.nom, e.prenom
      )
      SELECT * FROM carburant_data
    `)
    
    console.log(`Résultats de la requête carburant_data: ${apiDebugResult.rows.length}`)
    apiDebugResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.employe_nom} ${row.employe_prenom}`)
      console.log(`     Transactions: ${row.nombre_transactions_carburant}`)
      console.log(`     Consommation: ${row.consommation_totale_carburant}€`)
    })
    
    console.log('\n✅ Diagnostic terminé!')
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error)
  }
}

// Exécuter le diagnostic si le script est appelé directement
if (require.main === module) {
  diagnoseCarburantIssue()
}

module.exports = { diagnoseCarburantIssue }
