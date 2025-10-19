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

async function checkChikhaSalemMay() {
  try {
    console.log('🔍 Recherche des informations pour CHIKHA SALEM - Mai 2025...')
    
    // 1. Vérifier dans cout_par_salaire
    console.log('\n📊 Données dans cout_par_salaire:')
    const coutResult = await pool.query(`
      SELECT 
        nom, prenom, matricule, mois, annee,
        total_genere, salaire_net, salaire_brut, charge, cout_total, taxe, rap
      FROM cout_par_salaire 
      WHERE LOWER(nom) = LOWER('CHIKHA') AND LOWER(prenom) = LOWER('SALEM')
      AND mois = 5 AND annee = 2025
    `)
    
    if (coutResult.rows.length > 0) {
      const row = coutResult.rows[0]
      console.log(`✅ Trouvé: ${row.nom} ${row.prenom} (${row.matricule})`)
      console.log(`   - Mois/Année: ${row.mois}/${row.annee}`)
      console.log(`   - Total Généré: ${row.total_genere}€`)
      console.log(`   - Salaire Net: ${row.salaire_net}€`)
      console.log(`   - Salaire Brut: ${row.salaire_brut}€`)
      console.log(`   - Charge: ${row.charge}€`)
      console.log(`   - Coût Total: ${row.cout_total}€`)
      console.log(`   - Taxe: ${row.taxe}%`)
      console.log(`   - RAP: ${row.rap}€`)
    } else {
      console.log('❌ CHIKHA SALEM non trouvé dans cout_par_salaire pour mai 2025')
    }
    
    // 2. Vérifier dans employes
    console.log('\n👤 Données dans employes:')
    const employeResult = await pool.query(`
      SELECT 
        nom, prenom, matricule, created_at
      FROM employes 
      WHERE LOWER(nom) = LOWER('CHIKHA') AND LOWER(prenom) = LOWER('SALEM')
    `)
    
    if (employeResult.rows.length > 0) {
      const row = employeResult.rows[0]
      console.log(`✅ Employé trouvé: ${row.nom} ${row.prenom} (${row.matricule})`)
      console.log(`   - Créé le: ${row.created_at}`)
    } else {
      console.log('❌ CHIKHA SALEM non trouvé dans employes')
    }
    
    // 3. Vérifier les interventions pour mai 2025
    console.log('\n🔧 Interventions pour mai 2025:')
    const interventionResult = await pool.query(`
      SELECT 
        COUNT(*) as total_interventions,
        SUM(CASE WHEN statut = 'CLOTURE TERMINEE' THEN 1 ELSE 0 END) as interventions_terminees
      FROM interventions 
      WHERE LOWER(nom_technicien) = LOWER('CHIKHA') AND LOWER(prenom_technicien) = LOWER('SALEM')
      AND (
        (date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' AND TO_DATE(date_rdv, 'DD.MM.YYYY') >= '2025-05-01' AND TO_DATE(date_rdv, 'DD.MM.YYYY') <= '2025-05-31')
        OR (date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND date_rdv::date >= '2025-05-01' AND date_rdv::date <= '2025-05-31')
        OR (date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' AND TO_DATE(date_rdv, 'DD/MM/YYYY') >= '2025-05-01' AND TO_DATE(date_rdv, 'DD/MM/YYYY') <= '2025-05-31')
      )
    `)
    
    if (interventionResult.rows.length > 0) {
      const row = interventionResult.rows[0]
      console.log(`✅ Interventions trouvées: ${row.total_interventions}`)
      console.log(`   - Terminées: ${row.interventions_terminees}`)
    } else {
      console.log('❌ Aucune intervention trouvée pour mai 2025')
    }
    
    // 4. Calculer les recettes générées
    console.log('\n💰 Calcul des recettes générées:')
    const revenueResult = await pool.query(`
      SELECT 
        COUNT(*) as nombre_interventions,
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
        ) as recettes_technicien
      FROM interventions i
      WHERE LOWER(i.nom_technicien) = LOWER('CHIKHA') AND LOWER(i.prenom_technicien) = LOWER('SALEM')
      AND (
        (i.date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' AND TO_DATE(i.date_rdv, 'DD.MM.YYYY') >= '2025-05-01' AND TO_DATE(i.date_rdv, 'DD.MM.YYYY') <= '2025-05-31')
        OR (i.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND i.date_rdv::date >= '2025-05-01' AND i.date_rdv::date <= '2025-05-31')
        OR (i.date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') >= '2025-05-01' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') <= '2025-05-31')
      )
    `)
    
    if (revenueResult.rows.length > 0) {
      const row = revenueResult.rows[0]
      console.log(`✅ Recettes calculées:`)
      console.log(`   - Nombre d'interventions: ${row.nombre_interventions}`)
      console.log(`   - Recettes technicien: ${row.recettes_technicien || 0}€`)
    }
    
    console.log('\n🎯 Recherche terminée !')
    
  } catch (error) {
    console.error('❌ Erreur lors de la recherche:', error.message)
  } finally {
    await pool.end()
  }
}

checkChikhaSalemMay()
