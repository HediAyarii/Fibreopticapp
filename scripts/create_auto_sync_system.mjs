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

async function createAutoSyncSystem() {
  console.log('🔧 Création du système de synchronisation automatique...');
  
  try {
    // 1. Créer une fonction de synchronisation
    console.log('\n📊 1. Création de la fonction de synchronisation...');
    const syncFunction = `
      CREATE OR REPLACE FUNCTION sync_benefice_brut_to_charges()
      RETURNS TRIGGER AS $$
      DECLARE
        benefice_total DECIMAL(10,2);
        existing_record RECORD;
        new_rap DECIMAL(10,2);
      BEGIN
        -- Calculer le total du bénéfice brut pour ce technicien et cette période
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
        ), 0) INTO benefice_total
        FROM interventions i
        WHERE i.statut = 'CLOTURE TERMINEE'
          AND i.articles IS NOT NULL 
          AND i.articles != ''
          AND LOWER(i.nom_technicien) = LOWER(NEW.nom)
          AND LOWER(i.prenom_technicien) = LOWER(NEW.prenom)
          AND (
            (i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND 
             i.cloture_tech ~ '^[0-9]' AND 
             (i.cloture_tech::date >= DATE(NEW.annee || '-' || LPAD(NEW.mois::text, 2, '0') || '-01') AND 
              i.cloture_tech::date <= (DATE(NEW.annee || '-' || LPAD(NEW.mois::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))) OR
            (i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND 
             i.cloture_hotline ~ '^[0-9]' AND 
             (i.cloture_hotline::date >= DATE(NEW.annee || '-' || LPAD(NEW.mois::text, 2, '0') || '-01') AND 
              i.cloture_hotline::date <= (DATE(NEW.annee || '-' || LPAD(NEW.mois::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))) OR
            (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND 
             i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND 
             i.date_rdv ~ '^[0-9]' AND 
             (i.date_rdv::date >= DATE(NEW.annee || '-' || LPAD(NEW.mois::text, 2, '0') || '-01') AND 
              i.date_rdv::date <= (DATE(NEW.annee || '-' || LPAD(NEW.mois::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day')))
          );
        
        -- Mettre à jour le total_genere avec la valeur du bénéfice brut
        UPDATE cout_par_salaire 
        SET total_genere = benefice_total,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.id;
        
        -- Recalculer le RAP
        SELECT calculer_rap_avec_paiements(NEW.id) INTO new_rap;
        
        UPDATE cout_par_salaire 
        SET rap = new_rap,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.id;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await pool.query(syncFunction);
    console.log('✅ Fonction de synchronisation créée');
    
    // 2. Créer un trigger sur la table cout_par_salaire
    console.log('\n📊 2. Création du trigger automatique...');
    const triggerQuery = `
      DROP TRIGGER IF EXISTS trigger_sync_benefice_brut ON cout_par_salaire;
      
      CREATE TRIGGER trigger_sync_benefice_brut
        AFTER INSERT OR UPDATE ON cout_par_salaire
        FOR EACH ROW
        EXECUTE FUNCTION sync_benefice_brut_to_charges();
    `;
    
    await pool.query(triggerQuery);
    console.log('✅ Trigger automatique créé');
    
    // 3. Créer une fonction de synchronisation manuelle
    console.log('\n📊 3. Création de la fonction de synchronisation manuelle...');
    const manualSyncFunction = `
      CREATE OR REPLACE FUNCTION force_sync_all_charges()
      RETURNS TABLE(
        employe_nom TEXT,
        employe_prenom TEXT,
        mois INTEGER,
        annee INTEGER,
        ancien_total DECIMAL(10,2),
        nouveau_total DECIMAL(10,2),
        difference DECIMAL(10,2)
      ) AS $$
      DECLARE
        rec RECORD;
        benefice_total DECIMAL(10,2);
        new_rap DECIMAL(10,2);
      BEGIN
        -- Parcourir tous les enregistrements de cout_par_salaire
        FOR rec IN 
          SELECT id, nom, prenom, mois, annee, total_genere
          FROM cout_par_salaire
          ORDER BY nom, prenom, annee, mois
        LOOP
          -- Calculer le bénéfice brut pour ce technicien et cette période
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
          ), 0) INTO benefice_total
          FROM interventions i
          WHERE i.statut = 'CLOTURE TERMINEE'
            AND i.articles IS NOT NULL 
            AND i.articles != ''
            AND LOWER(i.nom_technicien) = LOWER(rec.nom)
            AND LOWER(i.prenom_technicien) = LOWER(rec.prenom)
            AND (
              (i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND 
               i.cloture_tech ~ '^[0-9]' AND 
               (i.cloture_tech::date >= DATE(rec.annee || '-' || LPAD(rec.mois::text, 2, '0') || '-01') AND 
                i.cloture_tech::date <= (DATE(rec.annee || '-' || LPAD(rec.mois::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))) OR
              (i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND 
               i.cloture_hotline ~ '^[0-9]' AND 
               (i.cloture_hotline::date >= DATE(rec.annee || '-' || LPAD(rec.mois::text, 2, '0') || '-01') AND 
                i.cloture_hotline::date <= (DATE(rec.annee || '-' || LPAD(rec.mois::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))) OR
              (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND 
               i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND 
               i.date_rdv ~ '^[0-9]' AND 
               (i.date_rdv::date >= DATE(rec.annee || '-' || LPAD(rec.mois::text, 2, '0') || '-01') AND 
                i.date_rdv::date <= (DATE(rec.annee || '-' || LPAD(rec.mois::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day')))
            );
          
          -- Mettre à jour si nécessaire
          IF ABS(rec.total_genere - benefice_total) > 0.01 THEN
            -- Mettre à jour le total_genere
            UPDATE cout_par_salaire 
            SET total_genere = benefice_total,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = rec.id;
            
            -- Recalculer le RAP
            SELECT calculer_rap_avec_paiements(rec.id) INTO new_rap;
            
            UPDATE cout_par_salaire 
            SET rap = new_rap,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = rec.id;
            
            -- Retourner l'information de synchronisation
            employe_nom := rec.nom;
            employe_prenom := rec.prenom;
            mois := rec.mois;
            annee := rec.annee;
            ancien_total := rec.total_genere;
            nouveau_total := benefice_total;
            difference := benefice_total - rec.total_genere;
            RETURN NEXT;
          END IF;
        END LOOP;
        
        RETURN;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await pool.query(manualSyncFunction);
    console.log('✅ Fonction de synchronisation manuelle créée');
    
    // 4. Tester le système
    console.log('\n📊 4. Test du système de synchronisation...');
    const testResult = await pool.query('SELECT * FROM force_sync_all_charges()');
    
    if (testResult.rows.length > 0) {
      console.log('🔄 Synchronisations effectuées:');
      testResult.rows.forEach(row => {
        console.log(`   - ${row.employe_nom} ${row.employe_prenom} (${row.mois}/${row.annee}): ${row.ancien_total.toFixed(2)}€ → ${row.nouveau_total.toFixed(2)}€ (${row.difference > 0 ? '+' : ''}${row.difference.toFixed(2)}€)`);
      });
    } else {
      console.log('✅ Aucune synchronisation nécessaire - toutes les données sont cohérentes');
    }
    
    console.log('\n🎯 SYSTÈME DE SYNCHRONISATION AUTOMATIQUE INSTALLÉ !');
    console.log('✅ Le système synchronisera automatiquement les données à chaque mise à jour');
    console.log('✅ Utilisez SELECT * FROM force_sync_all_charges() pour forcer une synchronisation manuelle');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

createAutoSyncSystem().catch(console.error);

