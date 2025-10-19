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

// Fonction de normalisation des noms
function normalizeName(name) {
  return name?.toLowerCase()
    .replace(/[-\s]/g, '') // Supprimer tirets et espaces
    .replace(/ben/g, '') // Supprimer "ben" 
    .replace(/bou/g, '') // Supprimer "bou"
    .trim() || ''
}

// Fonction de correspondance intelligente
function findMatchingTechnician(beneficeRow, coutRows) {
  const beneficeNom = normalizeName(beneficeRow.employe_nom)
  const beneficePrenom = normalizeName(beneficeRow.employe_prenom)
  
  for (const coutRow of coutRows) {
    const coutNom = normalizeName(coutRow.nom)
    const coutPrenom = normalizeName(coutRow.prenom)
    
    // Correspondance exacte
    if (beneficeNom === coutNom && beneficePrenom === coutPrenom) {
      return coutRow
    }
    
    // Correspondance inversée
    if (beneficeNom === coutPrenom && beneficePrenom === coutNom) {
      return coutRow
    }
    
    // Correspondance partielle - nom contient ou est contenu
    const nomMatch = beneficeNom.includes(coutNom) || coutNom.includes(beneficeNom) || 
                     beneficeNom.includes(coutPrenom) || coutPrenom.includes(beneficeNom)
    const prenomMatch = beneficePrenom.includes(coutPrenom) || coutPrenom.includes(beneficePrenom) ||
                       beneficePrenom.includes(coutNom) || coutNom.includes(beneficePrenom)
    
    if (nomMatch && prenomMatch) {
      return coutRow
    }
    
    // Correspondance avec tirets (ex: Mohamed-Bechir vs BECHIRMOULAHI)
    const beneficeNomClean = beneficeNom.replace(/-/g, '')
    const coutNomClean = coutNom.replace(/-/g, '')
    const beneficePrenomClean = beneficePrenom.replace(/-/g, '')
    const coutPrenomClean = coutPrenom.replace(/-/g, '')
    
    if (beneficeNomClean.includes(coutNomClean) && beneficePrenomClean.includes(coutPrenomClean)) {
      return coutRow
    }
    if (beneficeNomClean.includes(coutPrenomClean) && beneficePrenomClean.includes(coutNomClean)) {
      return coutRow
    }
  }
  
  return null
}

async function syncWithSmartMatching() {
  try {
    console.log('🔄 Synchronisation avec correspondance intelligente...')
    console.log('📊 Objectif: Synchroniser tous les techniciens avec correspondance intelligente des noms')
    
    // 1. Récupérer les données de Bénéfice Brut
    console.log('\n📊 Récupération des données de Bénéfice Brut...')
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
    
    // 2. Récupérer tous les techniciens dans cout_par_salaire
    console.log('\n📊 Techniciens dans cout_par_salaire:')
    const coutParSalaireResult = await pool.query(`
      SELECT 
        id, nom, prenom, matricule, total_genere, rap
      FROM cout_par_salaire 
      WHERE mois = 5 AND annee = 2025
      ORDER BY total_genere DESC
    `)
    
    console.log(`📋 ${coutParSalaireResult.rows.length} techniciens dans cout_par_salaire:`)
    coutParSalaireResult.rows.forEach((row, index) => {
      const status = row.total_genere > 0 ? '✅' : '❌'
      console.log(`${index + 1}. ${status} ${row.nom} ${row.prenom} (${row.matricule}) - ${row.total_genere}€`)
    })
    
    // 3. Synchroniser avec correspondance intelligente
    console.log('\n🔄 Synchronisation avec correspondance intelligente...')
    
    let updatedCount = 0
    let matchedCount = 0
    let unmatchedCount = 0
    
    for (const beneficeRow of beneficeBrutResult.rows) {
      const totalGenere = parseFloat(beneficeRow.total_recette_technicien || 0)
      
      if (totalGenere > 0) {
        // Chercher le technicien correspondant avec correspondance intelligente
        const coutRow = findMatchingTechnician(beneficeRow, coutParSalaireResult.rows)
        
        if (coutRow) {
          console.log(`✅ Correspondance trouvée: ${beneficeRow.employe_nom} ${beneficeRow.employe_prenom} → ${coutRow.nom} ${coutRow.prenom}`)
          matchedCount++
          
          // Mettre à jour si nécessaire
          const currentTotal = parseFloat(coutRow.total_genere || 0)
          if (Math.abs(currentTotal - totalGenere) > 0.01) {
            console.log(`🔧 Mise à jour: ${currentTotal}€ → ${totalGenere}€`)
            
            // Mettre à jour total_genere
            await pool.query(`
              UPDATE cout_par_salaire 
              SET total_genere = $1, updated_at = CURRENT_TIMESTAMP
              WHERE id = $2
            `, [totalGenere, coutRow.id])
            
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
            
            console.log(`✅ Mis à jour: ${totalGenere}€ (RAP: ${newRap}€)`)
            updatedCount++
          } else {
            console.log(`✅ ${beneficeRow.employe_nom} ${beneficeRow.employe_prenom}: ${totalGenere}€ (déjà à jour)`)
          }
        } else {
          console.log(`❌ Aucune correspondance trouvée pour: ${beneficeRow.employe_nom} ${beneficeRow.employe_prenom}`)
          unmatchedCount++
        }
      }
    }
    
    console.log(`\n📊 Synchronisation terminée:`)
    console.log(`   - Correspondances trouvées: ${matchedCount}`)
    console.log(`   - Mis à jour: ${updatedCount}`)
    console.log(`   - Non trouvés: ${unmatchedCount}`)
    
    // 4. Vérification finale
    console.log('\n✅ Vérification finale:')
    const finalResult = await pool.query(`
      SELECT 
        nom, prenom, matricule, total_genere, rap
      FROM cout_par_salaire 
      WHERE mois = 5 AND annee = 2025
      ORDER BY total_genere DESC
    `)
    
    const withRevenue = finalResult.rows.filter(row => row.total_genere > 0)
    const withoutRevenue = finalResult.rows.filter(row => row.total_genere === 0)
    
    console.log(`📋 ${finalResult.rows.length} techniciens après synchronisation:`)
    console.log(`📈 Avec revenus: ${withRevenue.length}`)
    console.log(`📉 Sans revenus: ${withoutRevenue.length}`)
    
    withRevenue.forEach((row, index) => {
      console.log(`${index + 1}. ${row.nom} ${row.prenom} (${row.matricule}) - ${row.total_genere}€`)
    })
    
    if (withoutRevenue.length > 0) {
      console.log('\n📋 Techniciens sans revenus:')
      withoutRevenue.forEach((row, index) => {
        console.log(`${index + 1}. ${row.nom} ${row.prenom} (${row.matricule}) - ${row.total_genere}€`)
      })
    }
    
    console.log('\n🎯 Synchronisation avec correspondance intelligente terminée !')
    console.log('💡 Tous les techniciens devraient maintenant être synchronisés')
    console.log('💡 Rafraîchissez votre front-end pour voir les changements')
    
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error.message)
  } finally {
    await pool.end()
  }
}

syncWithSmartMatching()
