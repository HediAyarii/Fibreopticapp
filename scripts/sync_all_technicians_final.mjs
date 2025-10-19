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

async function syncAllTechniciansFinal() {
  try {
    console.log('🔄 Synchronisation finale de tous les techniciens...')
    console.log('📊 Objectif: Synchroniser tous les techniciens avec Bénéfice Brut')
    
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
    
    // 3. Synchroniser tous les techniciens
    console.log('\n🔄 Synchronisation de tous les techniciens...')
    
    let updatedCount = 0
    let createdCount = 0
    
    for (const beneficeRow of beneficeBrutResult.rows) {
      const totalGenere = parseFloat(beneficeRow.total_recette_technicien || 0)
      
      if (totalGenere > 0) {
        // Chercher le technicien correspondant dans cout_par_salaire
        const coutRow = coutParSalaireResult.rows.find(row => 
          row.nom.toLowerCase() === beneficeRow.employe_nom.toLowerCase() && 
          row.prenom.toLowerCase() === beneficeRow.employe_prenom.toLowerCase()
        )
        
        if (coutRow) {
          // Mettre à jour si nécessaire
          const currentTotal = parseFloat(coutRow.total_genere || 0)
          if (Math.abs(currentTotal - totalGenere) > 0.01) {
            console.log(`🔧 Mise à jour ${beneficeRow.employe_nom} ${beneficeRow.employe_prenom}: ${currentTotal}€ → ${totalGenere}€`)
            
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
          console.log(`❌ Technicien non trouvé dans cout_par_salaire: ${beneficeRow.employe_nom} ${beneficeRow.employe_prenom}`)
        }
      }
    }
    
    console.log(`\n📊 Synchronisation terminée: ${updatedCount} mis à jour`)
    
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
    
    // 5. Créer un script de test pour le navigateur
    console.log('\n📝 Script de test pour le navigateur:')
    const browserTestScript = `
// Script de test pour vérifier la synchronisation finale
// Exécuter dans la console du navigateur (F12)

console.log('🧪 Test de la synchronisation finale...')

fetch('/api/cout-par-salaire?mois=5&annee=2025')
  .then(response => response.json())
  .then(data => {
    console.log('📊 Données reçues:', data)
    
    if (data.success && data.couts) {
      const withRevenue = data.couts.filter(cout => cout.total_genere > 0)
      const withoutRevenue = data.couts.filter(cout => cout.total_genere === 0)
      
      console.log(\`📈 Techniciens avec revenus: \${withRevenue.length}\`)
      console.log(\`📉 Techniciens sans revenus: \${withoutRevenue.length}\`)
      
      if (withRevenue.length > 0) {
        console.log('✅ Synchronisation réussie!')
        console.log('💡 Les "Total Généré" devraient maintenant s\'afficher correctement')
        
        withRevenue.forEach(cout => {
          console.log(\`   - \${cout.nom} \${cout.prenom}: \${cout.total_genere}€\`)
        })
      } else {
        console.log('❌ Synchronisation échouée')
        console.log('💡 Le problème persiste')
      }
    } else {
      console.log('❌ Erreur API:', data.error)
    }
  })
  .catch(error => {
    console.error('❌ Erreur réseau:', error)
  })
`
    
    console.log('📄 Script de test créé')
    console.log('💡 Exécutez ce script dans la console du navigateur (F12)')
    
    console.log('\n🎯 Synchronisation finale terminée !')
    console.log('💡 Tous les techniciens devraient maintenant être synchronisés')
    console.log('💡 Rafraîchissez votre front-end pour voir les changements')
    
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation finale:', error.message)
  } finally {
    await pool.end()
  }
}

syncAllTechniciansFinal()
