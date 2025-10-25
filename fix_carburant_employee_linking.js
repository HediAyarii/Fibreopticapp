const { query } = require('./lib/database')

async function fixCarburantEmployeeLinking() {
  try {
    console.log('🔧 Correction du lien entre carburant et employés...')
    
    // 1. Vérifier les données de carburant sans employé assigné
    console.log('\n📊 1. Vérification des données sans employé assigné:')
    const unassignedResult = await query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN employe_assigné IS NULL THEN 1 END) as unassigned_records,
        COUNT(CASE WHEN employe_assigné IS NOT NULL THEN 1 END) as assigned_records
      FROM carburant_consommation
      WHERE ca_ttc IS NOT NULL AND ca_ttc != ''
    `)
    
    console.log(`Total records: ${unassignedResult.rows[0].total_records}`)
    console.log(`Records sans employé: ${unassignedResult.rows[0].unassigned_records}`)
    console.log(`Records avec employé: ${unassignedResult.rows[0].assigned_records}`)
    
    // 2. Essayer de lier automatiquement les données de carburant aux employés
    console.log('\n🔗 2. Tentative de liaison automatique:')
    
    // Méthode 1: Par nom et prénom dans les données de carburant
    const autoLinkResult = await query(`
      UPDATE carburant_consommation 
      SET employe_assigné = e.id
      FROM employes e
      WHERE carburant_consommation.employe_assigné IS NULL
        AND (
          LOWER(carburant_consommation.immat_vehicule) LIKE '%' || LOWER(e.nom) || '%'
          OR LOWER(carburant_consommation.point_acceptation) LIKE '%' || LOWER(e.nom) || '%'
          OR LOWER(carburant_consommation.point_acceptation) LIKE '%' || LOWER(e.prenom) || '%'
        )
    `)
    
    console.log(`Records mis à jour par liaison automatique: ${autoLinkResult.rowCount}`)
    
    // 3. Vérifier les données de LOTFI après correction
    console.log('\n👤 3. Vérification des données de LOTFI après correction:')
    const lotfiCheckResult = await query(`
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
      GROUP BY e.id, e.nom, e.prenom, e.matricule
    `)
    
    console.log(`Employés LOTFI trouvés: ${lotfiCheckResult.rows.length}`)
    lotfiCheckResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.nom} ${row.prenom} (${row.matricule})`)
      console.log(`     Transactions: ${row.nb_transactions}, Total: ${row.total_consommation}€`)
    })
    
    // 4. Vérifier les données de mai 2024 pour LOTFI
    if (lotfiCheckResult.rows.length > 0) {
      const lotfiId = lotfiCheckResult.rows[0].id
      console.log(`\n📅 4. Données de mai 2024 pour LOTFI (ID: ${lotfiId}):`)
      
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
    
    // 5. Test final de la requête de l'API
    console.log('\n🧪 5. Test final de la requête de l\'API:')
    const finalTestResult = await query(`
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
      ORDER BY consommation_totale_carburant DESC
    `)
    
    console.log(`Résultats finaux: ${finalTestResult.rows.length}`)
    finalTestResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.employe_nom} ${row.employe_prenom}`)
      console.log(`     Transactions: ${row.nombre_transactions_carburant}`)
      console.log(`     Consommation: ${row.consommation_totale_carburant}€`)
    })
    
    console.log('\n✅ Correction terminée!')
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error)
  }
}

// Exécuter la correction si le script est appelé directement
if (require.main === module) {
  fixCarburantEmployeeLinking()
}

module.exports = { fixCarburantEmployeeLinking }
