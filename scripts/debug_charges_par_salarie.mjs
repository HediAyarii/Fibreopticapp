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

async function debugChargesParSalarie() {
  try {
    console.log('🔍 Debug de la section "Charges par Salarié"...')
    console.log('📊 Problème: Affiche encore 3710€ au lieu de 3770€')
    
    // 1. Vérifier toutes les entrées pour CHIKHA SALEM
    console.log('\n📋 Toutes les entrées pour CHIKHA SALEM:')
    const allEntries = await pool.query(`
      SELECT 
        id, nom, prenom, matricule, mois, annee,
        total_genere, salaire_net, charge, taxe, rap, updated_at
      FROM cout_par_salaire 
      WHERE LOWER(nom) = LOWER('CHIKHA') AND LOWER(prenom) = LOWER('SALEM')
      ORDER BY annee, mois, id
    `)
    
    console.log(`📊 ${allEntries.rows.length} entrées trouvées:`)
    allEntries.rows.forEach((row, index) => {
      console.log(`${index + 1}. ID: ${row.id} - ${row.mois}/${row.annee} - Total: ${row.total_genere}€ - Mis à jour: ${row.updated_at}`)
    })
    
    // 2. Vérifier spécifiquement mai 2025
    console.log('\n🎯 Entrée spécifique pour mai 2025:')
    const may2025 = await pool.query(`
      SELECT 
        id, nom, prenom, matricule, mois, annee,
        total_genere, salaire_net, charge, taxe, rap, updated_at
      FROM cout_par_salaire 
      WHERE LOWER(nom) = LOWER('CHIKHA') AND LOWER(prenom) = LOWER('SALEM')
      AND mois = 5 AND annee = 2025
    `)
    
    if (may2025.rows.length > 0) {
      const row = may2025.rows[0]
      console.log(`✅ Entrée mai 2025:`)
      console.log(`   - ID: ${row.id}`)
      console.log(`   - Nom: ${row.nom} ${row.prenom}`)
      console.log(`   - Matricule: ${row.matricule}`)
      console.log(`   - Mois/Année: ${row.mois}/${row.annee}`)
      console.log(`   - Total Généré: ${row.total_genere}€`)
      console.log(`   - Salaire Net: ${row.salaire_net}€`)
      console.log(`   - Charge: ${row.charge}€`)
      console.log(`   - Taxe: ${row.taxe}%`)
      console.log(`   - RAP: ${row.rap}€`)
      console.log(`   - Mis à jour: ${row.updated_at}`)
    } else {
      console.log('❌ Aucune entrée trouvée pour mai 2025')
    }
    
    // 3. Forcer la mise à jour avec une approche différente
    console.log('\n🔧 Forçage de la mise à jour...')
    
    // D'abord, calculer la valeur correcte
    const correctValue = await pool.query(`
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
        ) as total_recettes_correct
      FROM interventions i
      WHERE LOWER(i.nom_technicien) = LOWER('CHIKHA') AND LOWER(i.prenom_technicien) = LOWER('SALEM')
      AND (
        (i.date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' AND TO_DATE(i.date_rdv, 'DD.MM.YYYY') >= '2025-05-01' AND TO_DATE(i.date_rdv, 'DD.MM.YYYY') <= '2025-05-31')
        OR (i.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND i.date_rdv::date >= '2025-05-01' AND i.date_rdv::date <= '2025-05-31')
        OR (i.date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') >= '2025-05-01' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') <= '2025-05-31')
      )
    `)
    
    const correctTotal = parseFloat(correctValue.rows[0].total_recettes_correct) || 0
    console.log(`💰 Valeur correcte calculée: ${correctTotal}€`)
    
    // Mettre à jour avec une requête plus explicite
    if (may2025.rows.length > 0) {
      const currentId = may2025.rows[0].id
      const currentTotal = parseFloat(may2025.rows[0].total_genere) || 0
      
      console.log(`\n🔄 Mise à jour de l'entrée ID ${currentId}...`)
      console.log(`   - Ancienne valeur: ${currentTotal}€`)
      console.log(`   - Nouvelle valeur: ${correctTotal}€`)
      
      const updateResult = await pool.query(`
        UPDATE cout_par_salaire 
        SET 
          total_genere = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [correctTotal, currentId])
      
      console.log(`✅ ${updateResult.rowCount} ligne(s) mise(s) à jour`)
      
      // Vérifier immédiatement après la mise à jour
      const verifyResult = await pool.query(`
        SELECT total_genere, updated_at FROM cout_par_salaire WHERE id = $1
      `, [currentId])
      
      if (verifyResult.rows.length > 0) {
        const row = verifyResult.rows[0]
        console.log(`✅ Vérification: ${row.total_genere}€ (mis à jour: ${row.updated_at})`)
      }
    }
    
    // 4. Vérifier l'API cout-par-salaire
    console.log('\n🔍 Test de l\'API cout-par-salaire...')
    const apiResult = await pool.query(`
      SELECT 
        nom, prenom, matricule, mois, annee,
        total_genere, salaire_net, charge, cout_total, taxe, rap
      FROM cout_par_salaire 
      WHERE LOWER(nom) = LOWER('CHIKHA') AND LOWER(prenom) = LOWER('SALEM')
      AND mois = 5 AND annee = 2025
    `)
    
    if (apiResult.rows.length > 0) {
      const row = apiResult.rows[0]
      console.log(`✅ API cout-par-salaire retourne:`)
      console.log(`   - ${row.nom} ${row.prenom} (${row.matricule})`)
      console.log(`   - Total Généré: ${row.total_genere}€`)
      console.log(`   - RAP: ${row.rap}€`)
    }
    
    // 5. Vérifier s'il y a des doublons ou des conflits
    console.log('\n🔍 Recherche de doublons...')
    const duplicates = await pool.query(`
      SELECT 
        nom, prenom, mois, annee, COUNT(*) as count
      FROM cout_par_salaire 
      WHERE LOWER(nom) = LOWER('CHIKHA') AND LOWER(prenom) = LOWER('SALEM')
      GROUP BY nom, prenom, mois, annee
      HAVING COUNT(*) > 1
    `)
    
    if (duplicates.rows.length > 0) {
      console.log('⚠️ Doublons détectés:')
      duplicates.rows.forEach(row => {
        console.log(`   - ${row.mois}/${row.annee}: ${row.count} entrées`)
      })
    } else {
      console.log('✅ Aucun doublon détecté')
    }
    
    console.log('\n🎯 Debug terminé !')
    console.log('💡 Si le problème persiste, vérifiez:')
    console.log('   1. Le cache du navigateur')
    console.log('   2. Les paramètres de l\'API')
    console.log('   3. Les filtres appliqués dans le front-end')
    
  } catch (error) {
    console.error('❌ Erreur lors du debug:', error.message)
  } finally {
    await pool.end()
  }
}

debugChargesParSalarie()
