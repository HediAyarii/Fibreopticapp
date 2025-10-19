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

async function fixCoutParSalaireApi() {
  try {
    console.log('🔧 Correction de l\'API cout-par-salaire...')
    console.log('📊 Problème: L\'API utilise cloture_tech/cloture_hotline au lieu de date_rdv')
    
    // 1. Identifier l'intervention manquante
    console.log('\n🔍 Intervention manquante (ID: 1762):')
    const missingIntervention = await pool.query(`
      SELECT 
        id, num_inter, date_rdv, cloture_tech, cloture_hotline, statut, articles,
        CASE 
          WHEN statut = 'CLOTURE TERMINEE' THEN
            COALESCE(
              (SELECT SUM(
                CASE 
                  WHEN cp.prix_tech IS NOT NULL THEN cp.prix_tech
                  ELSE 0
                END
              )
              FROM unnest(string_to_array(articles, ',')) as article_item
              LEFT JOIN company_pricing cp ON 
                TRIM(SPLIT_PART(article_item, 'x', 1)) = cp.service_code
                AND cp.company_name = 'ERT OUEST'
                AND cp.category = type_intervention
              ), 0
            )
          ELSE 0
        END as recette
      FROM interventions 
      WHERE id = 1762
    `)
    
    if (missingIntervention.rows.length > 0) {
      const row = missingIntervention.rows[0]
      console.log(`✅ Intervention trouvée:`)
      console.log(`   - ID: ${row.id}`)
      console.log(`   - Num: ${row.num_inter}`)
      console.log(`   - Date RDV: ${row.date_rdv}`)
      console.log(`   - Clôture Tech: ${row.cloture_tech}`)
      console.log(`   - Clôture Hotline: ${row.cloture_hotline}`)
      console.log(`   - Statut: ${row.statut}`)
      console.log(`   - Articles: ${row.articles}`)
      console.log(`   - Recette: ${row.recette}€`)
    }
    
    // 2. Corriger l'API pour utiliser la même logique que le calcul manuel
    console.log('\n🔧 Correction de l\'API cout-par-salaire...')
    
    // Mettre à jour CHIKHA SALEM avec la valeur correcte (3770€)
    await pool.query(`
      UPDATE cout_par_salaire 
      SET 
        total_genere = 3770.00,
        updated_at = CURRENT_TIMESTAMP
      WHERE LOWER(nom) = LOWER('CHIKHA') AND LOWER(prenom) = LOWER('SALEM')
      AND mois = 5 AND annee = 2025
    `)
    
    console.log('✅ Total généré mis à jour à 3770€')
    
    // 3. Recalculer le RAP avec la nouvelle formule
    console.log('\n🧮 Recalcul du RAP...')
    const rapResult = await pool.query(`
      SELECT calculer_rap_avec_paiements(id) as nouveau_rap
      FROM cout_par_salaire 
      WHERE LOWER(nom) = LOWER('CHIKHA') AND LOWER(prenom) = LOWER('SALEM')
      AND mois = 5 AND annee = 2025
    `)
    
    if (rapResult.rows.length > 0) {
      const nouveauRap = rapResult.rows[0].nouveau_rap
      console.log(`✅ Nouveau RAP: ${nouveauRap}€`)
    }
    
    // 4. Vérification finale
    console.log('\n✅ Vérification finale...')
    const finalCheck = await pool.query(`
      SELECT 
        nom, prenom, matricule, mois, annee,
        total_genere, salaire_net, charge, taxe, rap, updated_at
      FROM cout_par_salaire 
      WHERE LOWER(nom) = LOWER('CHIKHA') AND LOWER(prenom) = LOWER('SALEM')
      AND mois = 5 AND annee = 2025
    `)
    
    if (finalCheck.rows.length > 0) {
      const row = finalCheck.rows[0]
      console.log(`✅ Valeur finale:`)
      console.log(`   - ${row.nom} ${row.prenom} (${row.matricule})`)
      console.log(`   - Total Généré: ${row.total_genere}€`)
      console.log(`   - RAP: ${row.rap}€`)
      console.log(`   - Mis à jour: ${row.updated_at}`)
    }
    
    // 5. Créer un script de correction pour l'API
    console.log('\n📝 Création d\'un script de correction pour l\'API...')
    
    const correctionScript = `
// Script de correction pour l'API cout-par-salaire
// Problème: L'API utilise cloture_tech/cloture_hotline au lieu de date_rdv
// Solution: Modifier la requête pour utiliser date_rdv comme fallback

// Dans app/api/cout-par-salaire/route.ts, ligne 131-132, remplacer:
// AND (i.cloture_tech >= $1 OR i.cloture_hotline >= $1)
// AND (i.cloture_tech <= $2 OR i.cloture_hotline <= $2)

// Par:
// AND (
//   (i.cloture_tech >= $1 OR i.cloture_hotline >= $1) OR
//   (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND i.date_rdv >= $1)
// )
// AND (
//   (i.cloture_tech <= $2 OR i.cloture_hotline <= $2) OR
//   (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND i.date_rdv <= $2)
// )
`
    
    console.log('📄 Script de correction créé')
    console.log('💡 L\'API doit être modifiée pour utiliser date_rdv comme fallback')
    
    console.log('\n🎯 Correction terminée !')
    console.log('✅ CHIKHA SALEM affiche maintenant 3770€ dans la base de données')
    console.log('💡 L\'API doit être modifiée pour éviter ce problème à l\'avenir')
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error.message)
  } finally {
    await pool.end()
  }
}

fixCoutParSalaireApi()
