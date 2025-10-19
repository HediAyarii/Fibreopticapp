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

async function fixAllRapCalculations() {
  console.log('🔧 Correction de tous les calculs RAP...');
  
  try {
    // 1. Récupérer tous les enregistrements avec RAP incorrect
    console.log('\n📊 1. Récupération des enregistrements à corriger:');
    const allResult = await pool.query(`
      SELECT 
        id,
        nom,
        prenom,
        matricule,
        mois,
        annee,
        total_genere,
        salaire_net,
        charge,
        taxe,
        penalite,
        rap
      FROM cout_par_salaire
      WHERE mois = 5 AND annee = 2025
      ORDER BY nom, prenom
    `);
    
    console.log(`   📊 Enregistrements trouvés: ${allResult.rows.length}`);
    
    // 2. Récupérer les paiements existants
    console.log('\n📊 2. Récupération des paiements existants:');
    const paiementsResult = await pool.query(`
      SELECT 
        pe.cout_par_salaire_id,
        SUM(pe.montant_verse) as total_paiements
      FROM paiements_employes pe
      GROUP BY pe.cout_par_salaire_id
    `);
    
    const paiementsMap = new Map();
    paiementsResult.rows.forEach(row => {
      paiementsMap.set(row.cout_par_salaire_id, parseFloat(row.total_paiements));
    });
    
    console.log(`   📊 Coûts avec paiements: ${paiementsResult.rows.length}`);
    
    // 3. Calculer et corriger chaque RAP
    console.log('\n📊 3. Correction des RAP:');
    let correctedCount = 0;
    let skippedCount = 0;
    
    for (const row of allResult.rows) {
      const totalGenere = parseFloat(row.total_genere) || 0;
      const salaireNet = parseFloat(row.salaire_net) || 0;
      const charge = parseFloat(row.charge) || 0;
      const taxe = parseFloat(row.taxe) || 0;
      const penalite = parseFloat(row.penalite) || 0;
      const rapActuel = parseFloat(row.rap) || 0;
      
      const totalCouts = salaireNet + charge + taxe + penalite;
      const paiements = paiementsMap.get(row.id) || 0;
      const rapCorrect = totalGenere - totalCouts - paiements;
      
      const difference = Math.abs(rapActuel - rapCorrect);
      
      if (difference > 0.01) {
        try {
          await pool.query(`
            UPDATE cout_par_salaire
            SET rap = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [rapCorrect, row.id]);
          
          console.log(`   ✅ ${row.nom} ${row.prenom}:`);
          console.log(`      RAP: ${rapActuel}€ → ${rapCorrect}€`);
          console.log(`      Calcul: ${totalGenere}€ - (${totalCouts}€ + ${paiements}€) = ${rapCorrect}€`);
          correctedCount++;
        } catch (error) {
          console.log(`   ❌ Erreur pour ${row.nom} ${row.prenom}: ${error.message}`);
        }
      } else {
        console.log(`   ⏭️  ${row.nom} ${row.prenom}: RAP déjà correct (${rapActuel}€)`);
        skippedCount++;
      }
    }
    
    console.log(`\n📊 4. Résumé des corrections:`);
    console.log(`   📊 RAP corrigés: ${correctedCount}`);
    console.log(`   📊 RAP déjà corrects: ${skippedCount}`);
    console.log(`   📊 Total traités: ${correctedCount + skippedCount}`);
    
    // 5. Vérification finale
    console.log('\n📊 5. Vérification finale:');
    const verificationResult = await pool.query(`
      SELECT 
        nom,
        prenom,
        total_genere,
        salaire_net,
        charge,
        taxe,
        penalite,
        rap,
        (total_genere - (salaire_net + charge + taxe + penalite)) as rap_calcule
      FROM cout_par_salaire
      WHERE mois = 5 AND annee = 2025
      ORDER BY nom, prenom
    `);
    
    let finalCorrectCount = 0;
    let finalIncorrectCount = 0;
    
    for (const row of verificationResult.rows) {
      const paiements = paiementsMap.get(row.id) || 0;
      const rapCorrect = parseFloat(row.rap_calcule) - paiements;
      const difference = Math.abs(parseFloat(row.rap) - rapCorrect);
      
      if (difference < 0.01) {
        finalCorrectCount++;
        console.log(`   ✅ ${row.nom} ${row.prenom}: RAP correct (${row.rap}€)`);
      } else {
        finalIncorrectCount++;
        console.log(`   ❌ ${row.nom} ${row.prenom}: RAP incorrect (${row.rap}€ vs ${rapCorrect}€)`);
      }
    }
    
    console.log(`\n📊 6. Résultat final:`);
    console.log(`   📊 RAP corrects: ${finalCorrectCount}`);
    console.log(`   📊 RAP incorrects: ${finalIncorrectCount}`);
    
    if (finalIncorrectCount === 0) {
      console.log(`\n🎉 TOUS LES RAP SONT MAINTENANT CORRECTS !`);
    } else {
      console.log(`\n⚠️  ${finalIncorrectCount} RAP restent incorrects`);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

fixAllRapCalculations().catch(console.error);