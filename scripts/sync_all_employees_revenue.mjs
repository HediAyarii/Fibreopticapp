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

async function syncAllEmployeesRevenue() {
  try {
    console.log('🔄 Synchronisation automatique des recettes pour tous les employés...')
    
    // 1. Récupérer tous les employés avec des données dans cout_par_salaire
    console.log('\n📊 Récupération des employés...')
    const employees = await pool.query(`
      SELECT DISTINCT
        nom, prenom, matricule, mois, annee, total_genere, id
      FROM cout_par_salaire 
      WHERE total_genere > 0
      ORDER BY nom, prenom, annee, mois
    `)
    
    console.log(`👥 ${employees.rows.length} employés trouvés`)
    
    let totalUpdated = 0
    let totalErrors = 0
    
    // 2. Pour chaque employé, calculer et synchroniser les recettes
    for (const employee of employees.rows) {
      try {
        console.log(`\n🔍 Traitement: ${employee.nom} ${employee.prenom} (${employee.matricule}) - ${employee.mois}/${employee.annee}`)
        
        // Calculer les recettes réelles pour cet employé
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
          WHERE LOWER(i.nom_technicien) = LOWER($1) AND LOWER(i.prenom_technicien) = LOWER($2)
          AND (
            (i.date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' AND TO_DATE(i.date_rdv, 'DD.MM.YYYY') >= $3::date AND TO_DATE(i.date_rdv, 'DD.MM.YYYY') <= $4::date)
            OR (i.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND i.date_rdv::date >= $3::date AND i.date_rdv::date <= $4::date)
            OR (i.date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') >= $3::date AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') <= $4::date)
          )
        `, [
          employee.nom,
          employee.prenom,
          `${employee.annee}-${employee.mois.toString().padStart(2, '0')}-01`,
          `${employee.annee}-${employee.mois.toString().padStart(2, '0')}-31`
        ])
        
        const realTotal = parseFloat(realRevenue.rows[0].total_recettes_reel) || 0
        const currentTotal = parseFloat(employee.total_genere) || 0
        const difference = realTotal - currentTotal
        
        console.log(`   - Total actuel: ${currentTotal}€`)
        console.log(`   - Total réel: ${realTotal}€`)
        console.log(`   - Différence: ${difference.toFixed(2)}€`)
        
        // Mettre à jour si nécessaire
        if (Math.abs(difference) > 0.01) {
          await pool.query(`
            UPDATE cout_par_salaire 
            SET 
              total_genere = $1,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [realTotal, employee.id])
          
          console.log(`   ✅ Mis à jour: ${currentTotal}€ → ${realTotal}€`)
          totalUpdated++
        } else {
          console.log(`   ✅ Déjà synchronisé`)
        }
        
      } catch (error) {
        console.error(`   ❌ Erreur pour ${employee.nom} ${employee.prenom}:`, error.message)
        totalErrors++
      }
    }
    
    console.log('\n🎯 Synchronisation terminée !')
    console.log(`📊 Résultats:`)
    console.log(`   - Employés traités: ${employees.rows.length}`)
    console.log(`   - Mis à jour: ${totalUpdated}`)
    console.log(`   - Erreurs: ${totalErrors}`)
    
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error.message)
  } finally {
    await pool.end()
  }
}

syncAllEmployeesRevenue()
