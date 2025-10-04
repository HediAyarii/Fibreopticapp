import fs from 'fs'
import path from 'path'

// Liste des fichiers à corriger
const filesToFix = [
  'app/api/employes/route.ts',
  'app/api/carburant-assignation-periode/route.ts',
  'app/api/carburant-unassign/route.ts',
  'app/api/carburant-test-example/route.ts',
  'app/api/carburant-fix-assignments/route.ts',
  'app/api/carburant-consumption-by-employee/route.ts',
  'app/api/carburant-histoire/route.ts'
]

  // Corrections à appliquer
  const corrections = [
    // Corrections des noms de colonnes
    { from: 'ca.numero_carte', to: 'ca.carte_id' },
    { from: 'ca.date_debut', to: 'ca.date_assignation' },
    { from: 'ca.date_fin_prevue', to: 'ca.date_fin' },
    { from: 'ca.date_fin_reelle', to: 'ca.date_fin' },
    { from: 'ca.employe_nom', to: 'e.nom || \' \' || e.prenom as employe_nom' },
    { from: 'ca.commentaires', to: '\'\' as commentaires' },
    { from: 'cm.numero_carte', to: 'cm.carte_id as numero_carte' },
    
    // Corrections pour carburant-assignation-periode
    { from: 'numero_carte =', to: 'ca.carte_id =' },
    { from: 'employe_id =', to: 'ca.employe_id =' },
    { from: 'statut =', to: 'ca.statut =' },
    { from: 'date_debut <=', to: 'ca.date_assignation <=' },
    { from: 'COALESCE(date_fin_reelle, date_fin_prevue', to: 'COALESCE(ca.date_fin' },
    
    // Corrections pour carburant-assignation-periode POST
    { from: 'numero_carte, employe_id, employe_nom, date_debut,', to: 'carte_id, employe_id, date_assignation,' },
    { from: 'date_fin_prevue, commentaires, statut', to: 'date_fin, statut' },
    
    // Corrections des conditions WHERE
    { from: 'WHERE ca.numero_carte =', to: 'WHERE ca.carte_id =' },
    { from: 'AND ca.numero_carte =', to: 'AND ca.carte_id =' },
    { from: 'ON ca.numero_carte =', to: 'ON ca.carte_id =' },
    
    // Corrections des ORDER BY
    { from: 'ORDER BY ca.date_debut', to: 'ORDER BY ca.date_assignation' },
    { from: 'ORDER BY ca.date_fin_prevue', to: 'ORDER BY ca.date_fin' },
    
    // Corrections des SELECT
    { from: 'ca.numero_carte,', to: 'ca.carte_id as numero_carte,' },
    { from: 'ca.date_debut,', to: 'ca.date_assignation as date_debut,' },
    { from: 'ca.date_fin_prevue,', to: 'ca.date_fin as date_fin_prevue,' },
    { from: 'ca.date_fin_reelle,', to: 'ca.date_fin as date_fin_reelle,' },
    
    // Corrections des conditions CASE
    { from: 'WHEN ca.date_fin_reelle IS NOT NULL', to: 'WHEN ca.date_fin IS NOT NULL' },
    { from: 'WHEN ca.date_fin_prevue IS NOT NULL', to: 'WHEN ca.date_fin IS NOT NULL' },
    { from: 'COALESCE(ca.date_fin_reelle, ca.date_fin_prevue', to: 'COALESCE(ca.date_fin' },
]

async function fixCarburantAPIs() {
  console.log('🔧 Correction de toutes les APIs carburant...')
  
  let totalFiles = 0
  let fixedFiles = 0
  
  for (const filePath of filesToFix) {
    try {
      console.log(`\n📋 Traitement de ${filePath}...`)
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️ Fichier non trouvé: ${filePath}`)
        continue
      }
      
      let content = fs.readFileSync(filePath, 'utf8')
      let hasChanges = false
      
      // Appliquer toutes les corrections
      for (const correction of corrections) {
        const regex = new RegExp(correction.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
        if (content.includes(correction.from)) {
          content = content.replace(regex, correction.to)
          hasChanges = true
          console.log(`   ✅ Remplacé: ${correction.from} → ${correction.to}`)
        }
      }
      
      if (hasChanges) {
        // Ajouter le JOIN avec employes si nécessaire
        if (content.includes('e.nom') && !content.includes('LEFT JOIN employes e')) {
          content = content.replace(
            /FROM carburant_assignations ca/,
            'FROM carburant_assignations ca\n        LEFT JOIN employes e ON e.id = ca.employe_id'
          )
          console.log('   ✅ Ajouté JOIN avec employes')
        }
        
        fs.writeFileSync(filePath, content, 'utf8')
        fixedFiles++
        console.log(`   ✅ Fichier corrigé: ${filePath}`)
      } else {
        console.log(`   ℹ️ Aucune correction nécessaire: ${filePath}`)
      }
      
      totalFiles++
      
    } catch (error) {
      console.error(`❌ Erreur lors du traitement de ${filePath}:`, error.message)
    }
  }
  
  console.log('\n🎯 Correction terminée !')
  console.log(`📊 Résumé:`)
  console.log(`   - Fichiers traités: ${totalFiles}`)
  console.log(`   - Fichiers corrigés: ${fixedFiles}`)
  console.log(`   - Corrections appliquées: ${corrections.length}`)
}

fixCarburantAPIs()
