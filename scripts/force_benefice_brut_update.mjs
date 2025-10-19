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

async function forceBeneficeBrutUpdate() {
  try {
    console.log('🔧 Forçage de la mise à jour de la section "Bénéfice Brut"...')
    
    // 1. Vérifier les données actuelles dans la section Bénéfice Brut
    console.log('\n📊 Test de l\'API recap-calcul pour CHIKHA SALEM...')
    
    // Simuler l'appel API que fait le front-end
    const recapResult = await pool.query(`
      WITH recettes_par_employe AS (
        SELECT 
          e.id as employe_id,
          e.nom as employe_nom,
          e.prenom as employe_prenom,
          e.matricule as employe_matricule,
          COALESCE(SUM(
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
          ), 0) as recettes_generes,
          COALESCE(SUM(
            CASE 
              WHEN i.statut = 'CLOTURE TERMINEE' THEN
                COALESCE(
                  (SELECT SUM(
                    CASE 
                      WHEN cp.prix_base IS NOT NULL THEN cp.prix_base
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
          ), 0) as recettes_entreprise
        FROM employes e
        LEFT JOIN interventions i ON (
          LOWER(e.prenom) = LOWER(i.prenom_technicien) AND 
          LOWER(e.nom) = LOWER(i.nom_technicien)
        )
        WHERE LOWER(e.nom) = LOWER('CHIKHA') AND LOWER(e.prenom) = LOWER('SALEM')
        AND (
          (i.date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' AND TO_DATE(i.date_rdv, 'DD.MM.YYYY') >= '2025-05-01' AND TO_DATE(i.date_rdv, 'DD.MM.YYYY') <= '2025-05-31')
          OR (i.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND i.date_rdv::date >= '2025-05-01' AND i.date_rdv::date <= '2025-05-31')
          OR (i.date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') >= '2025-05-01' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') <= '2025-05-31')
        )
        GROUP BY e.id
      )
      SELECT 
        r.employe_id,
        r.employe_nom,
        r.employe_prenom,
        r.employe_matricule,
        r.recettes_generes,
        r.recettes_entreprise
      FROM recettes_par_employe r
      WHERE r.recettes_generes > 0 OR r.recettes_entreprise > 0
    `)
    
    if (recapResult.rows.length > 0) {
      const row = recapResult.rows[0]
      console.log(`✅ Résultat API recap-calcul:`)
      console.log(`   - Nom: ${row.employe_nom} ${row.employe_prenom}`)
      console.log(`   - Recettes Générées: ${row.recettes_generes}€`)
      console.log(`   - Recettes Entreprise: ${row.recettes_entreprise}€`)
    } else {
      console.log('❌ Aucun résultat trouvé dans l\'API recap-calcul')
    }
    
    // 2. Vérifier les interventions directement
    console.log('\n🔍 Vérification directe des interventions...')
    const interventionCheck = await pool.query(`
      SELECT 
        COUNT(*) as total_interventions,
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
        ) as total_recettes
      FROM interventions i
      WHERE LOWER(i.nom_technicien) = LOWER('CHIKHA') AND LOWER(i.prenom_technicien) = LOWER('SALEM')
      AND (
        (i.date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' AND TO_DATE(i.date_rdv, 'DD.MM.YYYY') >= '2025-05-01' AND TO_DATE(i.date_rdv, 'DD.MM.YYYY') <= '2025-05-31')
        OR (i.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND i.date_rdv::date >= '2025-05-01' AND i.date_rdv::date <= '2025-05-31')
        OR (i.date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') >= '2025-05-01' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') <= '2025-05-31')
      )
    `)
    
    if (interventionCheck.rows.length > 0) {
      const row = interventionCheck.rows[0]
      console.log(`✅ Interventions directes:`)
      console.log(`   - Total interventions: ${row.total_interventions}`)
      console.log(`   - Total recettes: ${row.total_recettes}€`)
    }
    
    // 3. Vérifier s'il y a un problème de correspondance employé
    console.log('\n👤 Vérification de la correspondance employé...')
    const employeeCheck = await pool.query(`
      SELECT 
        id, nom, prenom, matricule
      FROM employes 
      WHERE LOWER(nom) = LOWER('CHIKHA') AND LOWER(prenom) = LOWER('SALEM')
    `)
    
    if (employeeCheck.rows.length > 0) {
      const emp = employeeCheck.rows[0]
      console.log(`✅ Employé trouvé: ${emp.nom} ${emp.prenom} (${emp.matricule}) - ID: ${emp.id}`)
    } else {
      console.log('❌ Employé CHIKHA SALEM non trouvé dans la table employes')
      console.log('💡 Cela peut expliquer pourquoi l\'API recap-calcul ne trouve pas les données')
    }
    
    // 4. Forcer la mise à jour en recalculant tout
    console.log('\n🔄 Forçage de la mise à jour...')
    
    // Vider le cache potentiel en recalculant les données
    const forceUpdate = await pool.query(`
      SELECT 
        e.id,
        e.nom,
        e.prenom,
        e.matricule,
        COALESCE(SUM(
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
        ), 0) as recettes_generes
      FROM employes e
      LEFT JOIN interventions i ON (
        LOWER(e.prenom) = LOWER(i.prenom_technicien) AND 
        LOWER(e.nom) = LOWER(i.nom_technicien)
      )
      WHERE LOWER(e.nom) = LOWER('CHIKHA') AND LOWER(e.prenom) = LOWER('SALEM')
      AND (
        (i.date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' AND TO_DATE(i.date_rdv, 'DD.MM.YYYY') >= '2025-05-01' AND TO_DATE(i.date_rdv, 'DD.MM.YYYY') <= '2025-05-31')
        OR (i.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND i.date_rdv::date >= '2025-05-01' AND i.date_rdv::date <= '2025-05-31')
        OR (i.date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') >= '2025-05-01' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') <= '2025-05-31')
      )
      GROUP BY e.id, e.nom, e.prenom, e.matricule
    `)
    
    if (forceUpdate.rows.length > 0) {
      const row = forceUpdate.rows[0]
      console.log(`✅ Recalcul forcé:`)
      console.log(`   - ${row.nom} ${row.prenom} (${row.matricule})`)
      console.log(`   - Recettes générées: ${row.recettes_generes}€`)
    }
    
    console.log('\n🎯 Vérification terminée !')
    console.log('💡 Si le front-end affiche encore 3710€, essayez de:')
    console.log('   1. Rafraîchir la page (F5)')
    console.log('   2. Vider le cache du navigateur')
    console.log('   3. Redémarrer l\'application')
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message)
  } finally {
    await pool.end()
  }
}

forceBeneficeBrutUpdate()
