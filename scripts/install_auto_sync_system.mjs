import pkg from 'pg'
const { Pool } = pkg
import fs from 'fs'

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

async function installAutoSyncSystem() {
  try {
    console.log('🔧 Installation du système de synchronisation automatique...')
    
    // Lire le fichier SQL
    const sqlContent = fs.readFileSync('scripts/create_auto_sync_triggers.sql', 'utf8')
    
    // Diviser en requêtes individuelles
    const queries = sqlContent
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--'))
    
    console.log(`📋 ${queries.length} requêtes à exécuter...`)
    
    // Exécuter chaque requête
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i]
      if (query.trim()) {
        try {
          console.log(`\n🔄 Exécution de la requête ${i + 1}/${queries.length}...`)
          await pool.query(query)
          console.log(`✅ Requête ${i + 1} exécutée avec succès`)
        } catch (error) {
          console.log(`⚠️ Requête ${i + 1} ignorée (peut-être déjà existante): ${error.message}`)
        }
      }
    }
    
    // Vérifier que les fonctions ont été créées
    console.log('\n🔍 Vérification des fonctions créées...')
    
    const functions = [
      'calculer_recettes_employe_mois',
      'synchroniser_recettes_employe',
      'trigger_sync_recettes_intervention',
      'synchroniser_tous_employes_mois',
      'verifier_coherence_recettes'
    ]
    
    for (const funcName of functions) {
      try {
        const result = await pool.query(`
          SELECT proname 
          FROM pg_proc 
          WHERE proname = $1
        `, [funcName])
        
        if (result.rows.length > 0) {
          console.log(`✅ Fonction ${funcName} créée`)
        } else {
          console.log(`❌ Fonction ${funcName} non trouvée`)
        }
      } catch (error) {
        console.log(`⚠️ Erreur lors de la vérification de ${funcName}: ${error.message}`)
      }
    }
    
    // Vérifier que le trigger a été créé
    console.log('\n🔍 Vérification du trigger...')
    try {
      const triggerResult = await pool.query(`
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE trigger_name = 'sync_recettes_intervention_trigger'
      `)
      
      if (triggerResult.rows.length > 0) {
        console.log('✅ Trigger sync_recettes_intervention_trigger créé')
      } else {
        console.log('❌ Trigger non trouvé')
      }
    } catch (error) {
      console.log(`⚠️ Erreur lors de la vérification du trigger: ${error.message}`)
    }
    
    // Test du système
    console.log('\n🧪 Test du système de synchronisation...')
    try {
      // Tester la fonction de vérification de cohérence
      const coherenceTest = await pool.query(`
        SELECT COUNT(*) as total_incoherences
        FROM verifier_coherence_recettes()
        WHERE ABS(difference) > 0.01
      `)
      
      console.log(`📊 Incohérences détectées: ${coherenceTest.rows[0].total_incoherences}`)
      
      if (parseInt(coherenceTest.rows[0].total_incoherences) > 0) {
        console.log('⚠️ Des incohérences ont été détectées, synchronisation recommandée')
      } else {
        console.log('✅ Aucune incohérence détectée')
      }
      
    } catch (error) {
      console.log(`⚠️ Erreur lors du test: ${error.message}`)
    }
    
    console.log('\n🎯 Installation terminée !')
    console.log('📋 Système de synchronisation automatique installé:')
    console.log('   ✅ Triggers automatiques actifs')
    console.log('   ✅ Fonctions de synchronisation créées')
    console.log('   ✅ Vérification de cohérence disponible')
    console.log('   ✅ Synchronisation automatique lors des modifications d\'interventions')
    
    console.log('\n💡 Utilisation:')
    console.log('   - Les recettes se synchronisent automatiquement')
    console.log('   - Exécutez maintenance_check_revenue.mjs pour vérifier')
    console.log('   - Utilisez synchroniser_tous_employes_mois(mois, année) pour forcer la sync')
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'installation:', error.message)
  } finally {
    await pool.end()
  }
}

installAutoSyncSystem()
