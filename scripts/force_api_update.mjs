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

async function forceApiUpdate() {
  try {
    console.log('🔄 Forçage de la mise à jour de l\'API...')
    console.log('📊 Objectif: Résoudre le problème "Total Généré = 0"')
    
    // 1. Vérifier l'état actuel de l'API
    console.log('\n✅ Vérification de l\'état actuel:')
    const currentState = await pool.query(`
      SELECT 
        nom, prenom, matricule, total_genere, rap
      FROM cout_par_salaire 
      WHERE mois = 5 AND annee = 2025
      ORDER BY total_genere DESC
    `)
    
    console.log(`📋 ${currentState.rows.length} techniciens dans la base:`)
    currentState.rows.forEach((row, index) => {
      if (row.total_genere > 0) {
        console.log(`${index + 1}. ${row.nom} ${row.prenom} (${row.matricule}) - ${row.total_genere}€`)
      }
    })
    
    // 2. Forcer la mise à jour de tous les revenus
    console.log('\n🔧 Mise à jour des revenus...')
    
    // Calculer les revenus en temps réel pour tous les techniciens
    const revenueUpdate = await pool.query(`
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
    `, ['2025-05-01', '2025-05-31'])
    
    console.log(`📊 ${revenueUpdate.rows.length} techniciens avec revenus calculés:`)
    revenueUpdate.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.employe_nom} ${row.employe_prenom} (${row.matricule}) - ${row.total_recette_technicien}€`)
    })
    
    // 3. Mettre à jour la table cout_par_salaire
    console.log('\n🔧 Mise à jour de la table cout_par_salaire...')
    
    for (const row of revenueUpdate.rows) {
      if (row.total_recette_technicien > 0) {
        // Mettre à jour total_genere
        await pool.query(`
          UPDATE cout_par_salaire 
          SET total_genere = $1, updated_at = CURRENT_TIMESTAMP
          WHERE LOWER(nom) = LOWER($2) AND LOWER(prenom) = LOWER($3) AND mois = 5 AND annee = 2025
        `, [row.total_recette_technicien, row.employe_nom, row.employe_prenom])
        
        // Recalculer le RAP
        const coutEntry = await pool.query(`
          SELECT id FROM cout_par_salaire 
          WHERE LOWER(nom) = LOWER($1) AND LOWER(prenom) = LOWER($2) AND mois = 5 AND annee = 2025
        `, [row.employe_nom, row.employe_prenom])
        
        if (coutEntry.rows.length > 0) {
          const rapResult = await pool.query(
            `SELECT calculer_rap_avec_paiements($1) as rap_actuel`,
            [coutEntry.rows[0].id]
          )
          const newRap = parseFloat(rapResult.rows[0].rap_actuel || 0)
          await pool.query(
            `UPDATE cout_par_salaire SET rap = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [newRap, coutEntry.rows[0].id]
          )
        }
      }
    }
    
    console.log('✅ Mise à jour terminée')
    
    // 4. Vérifier la mise à jour
    console.log('\n✅ Vérification de la mise à jour:')
    const updatedState = await pool.query(`
      SELECT 
        nom, prenom, matricule, total_genere, rap
      FROM cout_par_salaire 
      WHERE mois = 5 AND annee = 2025
      ORDER BY total_genere DESC
    `)
    
    console.log(`📋 ${updatedState.rows.length} techniciens après mise à jour:`)
    updatedState.rows.forEach((row, index) => {
      if (row.total_genere > 0) {
        console.log(`${index + 1}. ${row.nom} ${row.prenom} (${row.matricule}) - ${row.total_genere}€`)
      }
    })
    
    // 5. Créer un script de test pour le navigateur
    console.log('\n📝 Script de test pour le navigateur:')
    const browserTestScript = `
// Script de test pour vérifier l'API mise à jour
// Exécuter dans la console du navigateur (F12)

console.log('🧪 Test de l\'API cout-par-salaire mise à jour...')

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
        console.log('✅ L\'API fonctionne correctement!')
        console.log('💡 Les "Total Généré" devraient maintenant s\'afficher correctement')
        
        withRevenue.forEach(cout => {
          console.log(\`   - \${cout.nom} \${cout.prenom}: \${cout.total_genere}€\`)
        })
      } else {
        console.log('❌ L\'API ne retourne toujours aucun revenu')
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
    
    console.log('\n🎯 Mise à jour terminée !')
    console.log('💡 L\'API devrait maintenant fonctionner correctement')
    console.log('💡 Rafraîchissez votre front-end pour voir les changements')
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error.message)
  } finally {
    await pool.end()
  }
}

forceApiUpdate()
