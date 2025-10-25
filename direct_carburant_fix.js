const { query } = require('./lib/database')

async function directCarburantFix() {
  try {
    console.log('🔧 Correction directe du problème de carburant...')
    
    // 1. Vérifier l'état actuel des données
    console.log('\n📊 1. État actuel des données:')
    const currentStateResult = await query(`
      SELECT 
        COUNT(*) as total_carburant_records,
        COUNT(CASE WHEN employe_assigné IS NOT NULL THEN 1 END) as assigned_records,
        COUNT(CASE WHEN employe_assigné IS NULL THEN 1 END) as unassigned_records
      FROM carburant_consommation
      WHERE ca_ttc IS NOT NULL AND ca_ttc != '' AND ca_ttc != '0'
    `)
    
    console.log(`Total records carburant: ${currentStateResult.rows[0].total_carburant_records}`)
    console.log(`Records avec employé: ${currentStateResult.rows[0].assigned_records}`)
    console.log(`Records sans employé: ${currentStateResult.rows[0].unassigned_records}`)
    
    // 2. Vérifier les employés existants
    console.log('\n👥 2. Employés existants:')
    const employeesResult = await query(`
      SELECT id, nom, prenom, matricule
      FROM employes
      ORDER BY nom, prenom
      LIMIT 10
    `)
    
    console.log(`Employés trouvés: ${employeesResult.rows.length}`)
    employeesResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.nom} ${row.prenom} (${row.matricule}) - ID: ${row.id}`)
    })
    
    // 3. Vérifier les données de carburant sans employé assigné
    console.log('\n⛽ 3. Données de carburant sans employé:')
    const unassignedCarburantResult = await query(`
      SELECT 
        id,
        numero_carte,
        date_livraison,
        ca_ttc,
        immat_vehicule,
        point_acceptation
      FROM carburant_consommation
      WHERE employe_assigné IS NULL
        AND ca_ttc IS NOT NULL 
        AND ca_ttc != ''
        AND ca_ttc != '0'
      ORDER BY date_livraison DESC
      LIMIT 10
    `)
    
    console.log(`Records sans employé: ${unassignedCarburantResult.rows.length}`)
    unassignedCarburantResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. Date: ${row.date_livraison}, Montant: ${row.ca_ttc}€, Carte: ${row.numero_carte}`)
    })
    
    // 4. Essayer de lier automatiquement les données
    console.log('\n🔗 4. Liaison automatique des données:')
    
    // Méthode 1: Par nom dans les champs
    const linkResult1 = await query(`
      UPDATE carburant_consommation 
      SET employe_assigné = e.id
      FROM employes e
      WHERE carburant_consommation.employe_assigné IS NULL
        AND carburant_consommation.ca_ttc IS NOT NULL 
        AND carburant_consommation.ca_ttc != ''
        AND carburant_consommation.ca_ttc != '0'
        AND (
          LOWER(carburant_consommation.immat_vehicule) LIKE '%' || LOWER(e.nom) || '%'
          OR LOWER(carburant_consommation.point_acceptation) LIKE '%' || LOWER(e.nom) || '%'
          OR LOWER(carburant_consommation.point_acceptation) LIKE '%' || LOWER(e.prenom) || '%'
        )
    `)
    
    console.log(`Records liés par nom: ${linkResult1.rowCount}`)
    
    // Méthode 2: Par numéro de carte
    const linkResult2 = await query(`
      UPDATE carburant_consommation 
      SET employe_assigné = e.id
      FROM employes e
      WHERE carburant_consommation.employe_assigné IS NULL
        AND carburant_consommation.ca_ttc IS NOT NULL 
        AND carburant_consommation.ca_ttc != ''
        AND carburant_consommation.ca_ttc != '0'
        AND e.numero_carte_carburant IS NOT NULL
        AND carburant_consommation.numero_carte = e.numero_carte_carburant
    `)
    
    console.log(`Records liés par carte: ${linkResult2.rowCount}`)
    
    // 5. Vérifier les données de LOTFI spécifiquement
    console.log('\n🎯 5. Vérification de LOTFI:')
    const lotfiResult = await query(`
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
    
    console.log(`LOTFI trouvé: ${lotfiResult.rows.length}`)
    lotfiResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.nom} ${row.prenom} (${row.matricule})`)
      console.log(`     Transactions: ${row.nb_transactions}`)
      console.log(`     Total: ${row.total_consommation}€`)
    })
    
    // 6. Test de la requête de l'API avec données réelles
    console.log('\n🧪 6. Test de la requête de l\'API:')
    const apiTestResult = await query(`
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
        WHERE cc.ca_ttc IS NOT NULL 
          AND cc.ca_ttc != ''
          AND cc.ca_ttc != '0'
          AND cc.ca_ttc ~ '^[0-9]'
        GROUP BY e.nom, e.prenom
      )
      SELECT * FROM carburant_data
      ORDER BY consommation_totale_carburant DESC
    `)
    
    console.log(`Résultats de l'API: ${apiTestResult.rows.length}`)
    apiTestResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.employe_nom} ${row.employe_prenom}`)
      console.log(`     Transactions: ${row.nombre_transactions_carburant}`)
      console.log(`     Consommation: ${row.consommation_totale_carburant}€`)
    })
    
    // 7. Si aucun résultat, essayer une approche différente
    if (apiTestResult.rows.length === 0) {
      console.log('\n🔄 7. Approche alternative - sans filtrage de date:')
      const alternativeResult = await query(`
        SELECT 
          e.nom,
          e.prenom,
          COUNT(cc.id) as nb_transactions,
          SUM(CAST(REPLACE(cc.ca_ttc, ',', '.') AS DECIMAL(10,2))) as total_consommation
        FROM employes e
        INNER JOIN carburant_consommation cc ON e.id = cc.employe_assigné
        WHERE cc.ca_ttc IS NOT NULL 
          AND cc.ca_ttc != ''
          AND cc.ca_ttc != '0'
        GROUP BY e.nom, e.prenom
        ORDER BY total_consommation DESC
        LIMIT 10
      `)
      
      console.log(`Résultats alternatifs: ${alternativeResult.rows.length}`)
      alternativeResult.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.nom} ${row.prenom}`)
        console.log(`     Transactions: ${row.nb_transactions}`)
        console.log(`     Total: ${row.total_consommation}€`)
      })
    }
    
    console.log('\n✅ Correction directe terminée!')
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction directe:', error)
  }
}

// Exécuter la correction si le script est appelé directement
if (require.main === module) {
  directCarburantFix()
}

module.exports = { directCarburantFix }
