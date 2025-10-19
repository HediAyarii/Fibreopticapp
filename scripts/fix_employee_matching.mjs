import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function fixEmployeeMatching() {
  console.log('🔧 Correction de la correspondance employé-interventions...')
  
  try {
    // 1. Vérifier tous les employés dans cout_par_salaire
    console.log('\n📋 1. Vérification des employés dans cout_par_salaire...')
    const couts = await pool.query(`
      SELECT id, nom, prenom, matricule, total_genere, rap
      FROM cout_par_salaire 
      WHERE nom LIKE '%BECHIR%' OR nom LIKE '%MOULAHI%' OR prenom LIKE '%MOHAMED%'
    `)
    
    console.log(`📊 ${couts.rows.length} employé(s) trouvé(s):`)
    couts.rows.forEach((cout, index) => {
      console.log(`  ${index + 1}. ${cout.nom} ${cout.prenom} (${cout.matricule})`)
      console.log(`     - Total Généré: ${cout.total_genere}€`)
      console.log(`     - RAP: ${cout.rap}€`)
    })
    
    // 2. Chercher les interventions pour "Mohamed-Bechir MOULAHI"
    console.log('\n📋 2. Recherche des interventions pour Mohamed-Bechir MOULAHI...')
    const interventions = await pool.query(`
      SELECT 
        id, num_inter, client, date_rdv, prenom_technicien, nom_technicien,
        articles, statut, type_intervention, cloture_tech, cloture_hotline
      FROM interventions 
      WHERE prenom_technicien = 'Mohamed-Bechir' AND nom_technicien = 'MOULAHI'
      AND statut = 'CLOTURE TERMINEE'
      ORDER BY date_rdv DESC
      LIMIT 3
    `)
    
    console.log(`✅ ${interventions.rows.length} interventions trouvées`)
    if (interventions.rows.length > 0) {
      console.log('\n📊 Détails des interventions:')
      interventions.rows.forEach((inter, index) => {
        console.log(`  ${index + 1}. ${inter.num_inter} - ${inter.client}`)
        console.log(`     Date: ${inter.date_rdv}`)
        console.log(`     Articles: ${inter.articles}`)
        console.log(`     Type: ${inter.type_intervention}`)
      })
    }
    
    // 3. Calculer le revenu pour ces interventions
    console.log('\n📋 3. Calcul du revenu...')
    if (interventions.rows.length > 0) {
      const revenueQuery = `
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
          ) as total_recette_technicien,
          COUNT(*) as nombre_interventions
        FROM interventions i
        WHERE i.prenom_technicien = 'Mohamed-Bechir' 
          AND i.nom_technicien = 'MOULAHI'
          AND i.statut = 'CLOTURE TERMINEE'
          AND i.articles IS NOT NULL 
          AND i.articles != ''
      `
      
      const revenueResult = await pool.query(revenueQuery)
      const revenue = revenueResult.rows[0]
      
      console.log(`✅ Revenu calculé: ${revenue.total_recette_technicien}€ (${revenue.nombre_interventions} interventions)`)
      
      // 4. Mettre à jour le cout_par_salaire correspondant
      if (couts.rows.length > 0) {
        const cout = couts.rows[0] // Prendre le premier trouvé
        
        console.log(`\n📋 4. Mise à jour du cout_par_salaire...`)
        console.log(`Employé: ${cout.nom} ${cout.prenom} (ID: ${cout.id})`)
        
        // Mettre à jour le total_genere
        await pool.query(`
          UPDATE cout_par_salaire 
          SET 
            total_genere = $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [revenue.total_recette_technicien, cout.id])
        
        console.log(`✅ Total généré mis à jour: ${revenue.total_recette_technicien}€`)
        
        // Recalculer le RAP
        const rapResult = await pool.query(`
          SELECT calculer_rap_avec_paiements($1) as rap_actuel
        `, [cout.id])
        
        const rapActuel = rapResult.rows[0].rap_actuel
        console.log(`✅ RAP recalculé: ${rapActuel}€`)
        
        // Vérifier le calcul manuel
        const salaireNet = 1406.34
        const charge = 456.59
        const taxe = 50
        const totalGenere = parseFloat(revenue.total_recette_technicien) || 0
        
        let rapManuel = 0
        if (Math.abs(taxe - 50) < 0.01) {
          rapManuel = totalGenere - salaireNet + (0.5 * charge)
        }
        
        console.log(`\n🧮 Vérification manuelle:`)
        console.log(`  - Total Généré: ${totalGenere}€`)
        console.log(`  - Salaire Net: ${salaireNet}€`)
        console.log(`  - Charge: ${charge}€`)
        console.log(`  - Taxe: ${taxe}%`)
        console.log(`  - RAP calculé: ${rapManuel}€`)
        console.log(`  - RAP DB: ${rapActuel}€`)
        
        if (Math.abs(rapManuel - rapActuel) < 0.01) {
          console.log('✅ Le calcul est correct !')
        } else {
          console.log('❌ Il y a encore un problème dans le calcul')
        }
      }
    }
    
    console.log('\n🎯 Correction terminée !')
    console.log('📋 Le Total Généré et le RAP ont été mis à jour')
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error.message)
  } finally {
    await pool.end()
  }
}

fixEmployeeMatching()






