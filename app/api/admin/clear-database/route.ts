import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export const dynamic = 'force-dynamic'

// POST - Vider toutes les données de la base de données
export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Début du nettoyage de la base de données...')
    
    // Vérifier que l'utilisateur est admin (optionnel, pour sécurité)
    const { confirm } = await request.json()
    
    if (!confirm) {
      return NextResponse.json({ 
        success: false, 
        error: 'Confirmation requise pour vider la base de données' 
      }, { status: 400 })
    }
    
    // Liste des tables à vider (dans l'ordre pour respecter les contraintes de clés étrangères)
    const tablesToClear = [
      'paiements_employes',
      'cout_par_salaire', 
      'carburant_assignations',
      'carburant_consommation',
      'affectations_materiel',
      'penalites',
      'reclamations',
      'frais_entreprise',
      'interventions',
      'materiel',
      'employes',
      'carburant'
    ]
    
    const results = []
    let totalDeleted = 0
    
    // Vider chaque table
    for (const tableName of tablesToClear) {
      try {
        console.log(`🗑️ Nettoyage de la table ${tableName}...`)
        
        const result = await query(`DELETE FROM ${tableName}`)
        const deletedCount = result.rowCount || 0
        totalDeleted += deletedCount
        
        results.push({
          table: tableName,
          deleted: deletedCount,
          success: true
        })
        
        console.log(`✅ ${tableName}: ${deletedCount} enregistrements supprimés`)
        
      } catch (error: any) {
        console.error(`❌ Erreur lors du nettoyage de ${tableName}:`, error.message)
        results.push({
          table: tableName,
          deleted: 0,
          success: false,
          error: error.message
        })
      }
    }
    
    // Réinitialiser les séquences (auto-increment)
    console.log('🔄 Réinitialisation des séquences...')
    const sequences = [
      'employes_id_seq',
      'interventions_id_seq', 
      'materiel_id_seq',
      'carburant_id_seq',
      'carburant_assignations_id_seq',
      'carburant_consommation_id_seq',
      'affectations_materiel_id_seq',
      'penalites_id_seq',
      'reclamations_id_seq',
      'frais_entreprise_id_seq',
      'cout_par_salaire_id_seq',
      'paiements_employes_id_seq'
    ]
    
    for (const sequence of sequences) {
      try {
        await query(`ALTER SEQUENCE ${sequence} RESTART WITH 1`)
        console.log(`✅ Séquence ${sequence} réinitialisée`)
      } catch (error) {
        console.log(`⚠️ Séquence ${sequence} non trouvée (normal si la table n'existe pas)`)
      }
    }
    
    // Vérifier que l'utilisateur admin existe toujours
    const adminCheck = await query(`
      SELECT id, nom, prenom, email, niveau_acces 
      FROM employes 
      WHERE niveau_acces = 'admin' OR email LIKE '%admin%'
    `)
    
    console.log(`👤 Utilisateurs admin trouvés: ${adminCheck.rows.length}`)
    if (adminCheck.rows.length === 0) {
      console.log('⚠️ Aucun utilisateur admin trouvé après le nettoyage')
    } else {
      adminCheck.rows.forEach((admin, index) => {
        console.log(`  ${index + 1}. ${admin.nom} ${admin.prenom} (${admin.email}) - ${admin.niveau_acces}`)
      })
    }
    
    // Statistiques finales
    const finalStats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM employes) as employes_count,
        (SELECT COUNT(*) FROM interventions) as interventions_count,
        (SELECT COUNT(*) FROM cout_par_salaire) as couts_count,
        (SELECT COUNT(*) FROM paiements_employes) as paiements_count,
        (SELECT COUNT(*) FROM carburant) as carburant_count,
        (SELECT COUNT(*) FROM materiel) as materiel_count
    `)
    
    const stats = finalStats.rows[0]
    
    console.log('\n📊 Statistiques après nettoyage:')
    console.log(`  - Employés: ${stats.employes_count}`)
    console.log(`  - Interventions: ${stats.interventions_count}`)
    console.log(`  - Coûts par salarié: ${stats.couts_count}`)
    console.log(`  - Paiements: ${stats.paiements_count}`)
    console.log(`  - Carburant: ${stats.carburant_count}`)
    console.log(`  - Matériel: ${stats.materiel_count}`)
    
    console.log('\n🎯 Nettoyage de la base de données terminé !')
    console.log(`📊 Total d'enregistrements supprimés: ${totalDeleted}`)
    
    return NextResponse.json({
      success: true,
      message: 'Base de données vidée avec succès',
      data: {
        totalDeleted,
        tablesProcessed: results.length,
        results,
        finalStats: stats,
        adminUsers: adminCheck.rows.length
      }
    })
    
  } catch (error: any) {
    console.error('❌ Erreur lors du nettoyage de la base de données:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Erreur serveur: ${error.message}` 
    }, { status: 500 })
  }
}










