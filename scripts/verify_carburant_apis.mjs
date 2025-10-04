import { Pool } from 'pg'
import fs from 'fs'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function verifyCarburantAPIs() {
  try {
    console.log('🔍 Vérification des APIs carburant...')
    
    // 1. Vérifier la structure de carburant_assignations
    console.log('\n📋 1. Vérification de la structure carburant_assignations...')
    const structureResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'carburant_assignations' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `)
    
    const expectedColumns = ['id', 'employe_id', 'carte_id', 'date_assignation', 'date_fin', 'statut']
    console.log('Structure actuelle:')
    structureResult.rows.forEach(row => {
      const isExpected = expectedColumns.includes(row.column_name)
      console.log(`   ${isExpected ? '✅' : '❌'} ${row.column_name}: ${row.data_type}`)
    })
    
    // 2. Vérifier les APIs qui utilisent les anciens noms
    console.log('\n📋 2. Vérification des APIs...')
    const apiFiles = [
      'app/api/employes/route.ts',
      'app/api/carburant-assignation-periode/route.ts',
      'app/api/carburant-unassign/route.ts',
      'app/api/carburant-test-example/route.ts',
      'app/api/carburant-fix-assignments/route.ts',
      'app/api/carburant-consumption-by-employee/route.ts',
      'app/api/carburant-histoire/route.ts',
      'app/api/carburant-historique/route.ts',
      'app/api/consommation-carburant-historique/route.ts'
    ]
    
    let totalFiles = 0
    let fixedFiles = 0
    
    for (const filePath of apiFiles) {
      totalFiles++
      try {
        if (!fs.existsSync(filePath)) {
          console.log(`   ⚠️ Fichier non trouvé: ${filePath}`)
          continue
        }
        
        const content = fs.readFileSync(filePath, 'utf8')
        const hasOldColumns = content.includes('ca.numero_carte') || 
                             content.includes('ca.date_debut') || 
                             content.includes('ca.date_fin_prevue') || 
                             content.includes('ca.date_fin_reelle') ||
                             content.includes('ca.employe_nom')
        
        if (hasOldColumns) {
          console.log(`   ❌ ${filePath}: Contient encore des anciens noms de colonnes`)
        } else {
          console.log(`   ✅ ${filePath}: Utilise les nouveaux noms de colonnes`)
          fixedFiles++
        }
        
      } catch (error) {
        console.log(`   ❌ ${filePath}: Erreur lors de la lecture - ${error.message}`)
      }
    }
    
    // 3. Test de la fonction detecter_conflits_assignation
    console.log('\n📋 3. Test de la fonction detecter_conflits_assignation...')
    try {
      const testResult = await pool.query(`
        SELECT * FROM detecter_conflits_assignation(1, 'TEST_CARD_001', '2025-01-01 00:00:00'::timestamp)
      `)
      console.log('✅ Fonction detecter_conflits_assignation fonctionne')
      console.log(`   - Résultat: ${JSON.stringify(testResult.rows[0])}`)
    } catch (error) {
      console.log(`❌ Erreur lors du test de la fonction: ${error.message}`)
    }
    
    // 4. Test d'une API carburant
    console.log('\n📋 4. Test d\'une API carburant...')
    try {
      const testApiResult = await pool.query(`
        SELECT 
          ca.carte_id as numero_carte,
          ca.date_assignation as date_debut,
          ca.date_fin as date_fin_prevue,
          ca.date_fin as date_fin_reelle,
          ca.statut,
          e.nom || ' ' || e.prenom as employe_nom
        FROM carburant_assignations ca
        LEFT JOIN employes e ON e.id = ca.employe_id
        LIMIT 1
      `)
      console.log('✅ Requête carburant fonctionne')
      console.log(`   - Résultat: ${JSON.stringify(testApiResult.rows[0] || 'Aucune donnée')}`)
    } catch (error) {
      console.log(`❌ Erreur lors du test de l'API: ${error.message}`)
    }
    
    console.log('\n🎯 Vérification terminée !')
    console.log(`📊 Résumé:`)
    console.log(`   - APIs vérifiées: ${totalFiles}`)
    console.log(`   - APIs corrigées: ${fixedFiles}`)
    console.log(`   - Structure carburant_assignations: ${structureResult.rows.length} colonnes`)
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  } finally {
    await pool.end()
  }
}

verifyCarburantAPIs()
