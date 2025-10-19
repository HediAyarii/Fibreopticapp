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

async function searchAugustInterventions() {
  try {
    console.log('🔍 Recherche des interventions d\'août dans la base de données...')
    
    // 1. Rechercher les interventions d'août 2025
    console.log('\n📊 Interventions d\'août 2025:')
    const august2025 = await pool.query(`
      SELECT 
        COUNT(*) as total_interventions,
        COUNT(CASE WHEN statut = 'CLOTURE TERMINEE' THEN 1 END) as cloture_terminee,
        COUNT(CASE WHEN statut = 'CLOTURE TERMINEE' AND articles IS NOT NULL AND articles != '' THEN 1 END) as avec_articles
      FROM interventions
      WHERE (
        (cloture_tech LIKE '%08.2025%' OR cloture_tech LIKE '%2025-08%') OR
        (cloture_hotline LIKE '%08.2025%' OR cloture_hotline LIKE '%2025-08%') OR
        (date_rdv LIKE '%08.2025%' OR date_rdv LIKE '%2025-08%')
      )
    `)
    
    console.log(`📋 Août 2025:`)
    console.log(`   - Total: ${august2025.rows[0].total_interventions}`)
    console.log(`   - CLOTURE TERMINEE: ${august2025.rows[0].cloture_terminee}`)
    console.log(`   - Avec articles: ${august2025.rows[0].avec_articles}`)
    
    // 2. Rechercher les interventions d'août 2024
    console.log('\n📊 Interventions d\'août 2024:')
    const august2024 = await pool.query(`
      SELECT 
        COUNT(*) as total_interventions,
        COUNT(CASE WHEN statut = 'CLOTURE TERMINEE' THEN 1 END) as cloture_terminee,
        COUNT(CASE WHEN statut = 'CLOTURE TERMINEE' AND articles IS NOT NULL AND articles != '' THEN 1 END) as avec_articles
      FROM interventions
      WHERE (
        (cloture_tech LIKE '%08.2024%' OR cloture_tech LIKE '%2024-08%') OR
        (cloture_hotline LIKE '%08.2024%' OR cloture_hotline LIKE '%2024-08%') OR
        (date_rdv LIKE '%08.2024%' OR date_rdv LIKE '%2024-08%')
      )
    `)
    
    console.log(`📋 Août 2024:`)
    console.log(`   - Total: ${august2024.rows[0].total_interventions}`)
    console.log(`   - CLOTURE TERMINEE: ${august2024.rows[0].cloture_terminee}`)
    console.log(`   - Avec articles: ${august2024.rows[0].avec_articles}`)
    
    // 3. Rechercher toutes les interventions d'août (toutes années)
    console.log('\n📊 Toutes les interventions d\'août (toutes années):')
    const allAugust = await pool.query(`
      SELECT 
        COUNT(*) as total_interventions,
        COUNT(CASE WHEN statut = 'CLOTURE TERMINEE' THEN 1 END) as cloture_terminee,
        COUNT(CASE WHEN statut = 'CLOTURE TERMINEE' AND articles IS NOT NULL AND articles != '' THEN 1 END) as avec_articles
      FROM interventions
      WHERE (
        (cloture_tech LIKE '%08.%' OR cloture_tech LIKE '%-08-%') OR
        (cloture_hotline LIKE '%08.%' OR cloture_hotline LIKE '%-08-%') OR
        (date_rdv LIKE '%08.%' OR date_rdv LIKE '%-08-%')
      )
    `)
    
    console.log(`📋 Toutes les interventions d'août:`)
    console.log(`   - Total: ${allAugust.rows[0].total_interventions}`)
    console.log(`   - CLOTURE TERMINEE: ${allAugust.rows[0].cloture_terminee}`)
    console.log(`   - Avec articles: ${allAugust.rows[0].avec_articles}`)
    
    // 4. Détails des interventions d'août 2025 par technicien
    if (august2025.rows[0].total_interventions > 0) {
      console.log('\n📊 Détails des interventions d\'août 2025 par technicien:')
      const augustDetails = await pool.query(`
        SELECT 
          nom_technicien,
          prenom_technicien,
          COUNT(*) as nombre_interventions,
          COUNT(CASE WHEN statut = 'CLOTURE TERMINEE' THEN 1 END) as cloture_terminee
        FROM interventions
        WHERE (
          (cloture_tech LIKE '%08.2025%' OR cloture_tech LIKE '%2025-08%') OR
          (cloture_hotline LIKE '%08.2025%' OR cloture_hotline LIKE '%2025-08%') OR
          (date_rdv LIKE '%08.2025%' OR date_rdv LIKE '%2025-08%')
        )
        GROUP BY nom_technicien, prenom_technicien
        ORDER BY nombre_interventions DESC
      `)
      
      console.log(`📋 Techniciens avec interventions en août 2025:`)
      augustDetails.rows.forEach(tech => {
        console.log(`   - ${tech.nom_technicien} ${tech.prenom_technicien}: ${tech.nombre_interventions} interventions (${tech.cloture_terminee} terminées)`)
      })
    }
    
    // 5. Détails des interventions d'août 2024 par technicien
    if (august2024.rows[0].total_interventions > 0) {
      console.log('\n📊 Détails des interventions d\'août 2024 par technicien:')
      const august2024Details = await pool.query(`
        SELECT 
          nom_technicien,
          prenom_technicien,
          COUNT(*) as nombre_interventions,
          COUNT(CASE WHEN statut = 'CLOTURE TERMINEE' THEN 1 END) as cloture_terminee
        FROM interventions
        WHERE (
          (cloture_tech LIKE '%08.2024%' OR cloture_tech LIKE '%2024-08%') OR
          (cloture_hotline LIKE '%08.2024%' OR cloture_hotline LIKE '%2024-08%') OR
          (date_rdv LIKE '%08.2024%' OR date_rdv LIKE '%2024-08%')
        )
        GROUP BY nom_technicien, prenom_technicien
        ORDER BY nombre_interventions DESC
      `)
      
      console.log(`📋 Techniciens avec interventions en août 2024:`)
      august2024Details.rows.forEach(tech => {
        console.log(`   - ${tech.nom_technicien} ${tech.prenom_technicien}: ${tech.nombre_interventions} interventions (${tech.cloture_terminee} terminées)`)
      })
    }
    
    // 6. Analyser les résultats
    console.log('\n🔍 Analyse des résultats:')
    const august2025Total = parseInt(august2025.rows[0].total_interventions || 0)
    const august2024Total = parseInt(august2024.rows[0].total_interventions || 0)
    const allAugustTotal = parseInt(allAugust.rows[0].total_interventions || 0)
    
    console.log(`📊 Résumé:`)
    console.log(`   - Août 2025: ${august2025Total} interventions`)
    console.log(`   - Août 2024: ${august2024Total} interventions`)
    console.log(`   - Toutes les interventions d'août: ${allAugustTotal} interventions`)
    
    if (august2025Total > 0) {
      console.log('✅ Des interventions trouvées pour août 2025')
    } else {
      console.log('❌ Aucune intervention pour août 2025')
    }
    
    if (august2024Total > 0) {
      console.log('✅ Des interventions trouvées pour août 2024')
    } else {
      console.log('❌ Aucune intervention pour août 2024')
    }
    
    if (allAugustTotal > 0) {
      console.log('✅ Des interventions trouvées pour août (toutes années)')
    } else {
      console.log('❌ Aucune intervention pour août (toutes années)')
    }
    
    console.log('\n🎯 Recherche terminée !')
    
  } catch (error) {
    console.error('❌ Erreur lors de la recherche:', error.message)
  } finally {
    await pool.end()
  }
}

searchAugustInterventions()
