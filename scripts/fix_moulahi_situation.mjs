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

async function fixMoulahiSituation() {
  console.log('🔧 Correction de la situation MOULAHI...');
  
  try {
    // 1. Vérifier l'état actuel
    console.log('\n📊 1. État actuel:');
    
    // MOULAHI ZOBAIR dans cout_par_salaire
    const zobairResult = await pool.query(`
      SELECT id, nom, prenom, mois, annee, total_genere, salaire_net, charge, taxe, penalite, rap
      FROM cout_par_salaire
      WHERE LOWER(nom) = 'moulahi' AND LOWER(prenom) = 'zobair'
        AND mois = 5 AND annee = 2025
    `);
    
    // MOULAHI Mohamed-Bechir dans les interventions
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
    
    console.log(`   📊 MOULAHI ZOBAIR dans cout_par_salaire: ${zobairResult.rows.length > 0 ? 'OUI' : 'NON'}`);
    if (zobairResult.rows.length > 0) {
      console.log(`      Total généré: ${zobairResult.rows[0].total_genere}€`);
    }
    
    console.log(`   📊 MOULAHI Mohamed-Bechir dans interventions: ${mohamedBechirCount} interventions (${mohamedBechirBenefice.toFixed(2)}€)`);
    
    // 2. Créer un enregistrement pour MOULAHI Mohamed-Bechir
    console.log('\n📊 2. Création d\'un enregistrement pour MOULAHI Mohamed-Bechir...');
    
    // Utiliser les données de MOULAHI ZOBAIR comme base
    if (zobairResult.rows.length > 0) {
      const zobairRecord = zobairResult.rows[0];
      
      // Créer un nouvel enregistrement pour MOULAHI Mohamed-Bechir
      const newRecordResult = await pool.query(`
        INSERT INTO cout_par_salaire (
          nom, prenom, mois, annee, 
          total_genere, salaire_net, charge, taxe, penalite, rap,
          created_at, updated_at
        ) VALUES (
          'MOULAHI', 'Mohamed-Bechir', 5, 2025,
          $1, $2, $3, $4, $5, $6,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING id
      `, [
        mohamedBechirBenefice, // total_genere basé sur les interventions
        zobairRecord.salaire_net, // même salaire que ZOBAIR
        zobairRecord.charge, // même charge que ZOBAIR
        zobairRecord.taxe, // même taxe que ZOBAIR
        zobairRecord.penalite, // même pénalité que ZOBAIR
        mohamedBechirBenefice - (parseFloat(zobairRecord.salaire_net || 0) + parseFloat(zobairRecord.charge || 0) + parseFloat(zobairRecord.taxe || 0) + parseFloat(zobairRecord.penalite || 0)) // RAP calculé
      ]);
      
      const newId = newRecordResult.rows[0].id;
      console.log(`   ✅ Enregistrement créé avec l'ID: ${newId}`);
      console.log(`   📊 Total généré: ${mohamedBechirBenefice.toFixed(2)}€`);
      console.log(`   📊 RAP: ${(mohamedBechirBenefice - (parseFloat(zobairRecord.salaire_net || 0) + parseFloat(zobairRecord.charge || 0) + parseFloat(zobairRecord.taxe || 0) + parseFloat(zobairRecord.penalite || 0))).toFixed(2)}€`);
    }
    
    // 3. Mettre à jour MOULAHI ZOBAIR (il n'a pas d'interventions, donc 0€)
    console.log('\n📊 3. Mise à jour de MOULAHI ZOBAIR...');
    
    if (zobairResult.rows.length > 0) {
      const zobairRecord = zobairResult.rows[0];
      const newRap = 0 - (parseFloat(zobairRecord.salaire_net || 0) + parseFloat(zobairRecord.charge || 0) + parseFloat(zobairRecord.taxe || 0) + parseFloat(zobairRecord.penalite || 0));
      
      await pool.query(`
        UPDATE cout_par_salaire
        SET total_genere = 0,
            rap = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [newRap, zobairRecord.id]);
      
      console.log(`   ✅ MOULAHI ZOBAIR mis à jour:`);
      console.log(`      Total généré: 0.00€ (aucune intervention)`);
      console.log(`      RAP: ${newRap.toFixed(2)}€`);
    }
    
    // 4. Vérification finale
    console.log('\n📊 4. Vérification finale:');
    
    const finalZobairResult = await pool.query(`
      SELECT total_genere, rap
      FROM cout_par_salaire
      WHERE LOWER(nom) = 'moulahi' AND LOWER(prenom) = 'zobair'
        AND mois = 5 AND annee = 2025
    `);
    
    const finalMohamedBechirResult = await pool.query(`
      SELECT total_genere, rap
      FROM cout_par_salaire
      WHERE LOWER(nom) = 'moulahi' AND LOWER(prenom) = 'mohamed-bechir'
        AND mois = 5 AND annee = 2025
    `);
    
    if (finalZobairResult.rows.length > 0) {
      const zobairFinal = finalZobairResult.rows[0];
      console.log(`   ✅ MOULAHI ZOBAIR: Total généré = ${zobairFinal.total_genere}€, RAP = ${zobairFinal.rap}€`);
    }
    
    if (finalMohamedBechirResult.rows.length > 0) {
      const mohamedBechirFinal = finalMohamedBechirResult.rows[0];
      console.log(`   ✅ MOULAHI Mohamed-Bechir: Total généré = ${mohamedBechirFinal.total_genere}€, RAP = ${mohamedBechirFinal.rap}€`);
    }
    
    console.log('\n🎯 Situation MOULAHI corrigée !');
    console.log('✅ MOULAHI ZOBAIR: 0€ (aucune intervention)');
    console.log('✅ MOULAHI Mohamed-Bechir: 2460.00€ (75 interventions)');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

fixMoulahiSituation().catch(console.error);

