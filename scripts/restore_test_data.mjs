import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function restoreTestData() {
  console.log('🔄 Restauration des données de test...')
  
  try {
    // 1. Vérifier l'état actuel
    console.log('\n📋 1. État actuel de la base de données:')
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM employes) as employes_count,
        (SELECT COUNT(*) FROM interventions) as interventions_count,
        (SELECT COUNT(*) FROM cout_par_salaire) as couts_count
    `)
    
    const current = stats.rows[0]
    console.log(`  - Employés: ${current.employes_count}`)
    console.log(`  - Interventions: ${current.interventions_count}`)
    console.log(`  - Coûts par salarié: ${current.couts_count}`)
    
    if (current.employes_count > 1 || current.interventions_count > 0) {
      console.log('⚠️ La base de données contient déjà des données.')
      console.log('💡 Utilisez d\'abord le bouton "Vider Base de Données" dans le dashboard.')
      return
    }
    
    // 2. Créer quelques employés de test
    console.log('\n📋 2. Création des employés de test...')
    const testEmployees = [
      { nom: 'BECHIRMOULAHI', prenom: 'MOHAMED', matricule: 'TECH_MOUMO', email: 'mohamed.bechirmoulahi@finalfibre.com', pourcentage_taxe: 50 },
      { nom: 'HAKIRI', prenom: 'RAMZI', matricule: 'TECH_HAKRA', email: 'ramzi.hakiri@finalfibre.com', pourcentage_taxe: 100 },
      { nom: 'BENSALAH', prenom: 'HAMZA', matricule: 'TECH_BENHA', email: 'hamza.bensalah@finalfibre.com', pourcentage_taxe: 50 },
      { nom: 'CHIKHA', prenom: 'SALEM', matricule: 'TECH_CHISA', email: 'salem.chikha@finalfibre.com', pourcentage_taxe: 0 },
      { nom: 'LOTFI', prenom: 'WAHID', matricule: 'TECH_LOTWA', email: 'wahid.lotfi@finalfibre.com', pourcentage_taxe: 50 }
    ]
    
    for (const emp of testEmployees) {
      await pool.query(`
        INSERT INTO employes (
          nom, prenom, matricule, email, niveau_acces, statut, pourcentage_taxe, date_embauche
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        emp.nom, emp.prenom, emp.matricule, emp.email, 
        'technicien', 'actif', emp.pourcentage_taxe, 
        new Date().toISOString().split('T')[0]
      ])
      console.log(`✅ Employé créé: ${emp.nom} ${emp.prenom}`)
    }
    
    // 3. Créer quelques interventions de test
    console.log('\n📋 3. Création des interventions de test...')
    const testInterventions = [
      { 
        prenom_technicien: 'Mohamed-Bechir', nom_technicien: 'MOULAHI', 
        client: 'SFR', articles: 'CLEM x1,RACIH x1', type_intervention: 'RACC',
        statut: 'CLOTURE TERMINEE', date_rdv: '2025-05-30'
      },
      { 
        prenom_technicien: 'RAMZI', nom_technicien: 'HAKIRI', 
        client: 'SFR', articles: 'RACPRO_S x1', type_intervention: 'SAV',
        statut: 'CLOTURE TERMINEE', date_rdv: '2025-05-29'
      },
      { 
        prenom_technicien: 'HAMZA', nom_technicien: 'BENSALAH', 
        client: 'SFR', articles: 'REFRAC x1', type_intervention: 'RACC',
        statut: 'CLOTURE TERMINEE', date_rdv: '2025-05-28'
      }
    ]
    
    for (const inter of testInterventions) {
      await pool.query(`
        INSERT INTO interventions (
          prenom_technicien, nom_technicien, client, articles, type_intervention,
          statut, date_rdv, cloture_tech, cloture_hotline
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        inter.prenom_technicien, inter.nom_technicien, inter.client, 
        inter.articles, inter.type_intervention, inter.statut, 
        inter.date_rdv, new Date().toISOString(), new Date().toISOString()
      ])
      console.log(`✅ Intervention créée: ${inter.prenom_technicien} ${inter.nom_technicien}`)
    }
    
    // 4. Créer quelques coûts par salarié de test
    console.log('\n📋 4. Création des coûts par salarié de test...')
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    
    const testCosts = [
      { nom: 'BECHIRMOULAHI', prenom: 'MOHAMED', salaire_net: 1406.34, charge: 456.59, cout_total: 1862.93 },
      { nom: 'HAKIRI', prenom: 'RAMZI', salaire_net: 1635.94, charge: 486.44, cout_total: 2122.38 },
      { nom: 'BENSALAH', prenom: 'HAMZA', salaire_net: 1455.61, charge: 504.05, cout_total: 1959.66 }
    ]
    
    for (const cost of testCosts) {
      await pool.query(`
        INSERT INTO cout_par_salaire (
          nom, prenom, salaire_net, charge, cout_total, mois, annee
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        cost.nom, cost.prenom, cost.salaire_net, cost.charge, 
        cost.cout_total, currentMonth, currentYear
      ])
      console.log(`✅ Coût créé: ${cost.nom} ${cost.prenom}`)
    }
    
    // 5. Vérifier les données restaurées
    console.log('\n📋 5. Vérification des données restaurées:')
    const finalStats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM employes) as employes_count,
        (SELECT COUNT(*) FROM interventions) as interventions_count,
        (SELECT COUNT(*) FROM cout_par_salaire) as couts_count
    `)
    
    const final = finalStats.rows[0]
    console.log(`  - Employés: ${final.employes_count}`)
    console.log(`  - Interventions: ${final.interventions_count}`)
    console.log(`  - Coûts par salarié: ${final.couts_count}`)
    
    console.log('\n🎯 Données de test restaurées avec succès !')
    console.log('📋 Vous pouvez maintenant tester l\'application avec des données réalistes.')
    
  } catch (error) {
    console.error('❌ Erreur lors de la restauration:', error.message)
  } finally {
    await pool.end()
  }
}

restoreTestData()
