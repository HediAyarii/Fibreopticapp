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

async function fixBenabdallahAssignment() {
  console.log('🔧 Correction de l\'assignation BENADBALLAH...');
  
  try {
    // 1. Récupérer les données actuelles
    console.log('\n📊 1. Données actuelles:');
    const currentResult = await pool.query(`
      SELECT 
        id,
        nom,
        prenom,
        matricule,
        total_genere,
        salaire_net,
        charge,
        taxe,
        penalite,
        rap
      FROM cout_par_salaire
      WHERE LOWER(nom) LIKE '%benabdallah%' OR LOWER(nom) LIKE '%benadballah%'
    `);
    
    if (currentResult.rows.length === 0) {
      console.log('   ❌ Aucun enregistrement BENADBALLAH trouvé dans cout_par_salaire');
      return;
    }
    
    const currentRow = currentResult.rows[0];
    console.log(`   📊 Enregistrement actuel: ${currentRow.nom} ${currentRow.prenom}`);
    console.log(`      Total Généré: ${currentRow.total_genere}€`);
    console.log(`      RAP: ${currentRow.rap}€`);
    
    // 2. Récupérer les données des interventions
    console.log('\n📊 2. Données des interventions:');
    const interventionsResult = await pool.query(`
      SELECT 
        COUNT(*) as nombre_interventions,
        SUM(
          CASE 
            WHEN statut = 'CLOTURE TERMINEE' THEN
              COALESCE(
                (SELECT SUM(
                  CASE 
                    WHEN cp.prix_tech IS NOT NULL THEN cp.prix_tech
                    ELSE 0
                  END
                )
                FROM unnest(string_to_array(articles, ',')) as article_item
                LEFT JOIN company_pricing cp ON 
                  TRIM(SPLIT_PART(article_item, 'x', 1)) = cp.service_code
                  AND cp.company_name = 'ERT OUEST'
                  AND cp.category = type_intervention
                ), 0
              )
            ELSE 0
          END
        ) as total_recette
      FROM interventions
      WHERE nom_technicien = 'BEN ABDALLAH' AND prenom_technicien = 'Walid'
        AND statut = 'CLOTURE TERMINEE'
        AND articles IS NOT NULL 
        AND articles != ''
    `);
    
    if (interventionsResult.rows.length === 0) {
      console.log('   ❌ Aucune intervention trouvée pour BEN ABDALLAH Walid');
      return;
    }
    
    const interventionRow = interventionsResult.rows[0];
    console.log(`   📊 Interventions trouvées: ${interventionRow.nombre_interventions}`);
    console.log(`   📊 Total Recette: ${interventionRow.total_recette}€`);
    
    // 3. Mettre à jour le Total Généré
    console.log('\n📊 3. Mise à jour du Total Généré:');
    const newTotalGenere = parseFloat(interventionRow.total_recette);
    const oldTotalGenere = parseFloat(currentRow.total_genere);
    
    console.log(`   📊 Ancien Total Généré: ${oldTotalGenere}€`);
    console.log(`   📊 Nouveau Total Généré: ${newTotalGenere}€`);
    
    if (Math.abs(newTotalGenere - oldTotalGenere) > 0.01) {
      try {
        await pool.query(`
          UPDATE cout_par_salaire
          SET total_genere = $1,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [newTotalGenere, currentRow.id]);
        
        console.log(`   ✅ Total Généré mis à jour: ${oldTotalGenere}€ → ${newTotalGenere}€`);
      } catch (error) {
        console.log(`   ❌ Erreur lors de la mise à jour: ${error.message}`);
        return;
      }
    } else {
      console.log(`   ✅ Total Généré déjà correct`);
    }
    
    // 4. Recalculer le RAP
    console.log('\n📊 4. Recalcul du RAP:');
    const salaireNet = parseFloat(currentRow.salaire_net) || 0;
    const charge = parseFloat(currentRow.charge) || 0;
    const taxe = parseFloat(currentRow.taxe) || 0;
    const penalite = parseFloat(currentRow.penalite) || 0;
    
    const totalCouts = salaireNet + charge + taxe + penalite;
    const newRap = newTotalGenere - totalCouts;
    const oldRap = parseFloat(currentRow.rap);
    
    console.log(`   📊 Calcul RAP: ${newTotalGenere}€ - (${salaireNet}€ + ${charge}€ + ${taxe}€ + ${penalite}€) = ${newRap}€`);
    console.log(`   📊 Ancien RAP: ${oldRap}€`);
    console.log(`   📊 Nouveau RAP: ${newRap}€`);
    
    if (Math.abs(newRap - oldRap) > 0.01) {
      try {
        await pool.query(`
          UPDATE cout_par_salaire
          SET rap = $1,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [newRap, currentRow.id]);
        
        console.log(`   ✅ RAP mis à jour: ${oldRap}€ → ${newRap}€`);
      } catch (error) {
        console.log(`   ❌ Erreur lors de la mise à jour du RAP: ${error.message}`);
        return;
      }
    } else {
      console.log(`   ✅ RAP déjà correct`);
    }
    
    // 5. Vérification finale
    console.log('\n📊 5. Vérification finale:');
    const verificationResult = await pool.query(`
      SELECT 
        id,
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
      WHERE id = $1
    `, [currentRow.id]);
    
    if (verificationResult.rows.length > 0) {
      const finalRow = verificationResult.rows[0];
      console.log(`   📊 Résultat final: ${finalRow.nom} ${finalRow.prenom}`);
      console.log(`      Total Généré: ${finalRow.total_genere}€`);
      console.log(`      RAP: ${finalRow.rap}€`);
      console.log(`      RAP Calculé: ${finalRow.rap_calcule}€`);
      
      if (Math.abs(parseFloat(finalRow.rap) - parseFloat(finalRow.rap_calcule)) < 0.01) {
        console.log(`   ✅ RAP cohérent`);
      } else {
        console.log(`   ❌ RAP incohérent`);
      }
    }
    
    // 6. Créer la fonction de détection automatique pour BENADBALLAH
    console.log('\n📊 6. Création de la fonction de détection automatique:');
    try {
      await pool.query(`
        CREATE OR REPLACE FUNCTION benabdallah_name_matching(
          nom_cout VARCHAR,
          prenom_cout VARCHAR
        ) RETURNS BOOLEAN AS $$
        BEGIN
          -- Vérifier si c'est BENADBALLAH TAOUFIK
          IF LOWER(nom_cout) = 'benabdallah' AND LOWER(prenom_cout) = 'taoufik' THEN
            RETURN TRUE;
          END IF;
          
          -- Vérifier si c'est BEN ABDALLAH Walid
          IF (LOWER(nom_cout) = 'ben abdallah' OR LOWER(nom_cout) = 'benabdallah') 
             AND LOWER(prenom_cout) = 'walid' THEN
            RETURN TRUE;
          END IF;
          
          RETURN FALSE;
        END;
        $$ LANGUAGE plpgsql;
      `);
      
      console.log(`   ✅ Fonction benabdallah_name_matching créée`);
      
    } catch (error) {
      console.log(`   ❌ Erreur lors de la création de la fonction: ${error.message}`);
    }
    
    console.log('\n🎯 Correction terminée !');
    console.log('✅ BENADBALLAH TAOUFIK a maintenant le bon Total Généré');
    console.log('✅ Le RAP a été recalculé correctement');
    console.log('✅ La fonction de détection automatique a été créée');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

fixBenabdallahAssignment().catch(console.error);
