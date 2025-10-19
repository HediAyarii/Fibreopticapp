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

async function debugBenabdallahAssignment() {
  console.log('🔍 Diagnostic de l\'assignation BENADBALLAH...');
  
  try {
    // 1. Vérifier les données dans cout_par_salaire
    console.log('\n📊 1. Données dans cout_par_salaire:');
    const coutParSalaireResult = await pool.query(`
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
      WHERE LOWER(nom) LIKE '%benabdallah%' OR LOWER(nom) LIKE '%benadballah%'
      ORDER BY nom, prenom
    `);
    
    console.log(`   📊 Résultats: ${coutParSalaireResult.rows.length} enregistrements`);
    coutParSalaireResult.rows.forEach((row, index) => {
      console.log(`      ${index + 1}. ${row.nom} ${row.prenom} (${row.mois}/${row.annee})`);
      console.log(`         Matricule: ${row.matricule}`);
      console.log(`         Total Généré: ${row.total_genere}€`);
      console.log(`         RAP: ${row.rap}€`);
    });
    
    // 2. Vérifier les données dans employes
    console.log('\n📊 2. Données dans employes:');
    const employesResult = await pool.query(`
      SELECT 
        id,
        nom,
        prenom,
        matricule,
        statut
      FROM employes
      WHERE LOWER(nom) LIKE '%benabdallah%' OR LOWER(nom) LIKE '%benadballah%'
      ORDER BY nom, prenom
    `);
    
    console.log(`   📊 Résultats: ${employesResult.rows.length} enregistrements`);
    employesResult.rows.forEach((row, index) => {
      console.log(`      ${index + 1}. ${row.nom} ${row.prenom} (ID: ${row.id})`);
      console.log(`         Matricule: ${row.matricule}`);
      console.log(`         Statut: ${row.statut}`);
    });
    
    // 3. Vérifier les interventions pour BENADBALLAH
    console.log('\n📊 3. Interventions pour BENADBALLAH:');
    const interventionsResult = await pool.query(`
      SELECT 
        nom_technicien,
        prenom_technicien,
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
      WHERE (LOWER(nom_technicien) LIKE '%benabdallah%' OR LOWER(nom_technicien) LIKE '%benadballah%')
        AND statut = 'CLOTURE TERMINEE'
        AND articles IS NOT NULL 
        AND articles != ''
      GROUP BY nom_technicien, prenom_technicien
      ORDER BY nom_technicien, prenom_technicien
    `);
    
    console.log(`   📊 Résultats: ${interventionsResult.rows.length} enregistrements`);
    interventionsResult.rows.forEach((row, index) => {
      console.log(`      ${index + 1}. ${row.nom_technicien} ${row.prenom_technicien}`);
      console.log(`         Interventions: ${row.nombre_interventions}`);
      console.log(`         Total Recette: ${row.total_recette}€`);
    });
    
    // 4. Vérifier les assignations manuelles
    console.log('\n📊 4. Assignations manuelles:');
    const assignationsResult = await pool.query(`
      SELECT 
        cps.id,
        cps.nom,
        cps.prenom,
        cps.total_genere,
        cps.rap,
        e.nom as employe_nom,
        e.prenom as employe_prenom,
        e.id as employe_id
      FROM cout_par_salaire cps
      LEFT JOIN employes e ON cps.matricule = e.matricule
      WHERE LOWER(cps.nom) LIKE '%benabdallah%' OR LOWER(cps.nom) LIKE '%benadballah%'
      ORDER BY cps.nom, cps.prenom
    `);
    
    console.log(`   📊 Résultats: ${assignationsResult.rows.length} enregistrements`);
    assignationsResult.rows.forEach((row, index) => {
      console.log(`      ${index + 1}. ${row.nom} ${row.prenom} → ${row.employe_nom} ${row.employe_prenom}`);
      console.log(`         Total Généré: ${row.total_genere}€`);
      console.log(`         RAP: ${row.rap}€`);
      console.log(`         Employé ID: ${row.employe_id}`);
    });
    
    // 5. Vérifier la fonction de détection automatique
    console.log('\n📊 5. Test de la fonction de détection automatique:');
    try {
      const detectionResult = await pool.query(`
        SELECT auto_detect_name_matches() as resultats
      `);
      
      console.log(`   📊 Fonction de détection: ${detectionResult.rows[0].resultats}`);
      
    } catch (error) {
      console.log(`   ❌ Erreur avec la fonction de détection: ${error.message}`);
    }
    
    // 6. Recommandations
    console.log('\n📊 6. Recommandations:');
    
    if (coutParSalaireResult.rows.length > 0 && interventionsResult.rows.length > 0) {
      const coutRow = coutParSalaireResult.rows[0];
      const interventionRow = interventionsResult.rows[0];
      
      console.log(`   🔧 Problème identifié:`);
      console.log(`      - cout_par_salaire: ${coutRow.nom} ${coutRow.prenom} (Total: ${coutRow.total_genere}€)`);
      console.log(`      - interventions: ${interventionRow.nom_technicien} ${interventionRow.prenom_technicien} (Total: ${interventionRow.total_recette}€)`);
      
      if (parseFloat(coutRow.total_genere) === 0 && parseFloat(interventionRow.total_recette) > 0) {
        console.log(`   🔧 Solution: Assigner le total des interventions (${interventionRow.total_recette}€)`);
        console.log(`      UPDATE cout_par_salaire SET total_genere = ${interventionRow.total_recette} WHERE id = ${coutRow.id};`);
      }
    }
    
    console.log('\n🎯 Diagnostic terminé !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

debugBenabdallahAssignment().catch(console.error);
