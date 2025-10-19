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

async function verifyBenabdallahFix() {
  console.log('✅ Vérification de la correction BENADBALLAH...');
  
  try {
    // 1. Vérifier l'état actuel dans cout_par_salaire
    console.log('\n📊 1. État actuel dans cout_par_salaire:');
    const coutResult = await pool.query(`
      SELECT id, nom, prenom, mois, annee, total_genere, salaire_net, charge, taxe, penalite, rap
      FROM cout_par_salaire
      WHERE LOWER(nom) = 'benadballah' AND LOWER(prenom) = 'taoufik'
        AND mois = 5 AND annee = 2025
    `);
    
    if (coutResult.rows.length === 0) {
      console.log('   ❌ Aucun enregistrement trouvé');
      return;
    }
    
    const record = coutResult.rows[0];
    console.log(`   ✅ Enregistrement trouvé: ${record.nom} ${record.prenom}`);
    console.log(`   📊 Total généré: ${record.total_genere}€`);
    console.log(`   📊 Salaire net: ${record.salaire_net}€`);
    console.log(`   📊 Charge: ${record.charge}€`);
    console.log(`   📊 Taxe: ${record.taxe}€`);
    console.log(`   📊 Pénalité: ${record.penalite}€`);
    console.log(`   📊 RAP: ${record.rap}€`);
    
    // 2. Vérifier le bénéfice brut calculé
    console.log('\n📊 2. Vérification du bénéfice brut:');
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
    console.log(`   📊 Bénéfice brut calculé: ${beneficeTotal.toFixed(2)}€`);
    
    // 3. Vérifier la cohérence
    console.log('\n📊 3. Vérification de la cohérence:');
    const isConsistent = Math.abs(record.total_genere - beneficeTotal) < 0.01;
    console.log(`   ${isConsistent ? '✅' : '❌'} Cohérence: ${isConsistent ? 'OK' : 'PROBLÈME'}`);
    console.log(`   📊 Différence: ${Math.abs(record.total_genere - beneficeTotal).toFixed(2)}€`);
    
    // 4. Calculer le RAP manuellement si nécessaire
    if (!isConsistent) {
      console.log('\n📊 4. Recalcul manuel du RAP:');
      const totalGenere = beneficeTotal;
      const salaireNet = parseFloat(record.salaire_net || 0);
      const charge = parseFloat(record.charge || 0);
      const taxe = parseFloat(record.taxe || 0);
      const penalite = parseFloat(record.penalite || 0);
      
      // RAP = Total généré - (Salaire net + Charge + Taxe + Pénalité)
      const rapManuel = totalGenere - (salaireNet + charge + taxe + penalite);
      
      console.log(`   📊 Calcul: ${totalGenere.toFixed(2)} - (${salaireNet.toFixed(2)} + ${charge.toFixed(2)} + ${taxe.toFixed(2)} + ${penalite.toFixed(2)}) = ${rapManuel.toFixed(2)}€`);
      
      // Mettre à jour le RAP
      await pool.query(
        `UPDATE cout_par_salaire
         SET rap = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [rapManuel, record.id]
      );
      
      console.log(`   ✅ RAP mis à jour: ${rapManuel.toFixed(2)}€`);
    }
    
    console.log('\n🎯 Vérification terminée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

verifyBenabdallahFix().catch(console.error);

