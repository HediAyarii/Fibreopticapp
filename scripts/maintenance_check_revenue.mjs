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

async function maintenanceCheckRevenue() {
  try {
    console.log('🔧 Vérification de maintenance des recettes...')
    
    // 1. Vérifier la cohérence des données
    console.log('\n📊 Vérification de la cohérence des données...')
    const coherenceCheck = await pool.query(`
      SELECT 
        nom_technicien,
        prenom_technicien,
        mois,
        annee,
        total_genere_stocke,
        total_genere_calcule,
        difference
      FROM verifier_coherence_recettes()
      WHERE ABS(difference) > 0.01
      ORDER BY ABS(difference) DESC
      LIMIT 10
    `)
    
    if (coherenceCheck.rows.length > 0) {
      console.log(`⚠️ ${coherenceCheck.rows.length} incohérences détectées:`)
      coherenceCheck.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.nom_technicien} ${row.prenom_technicien} (${row.mois}/${row.annee}):`)
        console.log(`   - Stocké: ${row.total_genere_stocke}€`)
        console.log(`   - Calculé: ${row.total_genere_calcule}€`)
        console.log(`   - Différence: ${row.difference}€`)
      })
    } else {
      console.log('✅ Aucune incohérence détectée')
    }
    
    // 2. Synchroniser tous les employés du mois en cours
    console.log('\n🔄 Synchronisation du mois en cours...')
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()
    
    const syncResult = await pool.query(`
      SELECT synchroniser_tous_employes_mois($1, $2) as employes_synchronises
    `, [currentMonth, currentYear])
    
    console.log(`✅ ${syncResult.rows[0].employes_synchronises} employés synchronisés pour ${currentMonth}/${currentYear}`)
    
    // 3. Statistiques générales
    console.log('\n📈 Statistiques générales:')
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_employes,
        SUM(total_genere) as total_recettes,
        AVG(total_genere) as moyenne_recettes,
        MAX(total_genere) as max_recettes,
        MIN(total_genere) as min_recettes
      FROM cout_par_salaire 
      WHERE total_genere > 0
    `)
    
    if (stats.rows.length > 0) {
      const row = stats.rows[0]
      console.log(`   - Total employés: ${row.total_employes}`)
      console.log(`   - Total recettes: ${parseFloat(row.total_recettes).toFixed(2)}€`)
      console.log(`   - Moyenne: ${parseFloat(row.moyenne_recettes).toFixed(2)}€`)
      console.log(`   - Max: ${parseFloat(row.max_recettes).toFixed(2)}€`)
      console.log(`   - Min: ${parseFloat(row.min_recettes).toFixed(2)}€`)
    }
    
    // 4. Recommandations
    console.log('\n💡 Recommandations:')
    console.log('   ✅ Les triggers automatiques sont maintenant actifs')
    console.log('   ✅ Les recettes se synchronisent automatiquement')
    console.log('   ✅ Exécutez ce script régulièrement pour vérifier la cohérence')
    console.log('   ✅ En cas de problème, utilisez synchroniser_tous_employes_mois()')
    
    console.log('\n🎯 Vérification de maintenance terminée !')
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message)
  } finally {
    await pool.end()
  }
}

maintenanceCheckRevenue()
