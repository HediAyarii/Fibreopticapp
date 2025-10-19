import pkg from 'pg'
const { Pool } = pkg

// Configuration de la base de données
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

async function createSimpleAutoSync() {
  try {
    console.log('🔧 Création d\'un système de synchronisation simplifié...')
    
    // 1. Fonction pour calculer les recettes d'un employé
    console.log('\n📋 Création de la fonction de calcul des recettes...')
    await pool.query(`
      CREATE OR REPLACE FUNCTION calculer_recettes_employe_mois(
        p_nom_technicien TEXT,
        p_prenom_technicien TEXT,
        p_mois INTEGER,
        p_annee INTEGER
      ) RETURNS DECIMAL(10,2) AS $$
      DECLARE
        v_total_recettes DECIMAL(10,2);
        v_date_debut DATE;
        v_date_fin DATE;
      BEGIN
        -- Calculer les dates de début et fin du mois
        v_date_debut := TO_DATE(p_annee || '-' || LPAD(p_mois::TEXT, 2, '0') || '-01', 'YYYY-MM-DD');
        v_date_fin := (v_date_debut + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
        
        -- Calculer les recettes totales
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
        ), 0) INTO v_total_recettes
        FROM interventions i
        WHERE LOWER(i.nom_technicien) = LOWER(p_nom_technicien) 
          AND LOWER(i.prenom_technicien) = LOWER(p_prenom_technicien)
          AND (
            (i.date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' AND TO_DATE(i.date_rdv, 'DD.MM.YYYY') >= v_date_debut AND TO_DATE(i.date_rdv, 'DD.MM.YYYY') <= v_date_fin)
            OR (i.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND i.date_rdv::date >= v_date_debut AND i.date_rdv::date <= v_date_fin)
            OR (i.date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') >= v_date_debut AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') <= v_date_fin)
          );
        
        RETURN v_total_recettes;
      END;
      $$ LANGUAGE plpgsql;
    `)
    console.log('✅ Fonction calculer_recettes_employe_mois créée')
    
    // 2. Fonction pour synchroniser un employé
    console.log('\n📋 Création de la fonction de synchronisation...')
    await pool.query(`
      CREATE OR REPLACE FUNCTION synchroniser_recettes_employe(
        p_nom_technicien TEXT,
        p_prenom_technicien TEXT,
        p_mois INTEGER,
        p_annee INTEGER
      ) RETURNS VOID AS $$
      DECLARE
        v_recettes_reelles DECIMAL(10,2);
        v_cout_par_salaire_id INTEGER;
      BEGIN
        -- Calculer les recettes réelles
        v_recettes_reelles := calculer_recettes_employe_mois(p_nom_technicien, p_prenom_technicien, p_mois, p_annee);
        
        -- Trouver l'enregistrement dans cout_par_salaire
        SELECT id INTO v_cout_par_salaire_id
        FROM cout_par_salaire 
        WHERE LOWER(nom) = LOWER(p_nom_technicien) 
          AND LOWER(prenom) = LOWER(p_prenom_technicien)
          AND mois = p_mois 
          AND annee = p_annee;
        
        -- Mettre à jour si trouvé
        IF v_cout_par_salaire_id IS NOT NULL THEN
          UPDATE cout_par_salaire 
          SET 
            total_genere = v_recettes_reelles,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = v_cout_par_salaire_id;
          
          -- Recalculer le RAP
          UPDATE cout_par_salaire 
          SET rap = calculer_rap_avec_paiements(v_cout_par_salaire_id)
          WHERE id = v_cout_par_salaire_id;
        END IF;
      END;
      $$ LANGUAGE plpgsql;
    `)
    console.log('✅ Fonction synchroniser_recettes_employe créée')
    
    // 3. Fonction pour synchroniser tous les employés d'un mois
    console.log('\n📋 Création de la fonction de synchronisation globale...')
    await pool.query(`
      CREATE OR REPLACE FUNCTION synchroniser_tous_employes_mois(
        p_mois INTEGER,
        p_annee INTEGER
      ) RETURNS INTEGER AS $$
      DECLARE
        v_employe RECORD;
        v_count INTEGER := 0;
      BEGIN
        -- Récupérer tous les employés uniques
        FOR v_employe IN 
          SELECT DISTINCT nom_technicien, prenom_technicien
          FROM interventions
          WHERE (
            (date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' AND TO_DATE(date_rdv, 'DD.MM.YYYY') >= TO_DATE(p_annee || '-' || LPAD(p_mois::TEXT, 2, '0') || '-01', 'YYYY-MM-DD') AND TO_DATE(date_rdv, 'DD.MM.YYYY') <= (TO_DATE(p_annee || '-' || LPAD(p_mois::TEXT, 2, '0') || '-01', 'YYYY-MM-DD') + INTERVAL '1 month' - INTERVAL '1 day')::DATE)
            OR (date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND date_rdv::date >= TO_DATE(p_annee || '-' || LPAD(p_mois::TEXT, 2, '0') || '-01', 'YYYY-MM-DD') AND date_rdv::date <= (TO_DATE(p_annee || '-' || LPAD(p_mois::TEXT, 2, '0') || '-01', 'YYYY-MM-DD') + INTERVAL '1 month' - INTERVAL '1 day')::DATE)
            OR (date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' AND TO_DATE(date_rdv, 'DD/MM/YYYY') >= TO_DATE(p_annee || '-' || LPAD(p_mois::TEXT, 2, '0') || '-01', 'YYYY-MM-DD') AND TO_DATE(date_rdv, 'DD/MM/YYYY') <= (TO_DATE(p_annee || '-' || LPAD(p_mois::TEXT, 2, '0') || '-01', 'YYYY-MM-DD') + INTERVAL '1 month' - INTERVAL '1 day')::DATE)
          )
        LOOP
          PERFORM synchroniser_recettes_employe(v_employe.nom_technicien, v_employe.prenom_technicien, p_mois, p_annee);
          v_count := v_count + 1;
        END LOOP;
        
        RETURN v_count;
      END;
      $$ LANGUAGE plpgsql;
    `)
    console.log('✅ Fonction synchroniser_tous_employes_mois créée')
    
    // 4. Fonction pour vérifier la cohérence
    console.log('\n📋 Création de la fonction de vérification...')
    await pool.query(`
      CREATE OR REPLACE FUNCTION verifier_coherence_recettes()
      RETURNS TABLE(
        nom_technicien TEXT,
        prenom_technicien TEXT,
        mois INTEGER,
        annee INTEGER,
        total_genere_stocke DECIMAL(10,2),
        total_genere_calcule DECIMAL(10,2),
        difference DECIMAL(10,2)
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          cps.nom,
          cps.prenom,
          cps.mois,
          cps.annee,
          cps.total_genere,
          calculer_recettes_employe_mois(cps.nom, cps.prenom, cps.mois, cps.annee) as total_calcule,
          (calculer_recettes_employe_mois(cps.nom, cps.prenom, cps.mois, cps.annee) - cps.total_genere) as diff
        FROM cout_par_salaire cps
        WHERE cps.total_genere > 0
        ORDER BY ABS(calculer_recettes_employe_mois(cps.nom, cps.prenom, cps.mois, cps.annee) - cps.total_genere) DESC;
      END;
      $$ LANGUAGE plpgsql;
    `)
    console.log('✅ Fonction verifier_coherence_recettes créée')
    
    // 5. Test du système
    console.log('\n🧪 Test du système...')
    
    // Tester la synchronisation pour mai 2025
    const syncResult = await pool.query(`
      SELECT synchroniser_tous_employes_mois(5, 2025) as employes_synchronises
    `)
    console.log(`✅ ${syncResult.rows[0].employes_synchronises} employés synchronisés pour mai 2025`)
    
    // Vérifier la cohérence
    const coherenceCheck = await pool.query(`
      SELECT COUNT(*) as total_incoherences
      FROM verifier_coherence_recettes()
      WHERE ABS(difference) > 0.01
    `)
    console.log(`📊 Incohérences détectées: ${coherenceCheck.rows[0].total_incoherences}`)
    
    console.log('\n🎯 Système de synchronisation simplifié créé !')
    console.log('📋 Fonctions disponibles:')
    console.log('   ✅ calculer_recettes_employe_mois(nom, prenom, mois, année)')
    console.log('   ✅ synchroniser_recettes_employe(nom, prenom, mois, année)')
    console.log('   ✅ synchroniser_tous_employes_mois(mois, année)')
    console.log('   ✅ verifier_coherence_recettes()')
    
    console.log('\n💡 Utilisation:')
    console.log('   - Exécutez synchroniser_tous_employes_mois(5, 2025) pour mai 2025')
    console.log('   - Utilisez verifier_coherence_recettes() pour vérifier les incohérences')
    console.log('   - Exécutez ce script régulièrement pour maintenir la cohérence')
    
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error.message)
  } finally {
    await pool.end()
  }
}

createSimpleAutoSync()
