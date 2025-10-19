import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function debugRapCalculation() {
  console.log('🔍 Debug du calcul RAP pour BECHIRMOULAHI MOHAMED...')
  
  try {
    // 1. Récupérer les données de cet employé
    const result = await pool.query(`
      SELECT 
        id, nom, prenom, matricule,
        total_genere, salaire_net, charge, cout_total, taxe,
        rap,
        calculer_total_paiements(id) as total_paiements,
        calculer_rap_avec_paiements(id) as rap_calcule
      FROM cout_par_salaire 
      WHERE nom = 'BECHIRMOULAHI' AND prenom = 'MOHAMED'
    `)
    
    if (result.rows.length === 0) {
      console.log('❌ Employé non trouvé')
      return
    }
    
    const cout = result.rows[0]
    console.log('\n📊 Données de l\'employé:')
    console.log(`  - ID: ${cout.id}`)
    console.log(`  - Nom: ${cout.nom} ${cout.prenom}`)
    console.log(`  - Matricule: ${cout.matricule}`)
    console.log(`  - Total Généré: ${cout.total_genere}€`)
    console.log(`  - Salaire Net: ${cout.salaire_net}€`)
    console.log(`  - Charge: ${cout.charge}€`)
    console.log(`  - Coût Total: ${cout.cout_total}€`)
    console.log(`  - Taxe: ${cout.taxe}%`)
    console.log(`  - Total Paiements: ${cout.total_paiements}€`)
    console.log(`  - RAP actuel: ${cout.rap}€`)
    console.log(`  - RAP calculé: ${cout.rap_calcule}€`)
    
    // 2. Calcul manuel étape par étape
    console.log('\n🧮 Calcul manuel étape par étape:')
    
    const totalGenere = parseFloat(cout.total_genere) || 0
    const salaireNet = parseFloat(cout.salaire_net) || 0
    const charge = parseFloat(cout.charge) || 0
    const coutTotal = parseFloat(cout.cout_total) || 0
    const taxe = parseFloat(cout.taxe) || 0
    const totalPaiements = parseFloat(cout.total_paiements) || 0
    
    console.log(`  - Total Généré: ${totalGenere}€`)
    console.log(`  - Salaire Net: ${salaireNet}€`)
    console.log(`  - Charge: ${charge}€`)
    console.log(`  - Taxe: ${taxe}%`)
    console.log(`  - Total Paiements: ${totalPaiements}€`)
    
    // Calcul du RAP de base selon la taxe
    let rapBase = 0
    if (Math.abs(taxe - 100) < 0.01) {
      rapBase = totalGenere - salaireNet
      console.log(`  - Formule (100%): ${totalGenere} - ${salaireNet} = ${rapBase}€`)
    } else if (Math.abs(taxe - 50) < 0.01) {
      rapBase = totalGenere - salaireNet + (0.5 * charge)
      console.log(`  - Formule (50%): ${totalGenere} - ${salaireNet} + (0.5 × ${charge}) = ${rapBase}€`)
      console.log(`  - Détail: ${totalGenere} - ${salaireNet} + ${(0.5 * charge).toFixed(2)} = ${rapBase}€`)
    } else if (Math.abs(taxe) < 0.01) {
      rapBase = totalGenere - coutTotal
      console.log(`  - Formule (0%): ${totalGenere} - ${coutTotal} = ${rapBase}€`)
    } else {
      rapBase = totalGenere - coutTotal
      console.log(`  - Formule (personnalisé): ${totalGenere} - ${coutTotal} = ${rapBase}€`)
    }
    
    const rapFinal = rapBase - totalPaiements
    console.log(`  - RAP final: ${rapBase}€ - ${totalPaiements}€ = ${rapFinal}€`)
    
    // 3. Vérifier la fonction de la base de données
    console.log('\n🔍 Test de la fonction de la base de données:')
    const functionTest = await pool.query(`
      SELECT calculer_rap_avec_paiements($1) as rap_fonction
    `, [cout.id])
    
    console.log(`  - Fonction DB: ${functionTest.rows[0].rap_fonction}€`)
    console.log(`  - Calcul manuel: ${rapFinal}€`)
    console.log(`  - Différence: ${Math.abs(parseFloat(functionTest.rows[0].rap_fonction) - rapFinal)}€`)
    
    // 4. Vérifier s'il y a des paiements
    const paiements = await pool.query(`
      SELECT id, montant_verse, date_paiement, statut
      FROM paiements_employes 
      WHERE cout_par_salaire_id = $1
    `, [cout.id])
    
    console.log(`\n💰 Paiements enregistrés: ${paiements.rows.length}`)
    if (paiements.rows.length > 0) {
      paiements.rows.forEach((p, index) => {
        console.log(`  ${index + 1}. ${p.montant_verse}€ le ${p.date_paiement} (${p.statut})`)
      })
    }
    
    // 5. Diagnostic
    console.log('\n🔍 Diagnostic:')
    if (Math.abs(parseFloat(functionTest.rows[0].rap_fonction) - rapFinal) < 0.01) {
      console.log('✅ La fonction de la base de données est correcte')
    } else {
      console.log('❌ Il y a un problème dans la fonction de la base de données')
    }
    
    if (totalPaiements > 0) {
      console.log('⚠️ Des paiements sont déjà enregistrés')
    } else {
      console.log('✅ Aucun paiement enregistré')
    }
    
    console.log(`\n🎯 RAP attendu: ${rapFinal.toFixed(2)}€`)
    console.log(`📊 RAP affiché: ${cout.rap}€`)
    
  } catch (error) {
    console.error('❌ Erreur lors du debug:', error.message)
  } finally {
    await pool.end()
  }
}

debugRapCalculation()





