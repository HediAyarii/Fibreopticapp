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

async function debugChargesVsBenefice() {
  try {
    console.log('🔍 Diagnostic Charges par Salarié vs Bénéfice Brut...')
    console.log('📊 Problème: Bénéfice Brut correct, Charges par Salarié incorrect')
    
    // 1. Vérifier les données dans cout_par_salaire
    console.log('\n📊 Données dans cout_par_salaire:')
    const coutParSalaireResult = await pool.query(`
      SELECT 
        nom, prenom, matricule, total_genere, rap, updated_at
      FROM cout_par_salaire 
      WHERE mois = 5 AND annee = 2025
      ORDER BY total_genere DESC
    `)
    
    console.log(`📋 ${coutParSalaireResult.rows.length} techniciens dans cout_par_salaire:`)
    coutParSalaireResult.rows.forEach((row, index) => {
      if (row.total_genere > 0) {
        console.log(`${index + 1}. ${row.nom} ${row.prenom} (${row.matricule}) - ${row.total_genere}€`)
      }
    })
    
    // 2. Calculer les revenus comme dans Bénéfice Brut
    console.log('\n📊 Calcul comme dans Bénéfice Brut:')
    const beneficeBrutQuery = `
      WITH intervention_revenue AS (
        SELECT 
          i.id as intervention_id,
          i.num_inter,
          i.client,
          i.date_rdv,
          i.prenom_technicien,
          i.nom_technicien,
          i.cloture_tech,
          i.cloture_hotline,
          i.articles,
          i.statut,
          i.type_intervention,
          -- Correspondance améliorée avec normalisation des noms
          COALESCE(e.id, -1) as employe_id,
          COALESCE(e.nom, i.nom_technicien) as employe_nom,
          COALESCE(e.prenom, i.prenom_technicien) as employe_prenom,
          COALESCE(e.matricule, CONCAT('TECH_', UPPER(SUBSTRING(i.nom_technicien, 1, 3)), UPPER(SUBSTRING(i.prenom_technicien, 1, 2)))) as matricule,
          -- Calculer les recettes basées sur les articles
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
          END as recette_technicien
        FROM interventions i
        LEFT JOIN employes e ON (
          -- Correspondance simplifiée et plus robuste
          (
            LOWER(TRIM(e.prenom)) = LOWER(TRIM(i.prenom_technicien)) AND 
            LOWER(TRIM(e.nom)) = LOWER(TRIM(i.nom_technicien))
          ) OR (
            -- Correspondance avec normalisation des espaces et tirets
            LOWER(REGEXP_REPLACE(e.prenom, '[^a-zA-Z0-9]', '', 'g')) = LOWER(REGEXP_REPLACE(i.prenom_technicien, '[^a-zA-Z0-9]', '', 'g')) AND
            LOWER(REGEXP_REPLACE(e.nom, '[^a-zA-Z0-9]', '', 'g')) = LOWER(REGEXP_REPLACE(i.nom_technicien, '[^a-zA-Z0-9]', '', 'g'))
          ) OR (
            -- Correspondance inversée
            LOWER(TRIM(e.prenom)) = LOWER(TRIM(i.nom_technicien)) AND 
            LOWER(TRIM(e.nom)) = LOWER(TRIM(i.prenom_technicien))
          ) OR (
            -- Correspondance partielle améliorée
            (
              LOWER(e.prenom) LIKE '%' || LOWER(i.prenom_technicien) || '%' OR
              LOWER(i.prenom_technicien) LIKE '%' || LOWER(e.prenom) || '%'
            ) AND (
              LOWER(e.nom) LIKE '%' || LOWER(i.nom_technicien) || '%' OR
              LOWER(i.nom_technicien) LIKE '%' || LOWER(e.nom) || '%'
            )
          ) OR (
            -- Correspondance par matricule si disponible
            e.matricule IS NOT NULL AND e.matricule != '' AND
            CONCAT('TECH_', UPPER(SUBSTRING(i.nom_technicien, 1, 3)), UPPER(SUBSTRING(i.prenom_technicien, 1, 2))) = e.matricule
          )
        )
        WHERE i.statut = 'CLOTURE TERMINEE'
          AND i.articles IS NOT NULL 
          AND i.articles != ''
          AND (
            (i.cloture_tech >= $1 OR i.cloture_hotline >= $1) OR
            (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND i.date_rdv >= $1)
          )
          AND (
            (i.cloture_tech <= $2 OR i.cloture_hotline <= $2) OR
            (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND i.date_rdv <= $2) OR
            (i.cloture_tech IS NULL AND i.cloture_hotline IS NOT NULL AND i.cloture_hotline::date <= $2::date) OR
            (i.cloture_hotline IS NULL AND i.cloture_tech IS NOT NULL AND i.cloture_tech::date <= $2::date)
          )
      )
      SELECT 
        employe_id,
        employe_nom,
        employe_prenom,
        matricule,
        COUNT(*) as nombre_interventions,
        SUM(recette_technicien) as total_recette_technicien
      FROM intervention_revenue
      GROUP BY employe_id, employe_nom, employe_prenom, matricule
      ORDER BY total_recette_technicien DESC
    `
    
    const beneficeBrutResult = await pool.query(beneficeBrutQuery, ['2025-05-01', '2025-05-31'])
    
    console.log(`📋 Bénéfice Brut: ${beneficeBrutResult.rows.length} techniciens trouvés:`)
    beneficeBrutResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.employe_nom} ${row.employe_prenom} (${row.matricule}) - ${row.total_recette_technicien}€`)
    })
    
    // 3. Comparer les deux
    console.log('\n🔍 Comparaison Charges par Salarié vs Bénéfice Brut:')
    
    const coutParSalaireMap = new Map()
    coutParSalaireResult.rows.forEach(row => {
      const key = `${row.nom}_${row.prenom}`.toLowerCase()
      coutParSalaireMap.set(key, row)
    })
    
    const beneficeBrutMap = new Map()
    beneficeBrutResult.rows.forEach(row => {
      const key = `${row.employe_nom}_${row.employe_prenom}`.toLowerCase()
      beneficeBrutMap.set(key, row)
    })
    
    console.log('\n📊 Comparaison détaillée:')
    let differences = 0
    for (const [key, beneficeRow] of beneficeBrutMap) {
      const coutRow = coutParSalaireMap.get(key)
      if (coutRow) {
        const beneficeTotal = parseFloat(beneficeRow.total_recette_technicien || 0)
        const coutTotal = parseFloat(coutRow.total_genere || 0)
        const diff = beneficeTotal - coutTotal
        
        if (Math.abs(diff) > 0.01) {
          console.log(`❌ ${beneficeRow.employe_nom} ${beneficeRow.employe_prenom}:`)
          console.log(`   - Bénéfice Brut: ${beneficeTotal}€`)
          console.log(`   - Charges par Salarié: ${coutTotal}€`)
          console.log(`   - Différence: ${diff}€`)
          differences++
        } else {
          console.log(`✅ ${beneficeRow.employe_nom} ${beneficeRow.employe_prenom}: ${beneficeTotal}€ (cohérent)`)
        }
      }
    }
    
    console.log(`\n📊 Résumé: ${differences} différences trouvées`)
    
    // 4. Synchroniser les données si nécessaire
    if (differences > 0) {
      console.log('\n🔄 Synchronisation des données...')
      
      for (const [key, beneficeRow] of beneficeBrutMap) {
        const coutRow = coutParSalaireMap.get(key)
        if (coutRow) {
          const beneficeTotal = parseFloat(beneficeRow.total_recette_technicien || 0)
          const coutTotal = parseFloat(coutRow.total_genere || 0)
          const diff = beneficeTotal - coutTotal
          
          if (Math.abs(diff) > 0.01) {
            console.log(`🔧 Synchronisation ${beneficeRow.employe_nom} ${beneficeRow.employe_prenom}: ${coutTotal}€ → ${beneficeTotal}€`)
            
            // Mettre à jour total_genere
            await pool.query(`
              UPDATE cout_par_salaire 
              SET total_genere = $1, updated_at = CURRENT_TIMESTAMP
              WHERE id = $2
            `, [beneficeTotal, coutRow.id])
            
            // Recalculer le RAP
            const rapResult = await pool.query(
              `SELECT calculer_rap_avec_paiements($1) as rap_actuel`,
              [coutRow.id]
            )
            const newRap = parseFloat(rapResult.rows[0].rap_actuel || 0)
            await pool.query(
              `UPDATE cout_par_salaire SET rap = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
              [newRap, coutRow.id]
            )
            
            console.log(`✅ Synchronisé: ${beneficeTotal}€ (RAP: ${newRap}€)`)
          }
        }
      }
    }
    
    // 5. Vérification finale
    console.log('\n✅ Vérification finale:')
    const finalCheck = await pool.query(`
      SELECT 
        nom, prenom, matricule, total_genere, rap
      FROM cout_par_salaire 
      WHERE mois = 5 AND annee = 2025
      ORDER BY total_genere DESC
    `)
    
    console.log(`📋 ${finalCheck.rows.length} techniciens après synchronisation:`)
    finalCheck.rows.forEach((row, index) => {
      if (row.total_genere > 0) {
        console.log(`${index + 1}. ${row.nom} ${row.prenom} (${row.matricule}) - ${row.total_genere}€`)
      }
    })
    
    console.log('\n🎯 Diagnostic terminé !')
    console.log('💡 Les données devraient maintenant être cohérentes entre les deux sections')
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error.message)
  } finally {
    await pool.end()
  }
}

debugChargesVsBenefice()
