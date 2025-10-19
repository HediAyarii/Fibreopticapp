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

async function analyzeRapFormula() {
  console.log('🔍 Analyse de la formule RAP correcte...');
  
  try {
    // 1. Récupérer les données de BECHIRMOULAHI MOHAMED
    console.log('\n📊 1. Données de BECHIRMOULAHI MOHAMED:');
    const moulahiResult = await pool.query(`
      SELECT 
        total_genere,
        salaire_net,
        salaire_brut,
        charge,
        taxe,
        penalite,
        rap
      FROM cout_par_salaire
      WHERE LOWER(nom) LIKE '%moulahi%' AND LOWER(prenom) LIKE '%mohamed%'
    `);
    
    if (moulahiResult.rows.length === 0) {
      console.log('   ❌ Aucun enregistrement trouvé');
      return;
    }
    
    const row = moulahiResult.rows[0];
    const totalGenere = parseFloat(row.total_genere);
    const salaireNet = parseFloat(row.salaire_net);
    const salaireBrut = parseFloat(row.salaire_brut);
    const charge = parseFloat(row.charge);
    const taxe = parseFloat(row.taxe);
    const penalite = parseFloat(row.penalite);
    const rapActuel = parseFloat(row.rap);
    
    console.log(`   📊 Total Généré: ${totalGenere}€`);
    console.log(`   📊 Salaire Net: ${salaireNet}€`);
    console.log(`   📊 Salaire Brut: ${salaireBrut}€`);
    console.log(`   📊 Charge: ${charge}€`);
    console.log(`   📊 Taxe: ${taxe}€`);
    console.log(`   📊 Pénalité: ${penalite}€`);
    console.log(`   📊 RAP Actuel: ${rapActuel}€`);
    
    // 2. Analyser la différence entre les valeurs
    console.log('\n📊 2. Analyse des différences:');
    const differenceBrutNet = salaireBrut - salaireNet;
    console.log(`   📊 Différence Brut - Net: ${salaireBrut}€ - ${salaireNet}€ = ${differenceBrutNet}€`);
    
    const differenceRapAttendu = 825.36 - rapActuel;
    console.log(`   📊 Différence RAP Attendu - Actuel: 825.36€ - ${rapActuel}€ = ${differenceRapAttendu}€`);
    
    // 3. Vérifier si la différence correspond à la taxe sur le salaire brut
    const taxeSurBrut = salaireBrut * 0.5; // 50%
    console.log(`   📊 Taxe sur salaire brut (50%): ${taxeSurBrut}€`);
    
    if (Math.abs(differenceRapAttendu - taxeSurBrut) < 0.01) {
      console.log(`   ✅ La différence correspond à la taxe sur le salaire brut !`);
      console.log(`   📊 Formule probable: RAP = Total Généré - (Salaire Net + Charge + Taxe sur Brut + Pénalité)`);
    } else {
      console.log(`   ❌ La différence ne correspond pas à la taxe sur le salaire brut`);
    }
    
    // 4. Tester différentes formules
    console.log('\n📊 3. Test de différentes formules:');
    
    const formules = [
      {
        nom: 'Standard (Net + Charge + Taxe + Pénalité)',
        calcul: totalGenere - (salaireNet + charge + taxe + penalite)
      },
      {
        nom: 'Brut + Charge + Pénalité',
        calcul: totalGenere - (salaireBrut + charge + penalite)
      },
      {
        nom: 'Net + Charge + Taxe sur Brut + Pénalité',
        calcul: totalGenere - (salaireNet + charge + taxeSurBrut + penalite)
      },
      {
        nom: 'Brut + Charge + Taxe sur Brut + Pénalité',
        calcul: totalGenere - (salaireBrut + charge + taxeSurBrut + penalite)
      },
      {
        nom: 'Net + Charge + Taxe + Pénalité (avec taxe sur brut)',
        calcul: totalGenere - (salaireNet + charge + taxeSurBrut + penalite)
      }
    ];
    
    formules.forEach(formule => {
      const difference = Math.abs(formule.calcul - 825.36);
      console.log(`   📊 ${formule.nom}: ${formule.calcul.toFixed(2)}€ (diff: ${difference.toFixed(2)}€)`);
      
      if (difference < 0.01) {
        console.log(`      ✅ CORRESPOND AU RAP ATTENDU !`);
      }
    });
    
    // 5. Vérifier la cohérence avec l'interface
    console.log('\n📊 4. Vérification de la cohérence avec l\'interface:');
    console.log(`   📊 Interface affiche: Taxe 50% = 228.30€`);
    console.log(`   📊 Taxe calculée (50% de ${salaireBrut}€): ${(salaireBrut * 0.5).toFixed(2)}€`);
    
    const taxeInterface = 228.30;
    const taxeCalculee = salaireBrut * 0.5;
    const differenceTaxe = Math.abs(taxeInterface - taxeCalculee);
    
    if (differenceTaxe < 0.01) {
      console.log(`   ✅ La taxe de l'interface correspond au calcul (50% du salaire brut)`);
    } else {
      console.log(`   ❌ La taxe de l'interface ne correspond pas au calcul`);
      console.log(`   📊 Différence: ${differenceTaxe}€`);
    }
    
    // 6. Calculer le RAP correct avec la formule identifiée
    console.log('\n📊 5. Calcul du RAP correct:');
    const rapCorrect = totalGenere - (salaireNet + charge + taxeInterface + penalite);
    console.log(`   📊 RAP Correct: ${totalGenere}€ - (${salaireNet}€ + ${charge}€ + ${taxeInterface}€ + ${penalite}€) = ${rapCorrect}€`);
    
    if (Math.abs(rapCorrect - 825.36) < 0.01) {
      console.log(`   ✅ RAP correct calculé !`);
    } else {
      console.log(`   ❌ RAP ne correspond toujours pas`);
    }
    
    console.log('\n🎯 Analyse terminée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

analyzeRapFormula().catch(console.error);
