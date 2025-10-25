const { query } = require('./lib/database')

async function debugCarburantStructure() {
  try {
    console.log('🔍 Debug de la structure des tables carburant...')
    
    // Vérifier la structure de la table carburant_consommation
    const structureResult = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'carburant_consommation'
      ORDER BY ordinal_position
    `)
    
    console.log('📋 Structure de carburant_consommation:')
    structureResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
    })
    
    // Vérifier les données existantes
    const dataResult = await query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(employe_id) as records_with_employe_id,
        COUNT(employe_assigné) as records_with_employe_assigné,
        COUNT(CASE WHEN employe_id IS NOT NULL THEN 1 END) as non_null_employe_id,
        COUNT(CASE WHEN employe_assigné IS NOT NULL THEN 1 END) as non_null_employe_assigné
      FROM carburant_consommation
    `)
    
    console.log('\n📊 Statistiques des données:')
    console.log(`Total records: ${dataResult.rows[0].total_records}`)
    console.log(`Records with employe_id: ${dataResult.rows[0].records_with_employe_id}`)
    console.log(`Records with employe_assigné: ${dataResult.rows[0].records_with_employe_assigné}`)
    console.log(`Non-null employe_id: ${dataResult.rows[0].non_null_employe_id}`)
    console.log(`Non-null employe_assigné: ${dataResult.rows[0].non_null_employe_assigné}`)
    
    // Vérifier quelques exemples de données
    const sampleResult = await query(`
      SELECT 
        id,
        numero_carte,
        employe_id,
        employe_assigné,
        date_livraison,
        ca_ttc,
        created_at
      FROM carburant_consommation
      WHERE ca_ttc IS NOT NULL AND ca_ttc != ''
      ORDER BY created_at DESC
      LIMIT 5
    `)
    
    console.log('\n🔍 Exemples de données:')
    sampleResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ID: ${row.id}, Carte: ${row.numero_carte}`)
      console.log(`   employe_id: ${row.employe_id}, employe_assigné: ${row.employe_assigné}`)
      console.log(`   Date: ${row.date_livraison}, Montant: ${row.ca_ttc}`)
    })
    
    // Vérifier les employés avec consommation carburant
    const employeResult = await query(`
      SELECT 
        e.id,
        e.nom,
        e.prenom,
        e.matricule,
        COUNT(cc.id) as nb_transactions,
        SUM(CAST(REPLACE(cc.ca_ttc, ',', '.') AS DECIMAL(10,2))) as total_consommation
      FROM employes e
      LEFT JOIN carburant_consommation cc ON e.id = cc.employe_assigné
      WHERE cc.ca_ttc IS NOT NULL AND cc.ca_ttc != ''
      GROUP BY e.id, e.nom, e.prenom, e.matricule
      ORDER BY total_consommation DESC
      LIMIT 5
    `)
    
    console.log('\n👥 Employés avec consommation carburant:')
    employeResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.nom} ${row.prenom} (${row.matricule})`)
      console.log(`   Transactions: ${row.nb_transactions}, Total: ${row.total_consommation}€`)
    })
    
  } catch (error) {
    console.error('❌ Erreur lors du debug:', error)
  }
}

// Exécuter le debug si le script est appelé directement
if (require.main === module) {
  debugCarburantStructure()
}

module.exports = { debugCarburantStructure }
