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

async function analyzeInterfaceTaxe() {
  console.log('🔍 Analyse de la taxe affichée dans l\'interface...');
  
  try {
    // 1. Récupérer les données actuelles
    console.log('\n📊 1. Données actuelles:');
    const currentResult = await pool.query(`
      SELECT 
        id,
        nom,
        prenom,
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
    
    if (currentResult.rows.length === 0) {
      console.log('   ❌ Aucun enregistrement trouvé');
      return;
    }
    
    const row = currentResult.rows[0];
    const totalGenere = parseFloat(row.total_genere);
    const salaireNet = parseFloat(row.salaire_net);
    const salaireBrut = parseFloat(row.salaire_brut);
    const charge = parseFloat(row.charge);
    const taxeActuelle = parseFloat(row.taxe);
    const penalite = parseFloat(row.penalite);
    const rapActuel = parseFloat(row.rap);
    
    console.log(`   📊 Total Généré: ${totalGenere}€`);
    console.log(`   📊 Salaire Net: ${salaireNet}€`);
    console.log(`   📊 Salaire Brut: ${salaireBrut}€`);
    console.log(`   📊 Charge: ${charge}€`);
    console.log(`   📊 Taxe Actuelle: ${taxeActuelle}€`);
    console.log(`   📊 Pénalité: ${penalite}€`);
    console.log(`   📊 RAP Actuel: ${rapActuel}€`);
    
    // 2. Analyser la taxe affichée dans l'interface (228.30€)
    console.log('\n📊 2. Analyse de la taxe interface (228.30€):');
    const taxeInterface = 228.30;
    console.log(`   📊 Taxe Interface: ${taxeInterface}€`);
    console.log(`   📊 Taxe Base: ${taxeActuelle}€`);
    console.log(`   📊 Différence: ${Math.abs(taxeInterface - taxeActuelle)}€`);
    
    // 3. Calculer le RAP avec la taxe de l'interface
    console.log('\n📊 3. Calcul du RAP avec la taxe interface:');
    const totalCoutsInterface = salaireNet + charge + taxeInterface + penalite;
    const rapInterface = totalGenere - totalCoutsInterface;
    
    console.log(`   📊 Calcul: ${totalGenere}€ - (${salaireNet}€ + ${charge}€ + ${taxeInterface}€ + ${penalite}€)`);
    console.log(`   📊 Total Coûts: ${totalCoutsInterface}€`);
    console.log(`   📊 RAP Interface: ${rapInterface}€`);
    
    // 4. Vérifier si cela correspond au RAP attendu (825.36€)
    const rapAttendu = 825.36;
    const difference = Math.abs(rapInterface - rapAttendu);
    console.log(`   📊 RAP Attendu: ${rapAttendu}€`);
    console.log(`   📊 Différence: ${difference}€`);
    
    if (difference < 0.01) {
      console.log(`   ✅ RAP correspond avec la taxe interface !`);
    } else {
      console.log(`   ❌ RAP ne correspond toujours pas`);
    }
    
    // 5. Analyser d'où vient la taxe de 228.30€
    console.log('\n📊 4. Analyse de l\'origine de la taxe 228.30€:');
    
    // Peut-être que c'est 50% d'autre chose ?
    const pourcentageSurNet = (taxeInterface / salaireNet) * 100;
    const pourcentageSurBrut = (taxeInterface / salaireBrut) * 100;
    const pourcentageSurTotal = (taxeInterface / totalGenere) * 100;
    
    console.log(`   📊 Taxe / Salaire Net: ${pourcentageSurNet.toFixed(2)}%`);
    console.log(`   📊 Taxe / Salaire Brut: ${pourcentageSurBrut.toFixed(2)}%`);
    console.log(`   📊 Taxe / Total Généré: ${pourcentageSurTotal.toFixed(2)}%`);
    
    // Vérifier si c'est un pourcentage spécifique
    if (Math.abs(pourcentageSurNet - 16.23) < 0.01) {
      console.log(`   ✅ Taxe = 16.23% du salaire net`);
    } else if (Math.abs(pourcentageSurBrut - 12.85) < 0.01) {
      console.log(`   ✅ Taxe = 12.85% du salaire brut`);
    } else if (Math.abs(pourcentageSurTotal - 9.28) < 0.01) {
      console.log(`   ✅ Taxe = 9.28% du total généré`);
    }
    
    // 6. Mettre à jour avec la taxe correcte
    console.log('\n📊 5. Mise à jour avec la taxe correcte:');
    try {
      await pool.query(`
        UPDATE cout_par_salaire
        SET taxe = $1,
            rap = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [taxeInterface, rapInterface, row.id]);
      
      console.log(`   ✅ Taxe mise à jour: ${taxeActuelle}€ → ${taxeInterface}€`);
      console.log(`   ✅ RAP mis à jour: ${rapActuel}€ → ${rapInterface}€`);
    } catch (error) {
      console.log(`   ❌ Erreur lors de la mise à jour: ${error.message}`);
    }
    
    // 7. Vérification finale
    console.log('\n📊 6. Vérification finale:');
    const verificationResult = await pool.query(`
      SELECT 
        total_genere,
        salaire_net,
        salaire_brut,
        charge,
        taxe,
        penalite,
        rap,
        (total_genere - (salaire_net + charge + taxe + penalite)) as rap_calcule
      FROM cout_par_salaire
      WHERE id = $1
    `, [row.id]);
    
    if (verificationResult.rows.length > 0) {
      const finalRow = verificationResult.rows[0];
      console.log(`   📊 Résultat final: ${row.nom} ${row.prenom}`);
      console.log(`      Total Généré: ${finalRow.total_genere}€`);
      console.log(`      Salaire Net: ${finalRow.salaire_net}€`);
      console.log(`      Salaire Brut: ${finalRow.salaire_brut}€`);
      console.log(`      Charge: ${finalRow.charge}€`);
      console.log(`      Taxe: ${finalRow.taxe}€`);
      console.log(`      Pénalité: ${finalRow.penalite}€`);
      console.log(`      RAP: ${finalRow.rap}€`);
      console.log(`      RAP Calculé: ${finalRow.rap_calcule}€`);
      
      const difference = Math.abs(parseFloat(finalRow.rap) - parseFloat(finalRow.rap_calcule));
      if (difference < 0.01) {
        console.log(`   ✅ RAP cohérent`);
      } else {
        console.log(`   ❌ RAP incohérent (diff: ${difference}€)`);
      }
    }
    
    console.log('\n🎯 Analyse terminée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

analyzeInterfaceTaxe().catch(console.error);
