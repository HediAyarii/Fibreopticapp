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

async function fixBenabdallahCorrespondence() {
  console.log('🔧 Correction de la correspondance BENADBALLAH...');
  
  try {
    // 1. Calculer le bénéfice brut pour BEN ABDALLAH Walid
    console.log('\n📊 1. Calcul du bénéfice brut pour BEN ABDALLAH Walid:');
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
        AND LOWER(i.nom_technicien) = 'ben abdallah'
        AND LOWER(i.prenom_technicien) = 'walid'
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
    console.log(`   Bénéfice brut calculé: ${beneficeTotal.toFixed(2)}€`);
    
    // 2. Récupérer l'enregistrement cout_par_salaire pour BENADBALLAH TAOUFIK
    console.log('\n📊 2. Récupération de l\'enregistrement cout_par_salaire:');
    const coutResult = await pool.query(`
      SELECT id, nom, prenom, mois, annee, total_genere, salaire_net, charge, taxe, penalite
      FROM cout_par_salaire
      WHERE LOWER(nom) = 'benadballah' AND LOWER(prenom) = 'taoufik'
        AND mois = 5 AND annee = 2025
    `);
    
    if (coutResult.rows.length === 0) {
      console.log('   ❌ Aucun enregistrement trouvé pour BENADBALLAH TAOUFIK');
      return;
    }
    
    const coutRecord = coutResult.rows[0];
    console.log(`   Enregistrement trouvé: ID ${coutRecord.id}`);
    console.log(`   Ancien total_genere: ${coutRecord.total_genere}€`);
    
    // 3. Mettre à jour le total_genere
    console.log('\n📊 3. Mise à jour du total_genere:');
    await pool.query(`
      UPDATE cout_par_salaire
      SET total_genere = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [beneficeTotal, coutRecord.id]);
    
    console.log(`   ✅ Total généré mis à jour: ${coutRecord.total_genere}€ → ${beneficeTotal.toFixed(2)}€`);
    
    // 4. Recalculer le RAP
    console.log('\n📊 4. Recalcul du RAP:');
    const newRapResult = await pool.query(
      `SELECT calculer_rap_avec_paiements($1, $2, $3, $4, $5)`,
      [beneficeTotal, coutRecord.salaire_net, coutRecord.charge, coutRecord.taxe, coutRecord.penalite]
    );
    const newRap = newRapResult.rows[0].calculer_rap_avec_paiements;
    
    await pool.query(
      `UPDATE cout_par_salaire
       SET rap = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [newRap, coutRecord.id]
    );
    
    console.log(`   ✅ RAP recalculé: ${newRap.toFixed(2)}€`);
    
    // 5. Vérification finale
    console.log('\n📊 5. Vérification finale:');
    const finalResult = await pool.query(`
      SELECT total_genere, rap
      FROM cout_par_salaire
      WHERE id = $1
    `, [coutRecord.id]);
    
    const finalRecord = finalResult.rows[0];
    console.log(`   ✅ Vérification: Total généré = ${finalRecord.total_genere}€, RAP = ${finalRecord.rap}€`);
    
    console.log('\n🎯 Correspondance corrigée avec succès !');
    console.log('   BEN ABDALLAH Walid (interventions) ↔ BENADBALLAH TAOUFIK (cout_par_salaire)');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

fixBenabdallahCorrespondence().catch(console.error);

