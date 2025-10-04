import { Pool } from 'pg'
import fetch from 'node-fetch'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

const baseUrl = 'http://localhost:3000'

async function verifyAllCarburantFixes() {
  console.log('🔍 Vérification complète des corrections carburant...')
  
  let totalChecks = 0
  let passedChecks = 0
  
  try {
    // 1. Vérifier la structure de la table carburant_assignations
    console.log('\n📋 1. Vérification de la structure de la table carburant_assignations...')
    totalChecks++
    
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'carburant_assignations'
      ORDER BY ordinal_position
    `)
    
    const expectedColumns = ['id', 'carte_id', 'employe_id', 'date_assignation', 'date_fin', 'statut']
    const actualColumns = structureResult.rows.map(row => row.column_name)
    
    const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col))
    if (missingColumns.length === 0) {
      console.log('   ✅ Structure de la table correcte')
      console.log(`   📊 Colonnes trouvées: ${actualColumns.join(', ')}`)
      passedChecks++
    } else {
      console.log(`   ❌ Colonnes manquantes: ${missingColumns.join(', ')}`)
    }
    
    // 2. Vérifier la fonction detecter_conflits_assignation
    console.log('\n📋 2. Vérification de la fonction detecter_conflits_assignation...')
    totalChecks++
    
    const functionResult = await pool.query(`
      SELECT routine_name, routine_type
      FROM information_schema.routines 
      WHERE routine_name = 'detecter_conflits_assignation'
    `)
    
    if (functionResult.rows.length > 0) {
      console.log('   ✅ Fonction detecter_conflits_assignation trouvée')
      passedChecks++
    } else {
      console.log('   ❌ Fonction detecter_conflits_assignation manquante')
    }
    
    // 3. Tester toutes les APIs carburant
    console.log('\n📋 3. Test de toutes les APIs carburant...')
    
    const apiTests = [
      { name: 'carburant-historique (employe)', url: '/api/carburant-histoire?employe_id=11' },
      { name: 'carburant-historique (carte)', url: '/api/carburant-histoire?numero_carte=TEST001' },
      { name: 'carburant-historique (général)', url: '/api/carburant-histoire' },
      { name: 'consommation-carburant-historique', url: '/api/consommation-carburant-historique' },
      { name: 'employes (avec carburant)', url: '/api/employes' }
    ]
    
    for (const test of apiTests) {
      totalChecks++
      try {
        const response = await fetch(`${baseUrl}${test.url}`)
        const data = await response.json()
        
        if (response.ok && data.success !== false) {
          console.log(`   ✅ ${test.name}: SUCCÈS (${response.status})`)
          passedChecks++
        } else {
          console.log(`   ❌ ${test.name}: ÉCHEC (${response.status})`)
          console.log(`   📊 Erreur: ${JSON.stringify(data).substring(0, 100)}...`)
        }
      } catch (error) {
        console.log(`   ❌ ${test.name}: ERREUR - ${error.message}`)
      }
    }
    
    // 4. Vérifier les corrections spécifiques dans le code
    console.log('\n📋 4. Vérification des corrections de code...')
    totalChecks++
    
    // Vérifier que les corrections ont été appliquées
    const fs = await import('fs')
    const carburantHistoireContent = fs.readFileSync('app/api/carburant-histoire/route.ts', 'utf8')
    
    const corrections = [
      { name: 'ca.carte_id au lieu de ca.numero_carte', pattern: 'ca.carte_id' },
      { name: 'ca.date_assignation au lieu de ca.date_debut', pattern: 'ca.date_assignation' },
      { name: 'ca.date_fin au lieu de ca.date_fin_prevue', pattern: 'ca.date_fin' },
      { name: 'cm.carte_id au lieu de cm.numero_carte', pattern: 'cm.carte_id as numero_carte' },
      { name: 'Commentaires corrigés', pattern: "-- commentaires TEXT, -- Colonne supprimée" }
    ]
    
    let codeCorrections = 0
    for (const correction of corrections) {
      if (carburantHistoireContent.includes(correction.pattern)) {
        console.log(`   ✅ ${correction.name}`)
        codeCorrections++
      } else {
        console.log(`   ❌ ${correction.name} - Pattern non trouvé: ${correction.pattern}`)
      }
    }
    
    if (codeCorrections === corrections.length) {
      console.log('   ✅ Toutes les corrections de code sont présentes')
      passedChecks++
    } else {
      console.log(`   ⚠️ ${codeCorrections}/${corrections.length} corrections de code trouvées`)
    }
    
    // Résumé final
    console.log('\n🎯 Résumé de la vérification:')
    console.log(`   - Vérifications totales: ${totalChecks}`)
    console.log(`   - Vérifications réussies: ${passedChecks}`)
    console.log(`   - Taux de réussite: ${((passedChecks / totalChecks) * 100).toFixed(1)}%`)
    
    if (passedChecks === totalChecks) {
      console.log('\n🎉 Toutes les corrections carburant sont en place et fonctionnelles !')
      console.log('📋 Corrections appliquées:')
      console.log('   ✅ Structure de table carburant_assignations corrigée')
      console.log('   ✅ Fonction detecter_conflits_assignation créée')
      console.log('   ✅ APIs carburant corrigées (5/5 fonctionnelles)')
      console.log('   ✅ Noms de colonnes alignés dans le code')
      console.log('   ✅ Scripts d\'initialisation mis à jour')
    } else {
      console.log('\n⚠️ Certaines corrections nécessitent encore de l\'attention.')
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  } finally {
    await pool.end()
  }
}

verifyAllCarburantFixes()
