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

async function syncTotalGenere() {
  try {
    console.log('🔄 Synchronisation du total_généré pour CHIKHA SALEM...')
    
    // 1. Calculer le total_généré en temps réel
    console.log('\n📊 Calcul du total_généré en temps réel...')
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
      WHERE LOWER(i.nom_technicien) = LOWER('CHIKHA') AND LOWER(i.prenom_technicien) = LOWER('SALEM')
      AND (
        (i.date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' AND TO_DATE(i.date_rdv, 'DD.MM.YYYY') >= '2025-05-01' AND TO_DATE(i.date_rdv, 'DD.MM.YYYY') <= '2025-05-31')
        OR (i.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND i.date_rdv::date >= '2025-05-01' AND i.date_rdv::date <= '2025-05-31')
        OR (i.date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') >= '2025-05-01' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') <= '2025-05-31')
      )
    `)
    
    const totalReel = parseFloat(realTimeCalculation.rows[0].total_recettes_reel) || 0
    console.log(`💰 Total généré en temps réel: ${totalReel}€`)
    
    // 2. Récupérer le total_généré actuel
    const currentTotal = await pool.query(`
      SELECT total_genere, updated_at
      FROM cout_par_salaire 
      WHERE LOWER(nom) = LOWER('CHIKHA') AND LOWER(prenom) = LOWER('SALEM')
      AND mois = 5 AND annee = 2025
    `)
    
    if (currentTotal.rows.length > 0) {
      const current = parseFloat(currentTotal.rows[0].total_genere) || 0
      const lastUpdate = currentTotal.rows[0].updated_at
      console.log(`📅 Total généré actuel: ${current}€`)
      console.log(`📅 Dernière mise à jour: ${lastUpdate}`)
      console.log(`📈 Différence: ${(totalReel - current).toFixed(2)}€`)
      
      // 3. Mettre à jour le total_généré
      if (Math.abs(totalReel - current) > 0.01) {
        console.log('\n🔄 Mise à jour du total_généré...')
        await pool.query(`
          UPDATE cout_par_salaire 
          SET 
            total_genere = $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE LOWER(nom) = LOWER('CHIKHA') AND LOWER(prenom) = LOWER('SALEM')
          AND mois = 5 AND annee = 2025
        `, [totalReel])
        
        console.log(`✅ Total généré mis à jour: ${current}€ → ${totalReel}€`)
        
        // 4. Recalculer le RAP avec le nouveau total_généré
        console.log('\n🧮 Recalcul du RAP...')
        const newRapResult = await pool.query(`
          SELECT calculer_rap_avec_paiements(id) as nouveau_rap
          FROM cout_par_salaire 
          WHERE LOWER(nom) = LOWER('CHIKHA') AND LOWER(prenom) = LOWER('SALEM')
          AND mois = 5 AND annee = 2025
        `)
        
        if (newRapResult.rows.length > 0) {
          const nouveauRap = newRapResult.rows[0].nouveau_rap
          console.log(`✅ Nouveau RAP: ${nouveauRap}€`)
        }
        
      } else {
        console.log('✅ Le total_généré est déjà à jour')
      }
    } else {
      console.log('❌ CHIKHA SALEM non trouvé dans cout_par_salaire')
    }
    
    console.log('\n🎯 Synchronisation terminée !')
    console.log('💡 Le total_généré est maintenant synchronisé avec les interventions')
    
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error.message)
  } finally {
    await pool.end()
  }
}

syncTotalGenere()
