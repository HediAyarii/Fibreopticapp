import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function testClearDatabase() {
  console.log('🧪 Test de l\'API clear-database...')
  
  try {
    // 1. Vérifier les données avant le nettoyage
    console.log('\n📋 1. Données avant nettoyage:')
    const beforeStats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM employes) as employes_count,
        (SELECT COUNT(*) FROM interventions) as interventions_count,
        (SELECT COUNT(*) FROM cout_par_salaire) as couts_count,
        (SELECT COUNT(*) FROM paiements_employes) as paiements_count,
        (SELECT COUNT(*) FROM carburant) as carburant_count,
        (SELECT COUNT(*) FROM materiel) as materiel_count
    `)
    
    const before = beforeStats.rows[0]
    console.log(`  - Employés: ${before.employes_count}`)
    console.log(`  - Interventions: ${before.interventions_count}`)
    console.log(`  - Coûts par salarié: ${before.couts_count}`)
    console.log(`  - Paiements: ${before.paiements_count}`)
    console.log(`  - Carburant: ${before.carburant_count}`)
    console.log(`  - Matériel: ${before.materiel_count}`)
    
    // 2. Vérifier les utilisateurs admin
    console.log('\n📋 2. Utilisateurs admin:')
    const adminUsers = await pool.query(`
      SELECT id, nom, prenom, email, niveau_acces 
      FROM employes 
      WHERE niveau_acces = 'admin' OR email LIKE '%admin%'
    `)
    
    console.log(`✅ ${adminUsers.rows.length} utilisateur(s) admin trouvé(s):`)
    adminUsers.rows.forEach((admin, index) => {
      console.log(`  ${index + 1}. ${admin.nom} ${admin.prenom} (${admin.email}) - ${admin.niveau_acces}`)
    })
    
    if (adminUsers.rows.length === 0) {
      console.log('⚠️ Aucun utilisateur admin trouvé ! Création d\'un admin par défaut...')
      
      // Créer un utilisateur admin par défaut
      await pool.query(`
        INSERT INTO employes (
          nom, prenom, email, niveau_acces, statut, matricule
        ) VALUES (
          'ADMIN', 'SYSTEM', 'admin@finalfibre.com', 'admin', 'actif', 'ADMIN_001'
        )
      `)
      console.log('✅ Utilisateur admin par défaut créé')
    }
    
    // 3. Simuler l'API clear-database
    console.log('\n📋 3. Simulation du nettoyage...')
    
    // Liste des tables à vider
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
    
    // Vider chaque table (sauf les admins)
    for (const tableName of tablesToClear) {
      try {
        if (tableName === 'employes') {
          // Pour la table employes, ne supprimer que les non-admin
          const result = await pool.query(`
            DELETE FROM ${tableName} 
            WHERE niveau_acces != 'admin' AND email NOT LIKE '%admin%'
          `)
          const deletedCount = result.rowCount || 0
          totalDeleted += deletedCount
          results.push({
            table: tableName,
            deleted: deletedCount,
            success: true,
            note: 'Admins conservés'
          })
        } else {
          const result = await pool.query(`DELETE FROM ${tableName}`)
          const deletedCount = result.rowCount || 0
          totalDeleted += deletedCount
          results.push({
            table: tableName,
            deleted: deletedCount,
            success: true
          })
        }
        
        console.log(`✅ ${tableName}: ${results[results.length - 1].deleted} enregistrements supprimés`)
        
      } catch (error) {
        console.error(`❌ Erreur ${tableName}:`, error.message)
        results.push({
          table: tableName,
          deleted: 0,
          success: false,
          error: error.message
        })
      }
    }
    
    // 4. Vérifier les données après le nettoyage
    console.log('\n📋 4. Données après nettoyage:')
    const afterStats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM employes) as employes_count,
        (SELECT COUNT(*) FROM interventions) as interventions_count,
        (SELECT COUNT(*) FROM cout_par_salaire) as couts_count,
        (SELECT COUNT(*) FROM paiements_employes) as paiements_count,
        (SELECT COUNT(*) FROM carburant) as carburant_count,
        (SELECT COUNT(*) FROM materiel) as materiel_count
    `)
    
    const after = afterStats.rows[0]
    console.log(`  - Employés: ${after.employes_count}`)
    console.log(`  - Interventions: ${after.interventions_count}`)
    console.log(`  - Coûts par salarié: ${after.couts_count}`)
    console.log(`  - Paiements: ${after.paiements_count}`)
    console.log(`  - Carburant: ${after.carburant_count}`)
    console.log(`  - Matériel: ${after.materiel_count}`)
    
    // 5. Vérifier les admins restants
    const remainingAdmins = await pool.query(`
      SELECT id, nom, prenom, email, niveau_acces 
      FROM employes 
      WHERE niveau_acces = 'admin' OR email LIKE '%admin%'
    `)
    
    console.log(`\n👤 Admins restants: ${remainingAdmins.rows.length}`)
    remainingAdmins.rows.forEach((admin, index) => {
      console.log(`  ${index + 1}. ${admin.nom} ${admin.prenom} (${admin.email}) - ${admin.niveau_acces}`)
    })
    
    console.log('\n🎯 Test terminé !')
    console.log(`📊 Résultats:`)
    console.log(`  - Total supprimé: ${totalDeleted} enregistrements`)
    console.log(`  - Tables traitées: ${results.length}`)
    console.log(`  - Admins conservés: ${remainingAdmins.rows.length}`)
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
  } finally {
    await pool.end()
  }
}

testClearDatabase()
