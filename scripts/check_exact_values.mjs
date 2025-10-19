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

async function checkExactValues() {
  try {
    console.log('🔍 Vérification des valeurs exactes pour CHIKHA SALEM...')
    
    // 1. Vérifier la valeur actuelle dans cout_par_salaire
    console.log('\n📊 Valeur actuelle dans cout_par_salaire:')
    const coutResult = await pool.query(`
      SELECT 
        nom, prenom, matricule, mois, annee,
        total_genere, salaire_net, charge, taxe, rap, updated_at
      FROM cout_par_salaire 
      WHERE LOWER(nom) = LOWER('CHIKHA') AND LOWER(prenom) = LOWER('SALEM')
      AND mois = 5 AND annee = 2025
    `)
    
    if (coutResult.rows.length > 0) {
      const row = coutResult.rows[0]
      console.log(`✅ ${row.nom} ${row.prenom} (${row.matricule})`)
      console.log(`   - Total Généré: ${row.total_genere}€`)
      console.log(`   - Salaire Net: ${row.salaire_net}€`)
      console.log(`   - Charge: ${row.charge}€`)
      console.log(`   - Taxe: ${row.taxe}%`)
      console.log(`   - RAP: ${row.rap}€`)
      console.log(`   - Mis à jour le: ${row.updated_at}`)
    }
    
    // 2. Calculer la valeur réelle des interventions
    console.log('\n💰 Calcul des recettes réelles:')
    const realRevenue = await pool.query(`
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
    
    const realTotal = parseFloat(realRevenue.rows[0].total_recettes_reel) || 0
    console.log(`✅ Total recettes réelles: ${realTotal}€`)
    
    // 3. Comparer les valeurs
    if (coutResult.rows.length > 0) {
      const coutTotal = parseFloat(coutResult.rows[0].total_genere) || 0
      const difference = realTotal - coutTotal
      
      console.log('\n🔍 Comparaison:')
      console.log(`   - cout_par_salaire: ${coutTotal}€`)
      console.log(`   - Calcul réel: ${realTotal}€`)
      console.log(`   - Différence: ${difference}€`)
      
      if (Math.abs(difference) > 0.01) {
        console.log('❌ Les valeurs ne correspondent pas !')
        console.log('💡 Il faut synchroniser pour que les deux sections affichent la même valeur')
        
        // Synchroniser si nécessaire
        console.log('\n🔧 Synchronisation...')
        await pool.query(`
          UPDATE cout_par_salaire 
          SET 
            total_genere = $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE LOWER(nom) = LOWER('CHIKHA') AND LOWER(prenom) = LOWER('SALEM')
          AND mois = 5 AND annee = 2025
        `, [realTotal])
        
        console.log(`✅ Synchronisé: ${coutTotal}€ → ${realTotal}€`)
        
        // Vérifier après synchronisation
        const afterSync = await pool.query(`
          SELECT total_genere FROM cout_par_salaire 
          WHERE LOWER(nom) = LOWER('CHIKHA') AND LOWER(prenom) = LOWER('SALEM')
          AND mois = 5 AND annee = 2025
        `)
        
        if (afterSync.rows.length > 0) {
          const newTotal = parseFloat(afterSync.rows[0].total_genere) || 0
          console.log(`✅ Nouvelle valeur: ${newTotal}€`)
          console.log(`✅ Maintenant les deux sections devraient afficher ${newTotal}€`)
        }
        
      } else {
        console.log('✅ Les valeurs correspondent déjà')
      }
    }
    
    console.log('\n🎯 Vérification terminée !')
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message)
  } finally {
    await pool.end()
  }
}

checkExactValues()
