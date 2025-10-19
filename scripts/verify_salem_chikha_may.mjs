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

async function verifySalemChikhaMay() {
  console.log('🔍 Vérification de Salem Chikha pour mai 2025...');
  console.log('📊 Comparaison entre Bénéfice Brut et Charges par Salarié');
  
  try {
    // 1. Récupérer les données de "Bénéfice Brut" (API recap-calcul)
    console.log('\n📊 1. Données de "Bénéfice Brut" (API recap-calcul):');
    const beneficeBrutQuery = `
      SELECT 
        i.nom_technicien as employe_nom,
        i.prenom_technicien as employe_prenom,
        CONCAT('TECH_', UPPER(SUBSTRING(i.nom_technicien, 1, 3)), UPPER(SUBSTRING(i.prenom_technicien, 1, 2))) as matricule,
        COUNT(*) as nombre_interventions,
        SUM(
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
        ) as total_recette_technicien
      FROM interventions i
      WHERE i.statut = 'CLOTURE TERMINEE'
        AND i.articles IS NOT NULL 
        AND i.articles != ''
        AND LOWER(i.nom_technicien) = LOWER('CHIKHA')
        AND LOWER(i.prenom_technicien) = LOWER('SALEM')
        AND (
          (i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND 
           i.cloture_tech ~ '^[0-9]' AND 
           (i.cloture_tech::date >= '2025-05-01'::date AND i.cloture_tech::date <= '2025-05-31'::date)) OR
          (i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND 
           i.cloture_hotline ~ '^[0-9]' AND 
           (i.cloture_hotline::date >= '2025-05-01'::date AND i.cloture_hotline::date <= '2025-05-31'::date)) OR
          (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND 
           i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND 
           i.date_rdv ~ '^[0-9]' AND 
           (i.date_rdv::date >= '2025-05-01'::date AND i.date_rdv::date <= '2025-05-31'::date))
        )
      GROUP BY i.nom_technicien, i.prenom_technicien
    `;
    
    const beneficeBrutResult = await pool.query(beneficeBrutQuery);
    const beneficeBrutData = beneficeBrutResult.rows[0];
    
    if (beneficeBrutData) {
      console.log(`✅ Bénéfice Brut - Salem Chikha:`);
      console.log(`   - Nombre d'interventions: ${beneficeBrutData.nombre_interventions}`);
      console.log(`   - Total Recette Technicien: ${parseFloat(beneficeBrutData.total_recette_technicien || 0).toFixed(2)}€`);
    } else {
      console.log('❌ Aucune donnée trouvée pour Salem Chikha en mai 2025 dans Bénéfice Brut');
    }
    
    // 2. Récupérer les données de "Charges par Salarié" (table cout_par_salaire)
    console.log('\n📊 2. Données de "Charges par Salarié" (table cout_par_salaire):');
    const chargesQuery = `
      SELECT 
        nom,
        prenom,
        total_genere,
        salaire_net,
        charge,
        cout_total,
        taxe,
        penalite,
        rap,
        mois,
        annee
      FROM cout_par_salaire
      WHERE LOWER(nom) = LOWER('CHIKHA')
        AND LOWER(prenom) = LOWER('SALEM')
        AND mois = 5
        AND annee = 2025
    `;
    
    const chargesResult = await pool.query(chargesQuery);
    const chargesData = chargesResult.rows[0];
    
    if (chargesData) {
      console.log(`✅ Charges par Salarié - Salem Chikha:`);
      console.log(`   - Mois/Année: ${chargesData.mois}/${chargesData.annee}`);
      console.log(`   - Total Généré: ${parseFloat(chargesData.total_genere || 0).toFixed(2)}€`);
      console.log(`   - Salaire Net: ${parseFloat(chargesData.salaire_net || 0).toFixed(2)}€`);
      console.log(`   - Charge: ${parseFloat(chargesData.charge || 0).toFixed(2)}€`);
      console.log(`   - Coût Total: ${parseFloat(chargesData.cout_total || 0).toFixed(2)}€`);
      console.log(`   - Taxe: ${parseFloat(chargesData.taxe || 0).toFixed(2)}%`);
      console.log(`   - Pénalité: ${parseFloat(chargesData.penalite || 0).toFixed(2)}€`);
      console.log(`   - RAP: ${parseFloat(chargesData.rap || 0).toFixed(2)}€`);
    } else {
      console.log('❌ Aucune donnée trouvée pour Salem Chikha en mai 2025 dans Charges par Salarié');
    }
    
    // 3. Comparaison
    console.log('\n📊 3. Comparaison des données:');
    if (beneficeBrutData && chargesData) {
      const beneficeBrutTotal = parseFloat(beneficeBrutData.total_recette_technicien || 0);
      const chargesTotal = parseFloat(chargesData.total_genere || 0);
      const difference = Math.abs(beneficeBrutTotal - chargesTotal);
      
      console.log(`📈 Bénéfice Brut (Total Recette Technicien): ${beneficeBrutTotal.toFixed(2)}€`);
      console.log(`📈 Charges par Salarié (Total Généré): ${chargesTotal.toFixed(2)}€`);
      console.log(`📊 Différence: ${difference.toFixed(2)}€`);
      
      if (difference < 0.01) {
        console.log('✅ COHÉRENT: Les deux valeurs sont identiques');
      } else {
        console.log('❌ INCOHÉRENT: Les valeurs diffèrent');
        console.log(`   - Écart: ${difference.toFixed(2)}€`);
        console.log(`   - Pourcentage d'écart: ${((difference / Math.max(beneficeBrutTotal, chargesTotal)) * 100).toFixed(2)}%`);
      }
    } else {
      console.log('❌ Impossible de comparer - données manquantes dans une des sections');
    }
    
    // 4. Détail des interventions pour Salem Chikha en mai
    console.log('\n📊 4. Détail des interventions de Salem Chikha en mai 2025:');
    const detailQuery = `
      SELECT 
        i.id,
        i.num_inter,
        i.client,
        i.date_rdv,
        i.cloture_tech,
        i.cloture_hotline,
        i.articles,
        i.statut,
        i.type_intervention,
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
        ) as recette_technicien
      FROM interventions i
      WHERE i.statut = 'CLOTURE TERMINEE'
        AND i.articles IS NOT NULL 
        AND i.articles != ''
        AND LOWER(i.nom_technicien) = LOWER('CHIKHA')
        AND LOWER(i.prenom_technicien) = LOWER('SALEM')
        AND (
          (i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND 
           i.cloture_tech ~ '^[0-9]' AND 
           (i.cloture_tech::date >= '2025-05-01'::date AND i.cloture_tech::date <= '2025-05-31'::date)) OR
          (i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND 
           i.cloture_hotline ~ '^[0-9]' AND 
           (i.cloture_hotline::date >= '2025-05-01'::date AND i.cloture_hotline::date <= '2025-05-31'::date)) OR
          (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND 
           i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND 
           i.date_rdv ~ '^[0-9]' AND 
           (i.date_rdv::date >= '2025-05-01'::date AND i.date_rdv::date <= '2025-05-31'::date))
        )
      ORDER BY i.id
    `;
    
    const detailResult = await pool.query(detailQuery);
    console.log(`📋 ${detailResult.rows.length} interventions trouvées:`);
    
    let totalRecette = 0;
    detailResult.rows.forEach((row, index) => {
      const recette = parseFloat(row.recette_technicien || 0);
      totalRecette += recette;
      console.log(`   ${index + 1}. ID: ${row.id} | ${row.num_inter} | ${row.client} | ${row.date_rdv} | ${recette.toFixed(2)}€`);
    });
    
    console.log(`📊 Total calculé manuellement: ${totalRecette.toFixed(2)}€`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

verifySalemChikhaMay().catch(console.error);

