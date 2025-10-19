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

async function createAutoNameDetection() {
  console.log('🤖 Création du système de détection automatique des noms...');
  
  try {
    // 1. Créer une fonction de détection automatique des correspondances
    console.log('\n📊 1. Création de la fonction de détection automatique...');
    
    await pool.query(`
      CREATE OR REPLACE FUNCTION auto_detect_name_matches()
      RETURNS TABLE(
        cout_nom TEXT,
        cout_prenom TEXT,
        int_nom TEXT,
        int_prenom TEXT,
        match_score NUMERIC,
        match_type TEXT
      ) AS $$
      DECLARE
        cout_record RECORD;
        int_record RECORD;
        score NUMERIC;
        match_type TEXT;
      BEGIN
        -- Parcourir tous les techniciens de cout_par_salaire
        FOR cout_record IN 
          SELECT DISTINCT nom, prenom
          FROM cout_par_salaire
          WHERE mois = 5 AND annee = 2025
        LOOP
          -- Chercher les correspondances dans interventions
          FOR int_record IN 
            SELECT DISTINCT nom_technicien, prenom_technicien
            FROM interventions
            WHERE statut = 'CLOTURE TERMINEE'
              AND articles IS NOT NULL 
              AND articles != ''
              AND (
                (cloture_tech IS NOT NULL AND cloture_tech != '' AND cloture_tech != 'nan' AND 
                 cloture_tech ~ '^[0-9]' AND 
                 (cloture_tech::date >= '2025-05-01' AND cloture_tech::date <= '2025-05-31')) OR
                (cloture_hotline IS NOT NULL AND cloture_hotline != '' AND cloture_hotline != 'nan' AND 
                 cloture_hotline ~ '^[0-9]' AND 
                 (cloture_hotline::date >= '2025-05-01' AND cloture_hotline::date <= '2025-05-31')) OR
                (cloture_tech IS NULL AND cloture_hotline IS NULL AND 
                 date_rdv IS NOT NULL AND date_rdv != '' AND date_rdv != 'nan' AND 
                 date_rdv ~ '^[0-9]' AND 
                 (date_rdv::date >= '2025-05-01' AND date_rdv::date <= '2025-05-31'))
              )
          LOOP
            -- Calculer le score de correspondance
            score := 0;
            match_type := '';
            
            -- Correspondance exacte (score: 100)
            IF LOWER(TRIM(cout_record.nom)) = LOWER(TRIM(int_record.nom_technicien)) 
               AND LOWER(TRIM(cout_record.prenom)) = LOWER(TRIM(int_record.prenom_technicien)) THEN
              score := 100;
              match_type := 'exact';
            -- Correspondance inversée (score: 90)
            ELSIF LOWER(TRIM(cout_record.nom)) = LOWER(TRIM(int_record.prenom_technicien)) 
                  AND LOWER(TRIM(cout_record.prenom)) = LOWER(TRIM(int_record.nom_technicien)) THEN
              score := 90;
              match_type := 'inverse';
            -- Correspondance partielle nom (score: 70)
            ELSIF LOWER(TRIM(cout_record.nom)) LIKE '%' || LOWER(TRIM(int_record.nom_technicien)) || '%'
                  OR LOWER(TRIM(int_record.nom_technicien)) LIKE '%' || LOWER(TRIM(cout_record.nom)) || '%' THEN
              score := 70;
              match_type := 'partial_nom';
            -- Correspondance partielle prénom (score: 60)
            ELSIF LOWER(TRIM(cout_record.prenom)) LIKE '%' || LOWER(TRIM(int_record.prenom_technicien)) || '%'
                  OR LOWER(TRIM(int_record.prenom_technicien)) LIKE '%' || LOWER(TRIM(cout_record.prenom)) || '%' THEN
              score := 60;
              match_type := 'partial_prenom';
            -- Correspondance avec espaces (score: 80)
            ELSIF LOWER(REPLACE(cout_record.nom, ' ', '')) = LOWER(REPLACE(int_record.nom_technicien, ' ', ''))
                  AND LOWER(REPLACE(cout_record.prenom, ' ', '')) = LOWER(REPLACE(int_record.prenom_technicien, ' ', '')) THEN
              score := 80;
              match_type := 'spaces_removed';
            END IF;
            
            -- Retourner seulement les correspondances avec un score > 50
            IF score > 50 THEN
              cout_nom := cout_record.nom;
              cout_prenom := cout_record.prenom;
              int_nom := int_record.nom_technicien;
              int_prenom := int_record.prenom_technicien;
              match_score := score;
              match_type := match_type;
              RETURN NEXT;
            END IF;
          END LOOP;
        END LOOP;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ Fonction auto_detect_name_matches créée');
    
    // 2. Créer une fonction de synchronisation automatique basée sur la détection
    console.log('\n📊 2. Création de la fonction de synchronisation automatique...');
    
    await pool.query(`
      CREATE OR REPLACE FUNCTION auto_sync_with_detection()
      RETURNS TABLE(
        employe_nom TEXT,
        employe_prenom TEXT,
        ancien_total NUMERIC,
        nouveau_total NUMERIC,
        difference NUMERIC,
        match_type TEXT
      ) AS $$
      DECLARE
        match_record RECORD;
        cout_record RECORD;
        benefice_total NUMERIC;
        current_total NUMERIC;
      BEGIN
        -- Parcourir toutes les correspondances détectées
        FOR match_record IN 
          SELECT * FROM auto_detect_name_matches()
          WHERE match_score >= 70  -- Seuil de confiance élevé
        LOOP
          -- Trouver l'enregistrement cout_par_salaire correspondant
          SELECT id, nom, prenom, mois, annee, total_genere
          INTO cout_record
          FROM cout_par_salaire
          WHERE LOWER(nom) = LOWER(match_record.cout_nom)
            AND LOWER(prenom) = LOWER(match_record.cout_prenom)
            AND mois = 5 AND annee = 2025
          LIMIT 1;
          
          IF cout_record.id IS NOT NULL THEN
            -- Calculer le bénéfice brut avec la correspondance détectée
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
            ), 0)
            INTO benefice_total
            FROM interventions i
            WHERE i.statut = 'CLOTURE TERMINEE'
              AND i.articles IS NOT NULL 
              AND i.articles != ''
              AND LOWER(i.nom_technicien) = LOWER(match_record.int_nom)
              AND LOWER(i.prenom_technicien) = LOWER(match_record.int_prenom)
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
              );

            current_total := COALESCE(cout_record.total_genere, 0);
            
            -- Si différence significative, mettre à jour
            IF ABS(benefice_total - current_total) > 0.01 THEN
              UPDATE cout_par_salaire 
              SET total_genere = benefice_total,
                  rap = calculer_rap_avec_paiements(cout_record.id),
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = cout_record.id;
              
              employe_nom := cout_record.nom;
              employe_prenom := cout_record.prenom;
              ancien_total := current_total;
              nouveau_total := benefice_total;
              difference := benefice_total - current_total;
              match_type := match_record.match_type;
              RETURN NEXT;
            END IF;
          END IF;
        END LOOP;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ Fonction auto_sync_with_detection créée');
    
    // 3. Créer une fonction de monitoring des correspondances
    console.log('\n📊 3. Création de la fonction de monitoring...');
    
    await pool.query(`
      CREATE OR REPLACE FUNCTION monitor_name_matches()
      RETURNS TABLE(
        cout_nom TEXT,
        cout_prenom TEXT,
        int_nom TEXT,
        int_prenom TEXT,
        match_score NUMERIC,
        match_type TEXT,
        status TEXT
      ) AS $$
      DECLARE
        match_record RECORD;
        cout_count INTEGER;
        int_count INTEGER;
      BEGIN
        FOR match_record IN SELECT * FROM auto_detect_name_matches() LOOP
          -- Compter les interventions pour ce technicien dans cout_par_salaire
          SELECT COUNT(*) INTO cout_count
          FROM cout_par_salaire
          WHERE LOWER(nom) = LOWER(match_record.cout_nom)
            AND LOWER(prenom) = LOWER(match_record.cout_prenom)
            AND mois = 5 AND annee = 2025;
          
          -- Compter les interventions pour ce technicien dans interventions
          SELECT COUNT(*) INTO int_count
          FROM interventions
          WHERE LOWER(nom_technicien) = LOWER(match_record.int_nom)
            AND LOWER(prenom_technicien) = LOWER(match_record.int_prenom)
            AND statut = 'CLOTURE TERMINEE'
            AND articles IS NOT NULL 
            AND articles != ''
            AND (
              (cloture_tech IS NOT NULL AND cloture_tech != '' AND cloture_tech != 'nan' AND 
               cloture_tech ~ '^[0-9]' AND 
               (cloture_tech::date >= '2025-05-01' AND cloture_tech::date <= '2025-05-31')) OR
              (cloture_hotline IS NOT NULL AND cloture_hotline != '' AND cloture_hotline != 'nan' AND 
               cloture_hotline ~ '^[0-9]' AND 
               (cloture_hotline::date >= '2025-05-01' AND cloture_hotline::date <= '2025-05-31')) OR
              (cloture_tech IS NULL AND cloture_hotline IS NULL AND 
               date_rdv IS NOT NULL AND date_rdv != '' AND date_rdv != 'nan' AND 
               date_rdv ~ '^[0-9]' AND 
               (date_rdv::date >= '2025-05-01' AND date_rdv::date <= '2025-05-31'))
            );
          
          cout_nom := match_record.cout_nom;
          cout_prenom := match_record.cout_prenom;
          int_nom := match_record.int_nom;
          int_prenom := match_record.int_prenom;
          match_score := match_record.match_score;
          match_type := match_record.match_type;
          
          -- Déterminer le statut
          IF cout_count > 0 AND int_count > 0 THEN
            status := 'MATCHED';
          ELSIF cout_count > 0 AND int_count = 0 THEN
            status := 'NO_INTERVENTIONS';
          ELSIF cout_count = 0 AND int_count > 0 THEN
            status := 'NO_COUT_RECORD';
          ELSE
            status := 'UNKNOWN';
          END IF;
          
          RETURN NEXT;
        END LOOP;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ Fonction monitor_name_matches créée');
    
    // 4. Tester le système
    console.log('\n📊 4. Test du système de détection automatique...');
    
    const detectionResult = await pool.query(`SELECT * FROM auto_detect_name_matches() ORDER BY match_score DESC`);
    
    console.log(`🔍 ${detectionResult.rows.length} correspondances détectées:`);
    detectionResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.cout_nom} ${row.cout_prenom} ↔ ${row.int_nom} ${row.int_prenom} (${row.match_score}% - ${row.match_type})`);
    });
    
    // 5. Tester la synchronisation automatique
    console.log('\n📊 5. Test de la synchronisation automatique...');
    const syncResult = await pool.query(`SELECT * FROM auto_sync_with_detection()`);
    
    if (syncResult.rows.length > 0) {
      console.log(`🔄 ${syncResult.rows.length} synchronisations automatiques effectuées:`);
      syncResult.rows.forEach(row => {
        console.log(`   - ${row.employe_nom} ${row.employe_prenom}: ${row.ancien_total.toFixed(2)}€ → ${row.nouveau_total.toFixed(2)}€ (${row.match_type})`);
      });
    } else {
      console.log('✅ Aucune synchronisation automatique nécessaire');
    }
    
    // 6. Afficher le monitoring
    console.log('\n📊 6. Monitoring des correspondances...');
    const monitorResult = await pool.query(`SELECT * FROM monitor_name_matches() ORDER BY match_score DESC`);
    
    console.log(`📋 Statut des correspondances:`);
    monitorResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.cout_nom} ${row.cout_prenom} ↔ ${row.int_nom} ${row.int_prenom} (${row.match_score}% - ${row.status})`);
    });
    
    console.log('\n🎯 Système de détection automatique installé !');
    console.log('✅ Fonction auto_detect_name_matches créée');
    console.log('✅ Fonction auto_sync_with_detection créée');
    console.log('✅ Fonction monitor_name_matches créée');
    console.log('✅ Système prêt pour la détection automatique');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

createAutoNameDetection().catch(console.error);

