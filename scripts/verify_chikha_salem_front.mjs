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

async function verifyChikhaSalemFront() {
  try {
    console.log('🔍 Vérification de CHIKHA SALEM dans le front-end...')
    
    // 1. Vérifier les données dans cout_par_salaire (ce que voit le front)
    console.log('\n📊 Données dans cout_par_salaire (Front-end):')
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
      console.log(`✅ Données front-end: ${row.nom} ${row.prenom} (${row.matricule})`)
      console.log(`   - Mois/Année: ${row.mois}/${row.annee}`)
      console.log(`   - Total Généré (Front): ${row.total_genere}€`)
      console.log(`   - Salaire Net: ${row.salaire_net}€`)
      console.log(`   - Charge: ${row.charge}€`)
      console.log(`   - Taxe: ${row.taxe}%`)
      console.log(`   - RAP: ${row.rap}€`)
    } else {
      console.log('❌ CHIKHA SALEM non trouvé dans cout_par_salaire')
    }
    
    // 2. Calculer les recettes réelles (ce qui devrait être affiché)
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
    
    // 3. Comparer les deux valeurs
    if (coutResult.rows.length > 0) {
      const frontTotal = parseFloat(coutResult.rows[0].total_genere) || 0
      const difference = Math.abs(frontTotal - realTotal)
      
      console.log('\n🔍 Comparaison:')
      console.log(`   - Front-end (cout_par_salaire): ${frontTotal}€`)
      console.log(`   - Calcul réel (interventions): ${realTotal}€`)
      console.log(`   - Différence: ${difference.toFixed(2)}€`)
      
      if (difference < 0.01) {
        console.log('✅ PARFAIT ! Les deux valeurs sont identiques')
        console.log('✅ Le front-end affiche la bonne valeur')
      } else {
        console.log('❌ PROBLÈME ! Les valeurs ne correspondent pas')
        console.log('❌ Il faut synchroniser les données')
        
        // Proposer une synchronisation
        console.log('\n🔧 Synchronisation recommandée...')
        await pool.query(`
          UPDATE cout_par_salaire 
          SET 
            total_genere = $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE LOWER(nom) = LOWER('CHIKHA') AND LOWER(prenom) = LOWER('SALEM')
          AND mois = 5 AND annee = 2025
        `, [realTotal])
        
        console.log(`✅ Synchronisé: ${frontTotal}€ → ${realTotal}€`)
      }
    }
    
    // 4. Vérifier le RAP avec la nouvelle formule
    console.log('\n🧮 Vérification du RAP:')
    if (coutResult.rows.length > 0) {
      const row = coutResult.rows[0]
      const totalGenere = parseFloat(row.total_genere) || 0
      const salaireNet = parseFloat(row.salaire_net) || 0
      const charge = parseFloat(row.charge) || 0
      const taxe = parseFloat(row.taxe) || 0
      const rapDB = parseFloat(row.rap) || 0
      
      // Calcul manuel avec la nouvelle formule
      let rapManuel = 0
      if (Math.abs(taxe - 50) < 0.01) {
        rapManuel = totalGenere - salaireNet - (0.5 * charge)
      }
      
      console.log(`   - Total Généré: ${totalGenere}€`)
      console.log(`   - Salaire Net: ${salaireNet}€`)
      console.log(`   - Charge: ${charge}€`)
      console.log(`   - Taxe: ${taxe}%`)
      console.log(`   - RAP (DB): ${rapDB}€`)
      console.log(`   - RAP (calculé): ${rapManuel.toFixed(2)}€`)
      
      if (Math.abs(rapDB - rapManuel) < 0.01) {
        console.log('✅ RAP correct !')
      } else {
        console.log('❌ RAP incorrect !')
      }
    }
    
    console.log('\n🎯 Vérification terminée !')
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message)
  } finally {
    await pool.end()
  }
}

verifyChikhaSalemFront()
