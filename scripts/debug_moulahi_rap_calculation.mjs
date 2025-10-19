import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024',
  ssl: false,
  max: 50,
  min: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
  acquireTimeoutMillis: 10000,
  allowExitOnIdle: true,
});

async function debugMoulahiRapCalculation() {
  console.log('🔍 Diagnostic du calcul RAP pour BECHIRMOULAHI MOHAMED...');
  
  try {
    // 1. Récupérer les données actuelles
    console.log('\n📊 1. Données actuelles:');
    const currentResult = await pool.query(`
      SELECT 
        id,
        nom,
        prenom,
        matricule,
        mois,
        annee,
        total_genere,
        salaire_net,
        salaire_brut,
        charge,
        taxe,
        penalite,
        rap,
        created_at,
        updated_at
      FROM cout_par_salaire
      WHERE LOWER(nom) LIKE '%moulahi%' AND LOWER(prenom) LIKE '%mohamed%'
    `);
    
    if (currentResult.rows.length === 0) {
      console.log('   ❌ Aucun enregistrement BECHIRMOULAHI MOHAMED trouvé');
      return;
    }
    
    const row = currentResult.rows[0];
    console.log(`   📊 Enregistrement: ${row.nom} ${row.prenom} (${row.matricule})`);
    console.log(`      Mois/Année: ${row.mois}/${row.annee}`);
    console.log(`      Total Généré: ${row.total_genere}€`);
    console.log(`      Salaire Net: ${row.salaire_net}€`);
    console.log(`      Salaire Brut: ${row.salaire_brut}€`);
    console.log(`      Charge: ${row.charge}€`);
    console.log(`      Taxe: ${row.taxe}€`);
    console.log(`      Pénalité: ${row.penalite}€`);
    console.log(`      RAP Actuel: ${row.rap}€`);
    
    // 2. Calculer le RAP selon la formule standard
    console.log('\n📊 2. Calcul du RAP selon la formule standard:');
    const totalGenere = parseFloat(row.total_genere);
    const salaireNet = parseFloat(row.salaire_net);
    const charge = parseFloat(row.charge);
    const taxe = parseFloat(row.taxe);
    const penalite = parseFloat(row.penalite);
    
    const totalCouts = salaireNet + charge + taxe + penalite;
    const rapStandard = totalGenere - totalCouts;
    
    console.log(`   📊 Formule: Total Généré - (Salaire Net + Charge + Taxe + Pénalité)`);
    console.log(`   📊 Calcul: ${totalGenere}€ - (${salaireNet}€ + ${charge}€ + ${taxe}€ + ${penalite}€)`);
    console.log(`   📊 Total Coûts: ${totalCouts}€`);
    console.log(`   📊 RAP Standard: ${rapStandard}€`);
    
    // 3. Vérifier les paiements existants
    console.log('\n📊 3. Vérification des paiements:');
    const paiementsResult = await pool.query(`
      SELECT 
        pe.id,
        pe.montant_verse,
        pe.date_paiement,
        pe.methode_paiement,
        pe.reference_paiement,
        pe.commentaires,
        pe.statut
      FROM paiements_employes pe
      WHERE pe.cout_par_salaire_id = $1
      ORDER BY pe.date_paiement DESC
    `, [row.id]);
    
    console.log(`   📊 Paiements trouvés: ${paiementsResult.rows.length}`);
    let totalPaiements = 0;
    paiementsResult.rows.forEach((paiement, index) => {
      console.log(`      ${index + 1}. ${paiement.montant_verse}€ le ${paiement.date_paiement} (${paiement.methode_paiement})`);
      totalPaiements += parseFloat(paiement.montant_verse);
    });
    
    if (totalPaiements > 0) {
      console.log(`   📊 Total des paiements: ${totalPaiements}€`);
    } else {
      console.log(`   📊 Aucun paiement enregistré`);
    }
    
    // 4. Calculer le RAP final avec paiements
    const rapFinal = rapStandard - totalPaiements;
    console.log(`   📊 RAP Final: ${rapStandard}€ - ${totalPaiements}€ = ${rapFinal}€`);
    
    // 5. Vérifier si le RAP attendu (825.36€) correspond à un calcul différent
    console.log('\n📊 4. Analyse du RAP attendu (825.36€):');
    const rapAttendu = 825.36;
    const difference = rapAttendu - rapFinal;
    
    console.log(`   📊 RAP Attendu: ${rapAttendu}€`);
    console.log(`   📊 RAP Calculé: ${rapFinal}€`);
    console.log(`   📊 Différence: ${difference}€`);
    
    if (Math.abs(difference) < 0.01) {
      console.log(`   ✅ RAP correspond au calcul attendu`);
    } else {
      console.log(`   ❌ RAP ne correspond pas au calcul attendu`);
      
      // 6. Essayer de comprendre la formule utilisée
      console.log('\n📊 5. Analyse de la formule possible:');
      
      // Peut-être que la taxe est calculée différemment ?
      const salaireBrut = parseFloat(row.salaire_brut);
      console.log(`   📊 Salaire Brut: ${salaireBrut}€`);
      
      // Peut-être que la taxe est sur le salaire brut ?
      const taxeSurBrut = salaireBrut * 0.5; // 50%
      console.log(`   📊 Taxe sur salaire brut (50%): ${taxeSurBrut}€`);
      
      // Peut-être que le RAP est calculé différemment ?
      const rapAlternatif1 = totalGenere - (salaireBrut + charge + penalite);
      console.log(`   📊 RAP Alt 1 (Total - (Brut + Charge + Pénalité)): ${rapAlternatif1}€`);
      
      const rapAlternatif2 = totalGenere - (salaireNet + charge + taxeSurBrut + penalite);
      console.log(`   📊 RAP Alt 2 (Total - (Net + Charge + Taxe sur Brut + Pénalité)): ${rapAlternatif2}€`);
      
      const rapAlternatif3 = totalGenere - (salaireBrut + charge + penalite) - totalPaiements;
      console.log(`   📊 RAP Alt 3 (Total - (Brut + Charge + Pénalité) - Paiements): ${rapAlternatif3}€`);
      
      // Vérifier si l'un de ces calculs correspond au RAP attendu
      const calculs = [
        { nom: 'Standard', valeur: rapFinal },
        { nom: 'Alt 1', valeur: rapAlternatif1 },
        { nom: 'Alt 2', valeur: rapAlternatif2 },
        { nom: 'Alt 3', valeur: rapAlternatif3 }
      ];
      
      calculs.forEach(calc => {
        const diff = Math.abs(calc.valeur - rapAttendu);
        if (diff < 0.01) {
          console.log(`   ✅ Formule trouvée: ${calc.nom} = ${calc.valeur}€`);
        }
      });
    }
    
    // 7. Vérifier la cohérence avec l'interface
    console.log('\n📊 6. Vérification de la cohérence avec l\'interface:');
    console.log(`   📊 Interface affiche: RAP = 547.07€`);
    console.log(`   📊 Calcul actuel: RAP = ${rapFinal}€`);
    console.log(`   📊 RAP attendu: RAP = ${rapAttendu}€`);
    
    if (Math.abs(rapFinal - 547.07) < 0.01) {
      console.log(`   ✅ L'interface affiche le bon RAP calculé`);
    } else {
      console.log(`   ❌ L'interface n'affiche pas le bon RAP calculé`);
    }
    
    console.log('\n🎯 Diagnostic terminé !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

debugMoulahiRapCalculation().catch(console.error);
