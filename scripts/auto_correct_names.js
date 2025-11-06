const { Pool } = require('pg')

// Configuration de la base de données
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function autoCorrectCoutParSalaireNames() {
  console.log('🔄 Correction automatique des noms dans cout_par_salaire...\n')

  try {
    // 1. Afficher l'état actuel
    console.log('📊 État avant correction:')
    const beforeState = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN employe_id IS NULL THEN 1 ELSE 0 END) as sans_employe_id,
        SUM(CASE WHEN employe_id IS NOT NULL THEN 1 ELSE 0 END) as avec_employe_id
      FROM cout_par_salaire
    `)
    console.log(beforeState.rows[0])
    console.log()

    // 2. Corriger les noms en utilisant le matricule
    // Les noms dans cout_par_salaire DOIVENT correspondre EXACTEMENT aux noms dans employes
    console.log('🔧 Correction des noms via matricule...')
    const correctionResult = await pool.query(`
      UPDATE cout_par_salaire cps
      SET 
        nom = e.nom,
        prenom = e.prenom,
        employe_id = e.id,
        taxe = e.pourcentage_taxe,
        impot = cps.charge * (e.pourcentage_taxe / 100),
        updated_at = CURRENT_TIMESTAMP
      FROM employes e
      WHERE cps.matricule = e.matricule
      AND cps.matricule IS NOT NULL
      AND cps.matricule != ''
      AND e.statut = 'actif'
      AND (
        cps.nom != e.nom 
        OR cps.prenom != e.prenom
        OR cps.employe_id IS NULL
        OR cps.employe_id != e.id
        OR cps.taxe != e.pourcentage_taxe
      )
      RETURNING cps.id, cps.matricule, e.nom as nom_employe, e.prenom as prenom_employe, cps.mois, cps.annee
    `)

    console.log(`✅ ${correctionResult.rowCount} entrées corrigées`)
    
    if (correctionResult.rowCount > 0) {
      console.log('\n📝 Détails des corrections:')
      correctionResult.rows.forEach(row => {
        console.log(`   - ID ${row.id}: ${row.nom_employe} ${row.prenom_employe} (${row.matricule}) - ${row.mois}/${row.annee}`)
      })
    }
    console.log()

    // 3. Identifier les entrées sans matricule
    console.log('⚠️  Vérification des entrées sans matricule:')
    const noMatriculeResult = await pool.query(`
      SELECT 
        id,
        nom,
        prenom,
        matricule,
        mois,
        annee
      FROM cout_par_salaire
      WHERE matricule IS NULL OR matricule = ''
      ORDER BY nom, prenom
    `)

    if (noMatriculeResult.rowCount > 0) {
      console.log(`   ⚠️  ${noMatriculeResult.rowCount} entrées SANS matricule (correction manuelle requise):`)
      noMatriculeResult.rows.forEach(row => {
        console.log(`      - ID ${row.id}: ${row.nom} ${row.prenom} - ${row.mois}/${row.annee}`)
      })
    } else {
      console.log('   ✅ Toutes les entrées ont un matricule')
    }
    console.log()

    // 4. Vérifier la synchronisation finale
    console.log('📊 Vérification de la synchronisation:')
    const syncCheck = await pool.query(`
      SELECT 
        CASE 
          WHEN e.id IS NULL THEN '❌ Employé introuvable'
          WHEN e.statut != 'actif' THEN '⚠️ Employé inactif'
          WHEN cps.nom != e.nom OR cps.prenom != e.prenom THEN '⚠️ Nom différent'
          WHEN e.pourcentage_taxe != cps.taxe THEN '⚠️ Taxe désynchronisée'
          ELSE '✅ OK'
        END as statut,
        COUNT(*) as nombre
      FROM cout_par_salaire cps
      LEFT JOIN employes e ON cps.matricule = e.matricule
      WHERE cps.mois = 10 AND cps.annee = 2025
      GROUP BY 
        CASE 
          WHEN e.id IS NULL THEN '❌ Employé introuvable'
          WHEN e.statut != 'actif' THEN '⚠️ Employé inactif'
          WHEN cps.nom != e.nom OR cps.prenom != e.prenom THEN '⚠️ Nom différent'
          WHEN e.pourcentage_taxe != cps.taxe THEN '⚠️ Taxe désynchronisée'
          ELSE '✅ OK'
        END
      ORDER BY nombre DESC
    `)

    console.log('   Résultats pour octobre 2025:')
    syncCheck.rows.forEach(row => {
      console.log(`   ${row.statut}: ${row.nombre}`)
    })
    console.log()

    // 5. Afficher l'état final
    console.log('📊 État après correction:')
    const afterState = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN employe_id IS NULL THEN 1 ELSE 0 END) as sans_employe_id,
        SUM(CASE WHEN employe_id IS NOT NULL THEN 1 ELSE 0 END) as avec_employe_id
      FROM cout_par_salaire
    `)
    console.log(afterState.rows[0])
    console.log()

    console.log('✅ Correction automatique terminée !')

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Exécuter le script
autoCorrectCoutParSalaireNames()
  .then(() => {
    console.log('\n🎉 Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script terminé avec erreur:', error)
    process.exit(1)
  })
