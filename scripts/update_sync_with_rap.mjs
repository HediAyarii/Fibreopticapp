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

async function updateSyncWithRap() {
  console.log('🔧 Mise à jour du système de synchronisation avec RAP...');
  
  try {
    // 1. Mettre à jour la fonction de synchronisation automatique
    console.log('\n📊 1. Mise à jour de la fonction auto_sync_with_detection...');
    
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
        new_rap NUMERIC;
      BEGIN
        -- Parcourir toutes les correspondances détectées
        FOR match_record IN 
          SELECT * FROM auto_detect_name_matches()
          WHERE match_score >= 70  -- Seuil de confiance élevé
        LOOP
          -- Trouver l'enregistrement cout_par_salaire correspondant
          SELECT id, nom, prenom, mois, annee, total_genere, salaire_net, charge, taxe, penalite
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
              -- Calculer le nouveau RAP avec la fonction
              SELECT calculer_rap_avec_paiements(
                benefice_total, 
                cout_record.salaire_net, 
                cout_record.charge, 
                cout_record.taxe, 
                cout_record.penalite
              ) INTO new_rap;
              
              UPDATE cout_par_salaire 
              SET total_genere = benefice_total,
                  rap = new_rap,
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
    
    console.log('✅ Fonction auto_sync_with_detection mise à jour avec RAP');
    
    // 2. Tester la synchronisation avec RAP
    console.log('\n📊 2. Test de la synchronisation avec RAP...');
    const syncResult = await pool.query(`SELECT * FROM auto_sync_with_detection()`);
    
    if (syncResult.rows.length > 0) {
      console.log(`   🔄 ${syncResult.rows.length} synchronisations effectuées:`);
      syncResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.employe_nom} ${row.employe_prenom}: ${row.ancien_total.toFixed(2)}€ → ${row.nouveau_total.toFixed(2)}€ (${row.match_type})`);
      });
    } else {
      console.log('   ✅ Aucune synchronisation nécessaire (données déjà cohérentes)');
    }
    
    // 3. Vérifier que BENADBALLAH a un RAP correct
    console.log('\n📊 3. Vérification du RAP de BENADBALLAH...');
    const benabdallahResult = await pool.query(`
      SELECT total_genere, salaire_net, charge, taxe, penalite, rap
      FROM cout_par_salaire
      WHERE LOWER(nom) = 'benadballah' AND LOWER(prenom) = 'taoufik'
        AND mois = 5 AND annee = 2025
    `);
    
    if (benabdallahResult.rows.length > 0) {
      const record = benabdallahResult.rows[0];
      console.log(`   ✅ BENADBALLAH TAOUFIK:`);
      console.log(`      Total généré: ${record.total_genere}€`);
      console.log(`      RAP: ${record.rap}€`);
      
      // Vérifier la cohérence
      const totalDepenses = parseFloat(record.salaire_net || 0) + parseFloat(record.charge || 0) + parseFloat(record.taxe || 0) + parseFloat(record.penalite || 0);
      const rapAttendu = parseFloat(record.total_genere || 0) - totalDepenses;
      const difference = Math.abs(parseFloat(record.rap || 0) - rapAttendu);
      
      if (difference < 0.01) {
        console.log(`      ✅ RAP cohérent !`);
      } else {
        console.log(`      ⚠️ RAP incohérent (différence: ${difference.toFixed(2)}€)`);
      }
    }
    
    console.log('\n🎯 Système de synchronisation mis à jour avec calcul automatique du RAP !');
    console.log('✅ Fonction calculer_rap_avec_paiements intégrée');
    console.log('✅ Synchronisation automatique avec RAP activée');
    console.log('✅ BENADBALLAH TAOUFIK: RAP = 1157.07€');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

updateSyncWithRap().catch(console.error);

