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

async function createSmartNameMatching() {
  console.log('🧠 Création d\'un système de matching intelligent des noms...');
  
  try {
    // Créer une fonction PostgreSQL pour le matching intelligent
    console.log('\n📊 1. Création de la fonction de matching intelligent...');
    
    await pool.query(`
      CREATE OR REPLACE FUNCTION smart_name_matching(
        cout_nom TEXT,
        cout_prenom TEXT,
        int_nom TEXT,
        int_prenom TEXT
      ) RETURNS BOOLEAN AS $$
      BEGIN
        -- Normaliser les noms (supprimer espaces, convertir en minuscules)
        DECLARE
          norm_cout_nom TEXT := LOWER(TRIM(REPLACE(cout_nom, ' ', '')));
          norm_cout_prenom TEXT := LOWER(TRIM(REPLACE(cout_prenom, ' ', '')));
          norm_int_nom TEXT := LOWER(TRIM(REPLACE(int_nom, ' ', '')));
          norm_int_prenom TEXT := LOWER(TRIM(REPLACE(int_prenom, ' ', '')));
        BEGIN
          -- Correspondance exacte
          IF norm_cout_nom = norm_int_nom AND norm_cout_prenom = norm_int_prenom THEN
            RETURN TRUE;
          END IF;
          
          -- Correspondance inversée (nom/prenom échangés)
          IF norm_cout_nom = norm_int_prenom AND norm_cout_prenom = norm_int_nom THEN
            RETURN TRUE;
          END IF;
          
          -- Correspondance avec espaces dans les noms composés
          IF norm_cout_nom = norm_int_nom AND norm_cout_prenom = norm_int_prenom THEN
            RETURN TRUE;
          END IF;
          
          -- Correspondance partielle pour les noms composés
          IF (norm_cout_nom LIKE '%' || norm_int_nom || '%' OR norm_int_nom LIKE '%' || norm_cout_nom || '%')
             AND (norm_cout_prenom LIKE '%' || norm_int_prenom || '%' OR norm_int_prenom LIKE '%' || norm_cout_prenom || '%') THEN
            RETURN TRUE;
          END IF;
          
          RETURN FALSE;
        END;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ Fonction smart_name_matching créée');
    
    // Créer une fonction de synchronisation intelligente
    console.log('\n📊 2. Création de la fonction de synchronisation intelligente...');
    
    await pool.query(`
      CREATE OR REPLACE FUNCTION smart_sync_benefice_brut()
      RETURNS TABLE(
        employe_nom TEXT,
        employe_prenom TEXT,
        ancien_total NUMERIC,
        nouveau_total NUMERIC,
        difference NUMERIC
      ) AS $$
      DECLARE
        r RECORD;
        benefice_total NUMERIC;
        current_total NUMERIC;
      BEGIN
        FOR r IN 
          SELECT cps.id, cps.nom, cps.prenom, cps.mois, cps.annee, cps.total_genere
          FROM cout_par_salaire cps
          WHERE cps.mois = 5 AND cps.annee = 2025
          ORDER BY cps.nom, cps.prenom
        LOOP
          -- Chercher la correspondance intelligente
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
            AND smart_name_matching(r.nom, r.prenom, i.nom_technicien, i.prenom_technicien)
            AND (
              (i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND 
               i.cloture_tech ~ '^[0-9]' AND 
               (i.cloture_tech::date >= DATE(r.annee || '-' || LPAD(r.mois::text, 2, '0') || '-01') AND 
                i.cloture_tech::date <= (DATE(r.annee || '-' || LPAD(r.mois::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))) OR
              (i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND 
               i.cloture_hotline ~ '^[0-9]' AND 
               (i.cloture_hotline::date >= DATE(r.annee || '-' || LPAD(r.mois::text, 2, '0') || '-01') AND 
                i.cloture_hotline::date <= (DATE(r.annee || '-' || LPAD(r.mois::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))) OR
              (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND 
               i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND 
               i.date_rdv ~ '^[0-9]' AND 
               (i.date_rdv::date >= DATE(r.annee || '-' || LPAD(r.mois::text, 2, '0') || '-01') AND 
                i.date_rdv::date <= (DATE(r.annee || '-' || LPAD(r.mois::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day')))
            );

          current_total := COALESCE(r.total_genere, 0);
          
          -- Si différence significative, mettre à jour
          IF ABS(benefice_total - current_total) > 0.01 THEN
            UPDATE cout_par_salaire 
            SET total_genere = benefice_total,
                rap = calculer_rap_avec_paiements(r.id),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = r.id;
            
            employe_nom := r.nom;
            employe_prenom := r.prenom;
            ancien_total := current_total;
            nouveau_total := benefice_total;
            difference := benefice_total - current_total;
            RETURN NEXT;
          END IF;
        END LOOP;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ Fonction smart_sync_benefice_brut créée');
    
    // Tester la fonction
    console.log('\n📊 3. Test de la fonction de synchronisation intelligente...');
    const testResult = await pool.query(`SELECT * FROM smart_sync_benefice_brut()`);
    
    if (testResult.rows.length > 0) {
      console.log(`🔄 ${testResult.rows.length} synchronisations effectuées:`);
      testResult.rows.forEach(row => {
        console.log(`   - ${row.employe_nom} ${row.employe_prenom}: ${row.ancien_total.toFixed(2)}€ → ${row.nouveau_total.toFixed(2)}€ (${row.difference > 0 ? '+' : ''}${row.difference.toFixed(2)}€)`);
      });
    } else {
      console.log('✅ Aucune synchronisation nécessaire');
    }
    
    console.log('\n🎯 Système de matching intelligent installé !');
    console.log('✅ Fonction smart_name_matching créée');
    console.log('✅ Fonction smart_sync_benefice_brut créée');
    console.log('✅ Système prêt pour la maintenance automatique');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

createSmartNameMatching().catch(console.error);

