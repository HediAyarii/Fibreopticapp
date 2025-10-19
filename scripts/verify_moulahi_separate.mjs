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

async function verifyMoulahiSeparate() {
  console.log('🔍 Vérification séparée de MOULAHI ZOBAIR et MOULAHI Mohamed-Bechir...');
  
  try {
    // 1. Vérifier MOULAHI ZOBAIR dans cout_par_salaire
    console.log('\n📊 1. MOULAHI ZOBAIR dans cout_par_salaire:');
    const zobairResult = await pool.query(`
      SELECT id, nom, prenom, mois, annee, total_genere, salaire_net, charge, taxe, penalite, rap
      FROM cout_par_salaire
      WHERE LOWER(nom) = 'moulahi' AND LOWER(prenom) = 'zobair'
        AND mois = 5 AND annee = 2025
    `);
    
    if (zobairResult.rows.length > 0) {
      const zobairRecord = zobairResult.rows[0];
      console.log(`   📊 ID: ${zobairRecord.id}`);
      console.log(`   📊 Nom: ${zobairRecord.nom} ${zobairRecord.prenom}`);
      console.log(`   📊 Total généré: ${zobairRecord.total_genere}€`);
      console.log(`   📊 RAP: ${zobairRecord.rap}€`);
    } else {
      console.log('   ❌ Aucun enregistrement trouvé pour MOULAHI ZOBAIR');
    }
    
    // 2. Vérifier MOULAHI Mohamed-Bechir dans cout_par_salaire
    console.log('\n📊 2. MOULAHI Mohamed-Bechir dans cout_par_salaire:');
    const mohamedBechirResult = await pool.query(`
      SELECT id, nom, prenom, mois, annee, total_genere, salaire_net, charge, taxe, penalite, rap
      FROM cout_par_salaire
      WHERE LOWER(nom) = 'moulahi' AND LOWER(prenom) = 'mohamed-bechir'
        AND mois = 5 AND annee = 2025
    `);
    
    if (mohamedBechirResult.rows.length > 0) {
      const mohamedBechirRecord = mohamedBechirResult.rows[0];
      console.log(`   📊 ID: ${mohamedBechirRecord.id}`);
      console.log(`   📊 Nom: ${mohamedBechirRecord.nom} ${mohamedBechirRecord.prenom}`);
      console.log(`   📊 Total généré: ${mohamedBechirRecord.total_genere}€`);
      console.log(`   📊 RAP: ${mohamedBechirRecord.rap}€`);
    } else {
      console.log('   ❌ Aucun enregistrement trouvé pour MOULAHI Mohamed-Bechir');
    }
    
    // 3. Vérifier les interventions pour MOULAHI ZOBAIR
    console.log('\n📊 3. Interventions pour MOULAHI ZOBAIR:');
    const zobairInterventionsResult = await pool.query(`
      SELECT COUNT(*) as count,
             COALESCE(SUM(
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
      WHERE LOWER(i.nom_technicien) = 'moulahi'
        AND LOWER(i.prenom_technicien) = 'zobair'
        AND i.statut = 'CLOTURE TERMINEE'
        AND i.articles IS NOT NULL 
        AND i.articles != ''
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
    
    const zobairCount = parseInt(zobairInterventionsResult.rows[0].count);
    const zobairBenefice = parseFloat(zobairInterventionsResult.rows[0].benefice_total || 0);
    console.log(`   📊 Nombre d'interventions: ${zobairCount}`);
    console.log(`   📊 Bénéfice total: ${zobairBenefice.toFixed(2)}€`);
    
    // 4. Vérifier les interventions pour MOULAHI Mohamed-Bechir
    console.log('\n📊 4. Interventions pour MOULAHI Mohamed-Bechir:');
    const mohamedBechirInterventionsResult = await pool.query(`
      SELECT COUNT(*) as count,
             COALESCE(SUM(
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
      WHERE LOWER(i.nom_technicien) = 'moulahi'
        AND LOWER(i.prenom_technicien) = 'mohamed-bechir'
        AND i.statut = 'CLOTURE TERMINEE'
        AND i.articles IS NOT NULL 
        AND i.articles != ''
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
    
    const mohamedBechirCount = parseInt(mohamedBechirInterventionsResult.rows[0].count);
    const mohamedBechirBenefice = parseFloat(mohamedBechirInterventionsResult.rows[0].benefice_total || 0);
    console.log(`   📊 Nombre d'interventions: ${mohamedBechirCount}`);
    console.log(`   📊 Bénéfice total: ${mohamedBechirBenefice.toFixed(2)}€`);
    
    // 5. Analyser la situation
    console.log('\n📊 5. Analyse de la situation:');
    
    if (zobairResult.rows.length > 0 && mohamedBechirResult.rows.length > 0) {
      console.log('   ✅ Les deux personnes existent dans cout_par_salaire');
      
      const zobairTotal = parseFloat(zobairResult.rows[0].total_genere || 0);
      const mohamedBechirTotal = parseFloat(mohamedBechirResult.rows[0].total_genere || 0);
      
      console.log(`   📊 MOULAHI ZOBAIR: ${zobairTotal.toFixed(2)}€ (interventions: ${zobairBenefice.toFixed(2)}€)`);
      console.log(`   📊 MOULAHI Mohamed-Bechir: ${mohamedBechirTotal.toFixed(2)}€ (interventions: ${mohamedBechirBenefice.toFixed(2)}€)`);
      
      // Vérifier les correspondances
      const zobairDiff = Math.abs(zobairTotal - zobairBenefice);
      const mohamedBechirDiff = Math.abs(mohamedBechirTotal - mohamedBechirBenefice);
      
      if (zobairDiff < 0.01) {
        console.log(`   ✅ MOULAHI ZOBAIR: correspondance parfaite`);
      } else {
        console.log(`   ⚠️ MOULAHI ZOBAIR: différence de ${zobairDiff.toFixed(2)}€`);
      }
      
      if (mohamedBechirDiff < 0.01) {
        console.log(`   ✅ MOULAHI Mohamed-Bechir: correspondance parfaite`);
      } else {
        console.log(`   ⚠️ MOULAHI Mohamed-Bechir: différence de ${mohamedBechirDiff.toFixed(2)}€`);
      }
      
    } else if (zobairResult.rows.length > 0) {
      console.log('   📊 Seul MOULAHI ZOBAIR existe dans cout_par_salaire');
      console.log('   💡 MOULAHI Mohamed-Bechir n\'a pas d\'enregistrement dans cout_par_salaire');
      
    } else if (mohamedBechirResult.rows.length > 0) {
      console.log('   📊 Seul MOULAHI Mohamed-Bechir existe dans cout_par_salaire');
      console.log('   💡 MOULAHI ZOBAIR n\'a pas d\'enregistrement dans cout_par_salaire');
      
    } else {
      console.log('   ❌ Aucun des deux n\'existe dans cout_par_salaire');
    }
    
    // 6. Recommandations
    console.log('\n📊 6. Recommandations:');
    
    if (zobairCount > 0 && zobairResult.rows.length === 0) {
      console.log('   🔧 Créer un enregistrement pour MOULAHI ZOBAIR dans cout_par_salaire');
    }
    
    if (mohamedBechirCount > 0 && mohamedBechirResult.rows.length === 0) {
      console.log('   🔧 Créer un enregistrement pour MOULAHI Mohamed-Bechir dans cout_par_salaire');
    }
    
    if (zobairResult.rows.length > 0 && zobairDiff > 0.01) {
      console.log('   🔧 Corriger le Total généré pour MOULAHI ZOBAIR');
    }
    
    if (mohamedBechirResult.rows.length > 0 && mohamedBechirDiff > 0.01) {
      console.log('   🔧 Corriger le Total généré pour MOULAHI Mohamed-Bechir');
    }
    
    console.log('\n🎯 Vérification terminée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

verifyMoulahiSeparate().catch(console.error);

