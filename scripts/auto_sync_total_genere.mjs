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

async function autoSyncTotalGenere() {
  try {
    console.log('🔄 Synchronisation automatique du Total Généré...')
    
    // 1. Récupérer tous les employés avec des charges
    console.log('\n📊 1. Récupération des employés...')
    const employees = await pool.query(`
      SELECT DISTINCT nom, prenom, mois, annee, id
      FROM cout_par_salaire 
      WHERE nom IS NOT NULL AND prenom IS NOT NULL
      ORDER BY nom, prenom, annee, mois
    `)
    
    console.log(`📋 ${employees.rows.length} employés trouvés`)
    
    let totalUpdated = 0
    let totalSkipped = 0
    
    // 2. Calculer le Total Généré pour chaque employé
    for (const employee of employees.rows) {
      try {
        console.log(`\n👤 Traitement: ${employee.nom} ${employee.prenom} (${employee.mois}/${employee.annee})`)
        
        // Calculer le total généré réel
        const realTimeCalculation = await pool.query(`
          SELECT 
            SUM(
              CASE 
                WHEN i.statut = 'CLOTURE TERMINEE' THEN
                  COALESCE(
                    (SELECT SUM(
                      CASE 
                        WHEN cp.prix_tech IS NOT NULL THEN cp.prix_tech
                        ELSE 0
                      END
                    )
                    FROM unnest(string_to_array(i.articles, ',')) as article_item
                    LEFT JOIN company_pricing cp ON 
                      TRIM(SPLIT_PART(article_item, 'x', 1)) = cp.service_code
                      AND cp.company_name = 'ERT OUEST'
                      AND cp.category = i.type_intervention
                    ), 0
                  )
                ELSE 0
              END
            ) as total_recettes_reel
          FROM interventions i
          WHERE LOWER(i.nom_technicien) = LOWER($1) AND LOWER(i.prenom_technicien) = LOWER($2)
          AND (
            (i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND 
             i.cloture_tech ~ '^[0-9]' AND 
             (i.cloture_tech::date >= DATE($3 || '-' || LPAD($4::text, 2, '0') || '-01') AND 
              i.cloture_tech::date <= (DATE($3 || '-' || LPAD($4::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))) OR
            (i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND 
             i.cloture_hotline ~ '^[0-9]' AND 
             (i.cloture_hotline::date >= DATE($3 || '-' || LPAD($4::text, 2, '0') || '-01') AND 
              i.cloture_hotline::date <= (DATE($3 || '-' || LPAD($4::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))) OR
            (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND 
             i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND 
             i.date_rdv ~ '^[0-9]' AND 
             (i.date_rdv::date >= DATE($3 || '-' || LPAD($4::text, 2, '0') || '-01') AND 
              i.date_rdv::date <= (DATE($3 || '-' || LPAD($4::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day')))
          )
        `, [employee.nom, employee.prenom, employee.annee, employee.mois])
        
        const totalReel = parseFloat(realTimeCalculation.rows[0]?.total_recettes_reel) || 0
        
        // Récupérer le total actuel
        const currentTotal = await pool.query(`
          SELECT total_genere, updated_at
          FROM cout_par_salaire 
          WHERE id = $1
        `, [employee.id])
        
        if (currentTotal.rows.length > 0) {
          const current = parseFloat(currentTotal.rows[0].total_genere) || 0
          const difference = totalReel - current
          
          console.log(`   💰 Total actuel: ${current}€`)
          console.log(`   💰 Total calculé: ${totalReel}€`)
          console.log(`   📈 Différence: ${difference.toFixed(2)}€`)
          
          // Mettre à jour si nécessaire
          if (Math.abs(difference) > 0.01) {
            console.log(`   🔄 Mise à jour nécessaire...`)
            
            // Mettre à jour le total_genere
            await pool.query(`
              UPDATE cout_par_salaire 
              SET 
                total_genere = $1,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = $2
            `, [totalReel, employee.id])
            
            // Recalculer le RAP
            const newRapResult = await pool.query(`
              SELECT calculer_rap_avec_paiements($1) as nouveau_rap
            `, [employee.id])
            
            if (newRapResult.rows.length > 0) {
              const nouveauRap = newRapResult.rows[0].nouveau_rap
              console.log(`   ✅ RAP recalculé: ${nouveauRap}€`)
            }
            
            totalUpdated++
            console.log(`   ✅ Mis à jour: ${current}€ → ${totalReel}€`)
          } else {
            totalSkipped++
            console.log(`   ⏭️ Déjà à jour`)
          }
        }
        
      } catch (error) {
        console.error(`   ❌ Erreur pour ${employee.nom} ${employee.prenom}:`, error.message)
      }
    }
    
    console.log(`\n🎯 Synchronisation terminée !`)
    console.log(`📊 Résultats:`)
    console.log(`   - Employés mis à jour: ${totalUpdated}`)
    console.log(`   - Employés déjà à jour: ${totalSkipped}`)
    console.log(`   - Total traité: ${totalUpdated + totalSkipped}`)
    
  } catch (error) {
    console.error('❌ Erreur synchronisation automatique:', error)
  } finally {
    await pool.end()
  }
}

// Exécuter la synchronisation
autoSyncTotalGenere().catch(console.error)

