import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function fixNameMatching() {
  console.log('🔧 Correction de la correspondance des noms...')
  
  try {
    // 1. Vérifier les variations de noms trouvées
    console.log('\n📋 1. Analyse des variations de noms...')
    const variations = await pool.query(`
      SELECT DISTINCT nom_technicien, prenom_technicien, COUNT(*) as count
      FROM interventions 
      WHERE (
        LOWER(nom_technicien) LIKE '%bechir%' 
        OR LOWER(nom_technicien) LIKE '%moulahi%'
        OR LOWER(prenom_technicien) LIKE '%mohamed%'
      )
      AND statut = 'CLOTURE TERMINEE'
      GROUP BY nom_technicien, prenom_technicien
      ORDER BY count DESC
    `)
    
    console.log(`📊 ${variations.rows.length} variations trouvées:`)
    variations.rows.forEach((var_, index) => {
      console.log(`  ${index + 1}. "${var_.prenom_technicien} ${var_.nom_technicien}" (${var_.count} interventions)`)
    })
    
    // 2. Créer une fonction de normalisation des noms améliorée
    console.log('\n📋 2. Création d\'une fonction de correspondance améliorée...')
    await pool.query(`
      CREATE OR REPLACE FUNCTION normalize_name_for_matching(name TEXT) 
      RETURNS TEXT AS $$
      BEGIN
        RETURN LOWER(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              REGEXP_REPLACE(
                REGEXP_REPLACE(
                  REGEXP_REPLACE(COALESCE(name, ''), '[^a-zA-Z0-9]', '', 'g'),
                  'ben', '', 'g'
                ),
                'bou', '', 'g'
              ),
              'mohamed', 'mohamed', 'g'
            ),
            'bechir', 'bechir', 'g'
          )
        );
      END;
      $$ LANGUAGE plpgsql;
    `)
    console.log('✅ Fonction de normalisation créée')
    
    // 3. Tester la correspondance avec la nouvelle fonction
    console.log('\n📋 3. Test de correspondance améliorée...')
    
    // Récupérer l'employé BECHIRMOULAHI MOHAMED
    const employe = await pool.query(`
      SELECT id, nom, prenom, matricule
      FROM employes 
      WHERE nom = 'BECHIRMOULAHI' AND prenom = 'MOHAMED'
    `)
    
    if (employe.rows.length > 0) {
      const emp = employe.rows[0]
      console.log(`✅ Employé trouvé: ${emp.nom} ${emp.prenom} (${emp.matricule})`)
      
      // Normaliser le nom de l'employé
      const empNormalized = await pool.query(`
        SELECT normalize_name_for_matching($1) as nom_norm, normalize_name_for_matching($2) as prenom_norm
      `, [emp.nom, emp.prenom])
      
      const empNomNorm = empNormalized.rows[0].nom_norm
      const empPrenomNorm = empNormalized.rows[0].prenom_norm
      
      console.log(`📝 Nom normalisé: "${empNomNorm}" "${empPrenomNorm}"`)
      
      // Chercher les interventions avec correspondance améliorée
      const interventions = await pool.query(`
        SELECT 
          i.id, i.num_inter, i.prenom_technicien, i.nom_technicien,
          normalize_name_for_matching(i.prenom_technicien) as prenom_norm,
          normalize_name_for_matching(i.nom_technicien) as nom_norm,
          i.articles, i.statut, i.type_intervention
        FROM interventions i
        WHERE i.statut = 'CLOTURE TERMINEE'
        AND (
          normalize_name_for_matching(i.prenom_technicien) = $1 
          AND normalize_name_for_matching(i.nom_technicien) = $2
        )
        ORDER BY i.date_rdv DESC
        LIMIT 5
      `, [empPrenomNorm, empNomNorm])
      
      console.log(`✅ ${interventions.rows.length} interventions trouvées avec correspondance améliorée`)
      
      if (interventions.rows.length > 0) {
        console.log('\n📊 Détails des interventions:')
        interventions.rows.forEach((inter, index) => {
          console.log(`  ${index + 1}. ${inter.num_inter} - ${inter.prenom_technicien} ${inter.nom_technicien}`)
          console.log(`     Normalisé: "${inter.prenom_norm}" "${inter.nom_norm}"`)
          console.log(`     Articles: ${inter.articles}`)
        })
        
        // 4. Mettre à jour l'API cout-par-salaire pour utiliser la correspondance améliorée
        console.log('\n📋 4. Mise à jour de l\'API cout-par-salaire...')
        
        // Tester le calcul de revenu avec la nouvelle logique
        const revenueTest = await pool.query(`
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
              -- Correspondance améliorée
              COALESCE(e.id, -1) as employe_id,
              COALESCE(e.nom, i.nom_technicien) as employe_nom,
              COALESCE(e.prenom, i.prenom_technicien) as employe_prenom,
              COALESCE(e.matricule, CONCAT('TECH_', UPPER(SUBSTRING(i.nom_technicien, 1, 3)), UPPER(SUBSTRING(i.prenom_technicien, 1, 2)))) as matricule,
              -- Calculer les recettes
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
              normalize_name_for_matching(e.prenom) = normalize_name_for_matching(i.prenom_technicien) AND 
              normalize_name_for_matching(e.nom) = normalize_name_for_matching(i.nom_technicien)
            )
            WHERE i.statut = 'CLOTURE TERMINEE'
              AND i.articles IS NOT NULL 
              AND i.articles != ''
          )
          SELECT 
            employe_id,
            employe_nom,
            employe_prenom,
            matricule,
            COUNT(*) as nombre_interventions,
            SUM(recette_technicien) as total_recette_technicien
          FROM intervention_revenue
          WHERE employe_id = $1
          GROUP BY employe_id, employe_nom, employe_prenom, matricule
        `, [emp.id])
        
        if (revenueTest.rows.length > 0) {
          const revenue = revenueTest.rows[0]
          console.log(`✅ Revenu calculé: ${revenue.total_recette_technicien}€ (${revenue.nombre_interventions} interventions)`)
          
          // Mettre à jour le total_genere dans cout_par_salaire
          await pool.query(`
            UPDATE cout_par_salaire 
            SET 
              total_genere = $1,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [revenue.total_recette_technicien, emp.id])
          
          console.log(`✅ Total généré mis à jour: ${revenue.total_recette_technicien}€`)
          
          // Recalculer le RAP
          const rapResult = await pool.query(`
            SELECT calculer_rap_avec_paiements($1) as rap_actuel
          `, [emp.id])
          
          console.log(`✅ RAP recalculé: ${rapResult.rows[0].rap_actuel}€`)
        }
      }
    }
    
    console.log('\n🎯 Correction de la correspondance terminée !')
    console.log('📋 La correspondance des noms est maintenant améliorée')
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error.message)
  } finally {
    await pool.end()
  }
}

fixNameMatching()





