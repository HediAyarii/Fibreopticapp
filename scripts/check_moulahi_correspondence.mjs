import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024',
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function checkMoulahiCorrespondence() {
  console.log('🔍 Vérification de la correspondance MOULAHI...');
  
  try {
    // 1. Calculer le bénéfice brut pour MOULAHI Mohamed-Bechir
    console.log('\n📊 1. Calcul du bénéfice brut pour MOULAHI Mohamed-Bechir:');
    const beneficeResult = await pool.query(`
      SELECT COALESCE(SUM(
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
      ), 0) as benefice_total
      FROM interventions i
      WHERE i.statut = 'CLOTURE TERMINEE'
        AND i.articles IS NOT NULL 
        AND i.articles != ''
        AND LOWER(i.nom_technicien) = 'moulahi'
        AND LOWER(i.prenom_technicien) = 'mohamed-bechir'
        AND (
          (i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND 
           i.cloture_tech ~ '^[0-9]' AND 
           (i.cloture_tech::date >= '2025-05-01' AND i.cloture_tech::date <= '2025-05-31')) OR
          (i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND 
           i.cloture_hotline ~ '^[0-9]' AND 
           (i.cloture_hotline::date >= '2025-05-01' AND i.cloture_hotline::date <= '2025-05-31')) OR
          (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND 
           i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND 
           i.date_rdv ~ '^[0-9]' AND 
           (i.date_rdv::date >= '2025-05-01' AND i.date_rdv::date <= '2025-05-31'))
        )
    `);
    
    const beneficeTotal = parseFloat(beneficeResult.rows[0]?.benefice_total || 0);
    console.log(`   📊 Bénéfice brut calculé: ${beneficeTotal.toFixed(2)}€`);
    
    // 2. Comparer avec MOULAHI ZOBAIR
    console.log('\n📊 2. Comparaison avec MOULAHI ZOBAIR:');
    const coutResult = await pool.query(`
      SELECT total_genere, salaire_net, charge, taxe, penalite, rap
      FROM cout_par_salaire
      WHERE LOWER(nom) = 'moulahi' AND LOWER(prenom) = 'zobair'
        AND mois = 5 AND annee = 2025
    `);
    
    if (coutResult.rows.length > 0) {
      const coutRecord = coutResult.rows[0];
      const totalGenere = parseFloat(coutRecord.total_genere || 0);
      console.log(`   📊 Total généré actuel: ${totalGenere.toFixed(2)}€`);
      console.log(`   📊 Bénéfice brut calculé: ${beneficeTotal.toFixed(2)}€`);
      
      const difference = Math.abs(totalGenere - beneficeTotal);
      console.log(`   📊 Différence: ${difference.toFixed(2)}€`);
      
      if (difference < 0.01) {
        console.log(`   ✅ Correspondance parfaite !`);
      } else {
        console.log(`   ⚠️ Différence significative: ${difference.toFixed(2)}€`);
        
        // 3. Proposer la correction
        console.log('\n📊 3. Proposition de correction:');
        console.log(`   🔧 Mettre à jour MOULAHI ZOBAIR avec le bénéfice brut calculé`);
        console.log(`   📊 Nouveau total généré: ${beneficeTotal.toFixed(2)}€`);
        
        // Calculer le nouveau RAP
        const salaireNet = parseFloat(coutRecord.salaire_net || 0);
        const charge = parseFloat(coutRecord.charge || 0);
        const taxe = parseFloat(coutRecord.taxe || 0);
        const penalite = parseFloat(coutRecord.penalite || 0);
        
        const newRap = beneficeTotal - (salaireNet + charge + taxe + penalite);
        console.log(`   📊 Nouveau RAP: ${newRap.toFixed(2)}€`);
        
        // 4. Appliquer la correction
        console.log('\n📊 4. Application de la correction...');
        await pool.query(
          `UPDATE cout_par_salaire
           SET total_genere = $1,
               rap = $2,
               updated_at = CURRENT_TIMESTAMP
           WHERE LOWER(nom) = 'moulahi' AND LOWER(prenom) = 'zobair'
             AND mois = 5 AND annee = 2025`,
          [beneficeTotal, newRap]
        );
        
        console.log(`   ✅ MOULAHI ZOBAIR mis à jour:`);
        console.log(`      Total généré: ${beneficeTotal.toFixed(2)}€`);
        console.log(`      RAP: ${newRap.toFixed(2)}€`);
        
        // 5. Vérification finale
        console.log('\n📊 5. Vérification finale:');
        const finalResult = await pool.query(`
          SELECT total_genere, rap
          FROM cout_par_salaire
          WHERE LOWER(nom) = 'moulahi' AND LOWER(prenom) = 'zobair'
            AND mois = 5 AND annee = 2025
        `);
        
        if (finalResult.rows.length > 0) {
          const finalRecord = finalResult.rows[0];
          console.log(`   ✅ Total généré final: ${finalRecord.total_genere}€`);
          console.log(`   ✅ RAP final: ${finalRecord.rap}€`);
        }
      }
    } else {
      console.log('   ❌ Aucun enregistrement trouvé pour MOULAHI ZOBAIR');
    }
    
    console.log('\n🎯 Vérification terminée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

checkMoulahiCorrespondence().catch(console.error);

