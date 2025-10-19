-- Création de triggers pour synchronisation automatique des recettes
-- Ce script évite les problèmes de désynchronisation

-- 1. Fonction pour calculer les recettes d'un employé pour un mois/année donné
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

-- 2. Fonction pour synchroniser automatiquement les recettes
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

-- 3. Trigger pour synchroniser automatiquement lors des modifications d'interventions
CREATE OR REPLACE FUNCTION trigger_sync_recettes_intervention()
RETURNS TRIGGER AS $$
DECLARE
  v_old_nom TEXT;
  v_old_prenom TEXT;
  v_new_nom TEXT;
  v_new_prenom TEXT;
  v_date_rdv DATE;
  v_mois INTEGER;
  v_annee INTEGER;
BEGIN
  -- Déterminer les noms à traiter
  IF TG_OP = 'DELETE' THEN
    v_old_nom := OLD.nom_technicien;
    v_old_prenom := OLD.prenom_technicien;
    v_date_rdv := CASE 
      WHEN OLD.date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' THEN TO_DATE(OLD.date_rdv, 'DD.MM.YYYY')
      WHEN OLD.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN OLD.date_rdv::date
      WHEN OLD.date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' THEN TO_DATE(OLD.date_rdv, 'DD/MM/YYYY')
      ELSE NULL
    END;
  ELSE
    v_new_nom := NEW.nom_technicien;
    v_new_prenom := NEW.prenom_technicien;
    v_date_rdv := CASE 
      WHEN NEW.date_rdv ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}$' THEN TO_DATE(NEW.date_rdv, 'DD.MM.YYYY')
      WHEN NEW.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN NEW.date_rdv::date
      WHEN NEW.date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' THEN TO_DATE(NEW.date_rdv, 'DD/MM/YYYY')
      ELSE NULL
    END;
  END IF;
  
  -- Synchroniser si la date est valide
  IF v_date_rdv IS NOT NULL THEN
    v_mois := EXTRACT(MONTH FROM v_date_rdv);
    v_annee := EXTRACT(YEAR FROM v_date_rdv);
    
    -- Synchroniser l'ancien technicien (pour DELETE et UPDATE)
    IF v_old_nom IS NOT NULL AND v_old_prenom IS NOT NULL THEN
      PERFORM synchroniser_recettes_employe(v_old_nom, v_old_prenom, v_mois, v_annee);
    END IF;
    
    -- Synchroniser le nouveau technicien (pour INSERT et UPDATE)
    IF v_new_nom IS NOT NULL AND v_new_prenom IS NOT NULL THEN
      PERFORM synchroniser_recettes_employe(v_new_nom, v_new_prenom, v_mois, v_annee);
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 4. Créer le trigger sur la table interventions
DROP TRIGGER IF EXISTS sync_recettes_intervention_trigger ON interventions;
CREATE TRIGGER sync_recettes_intervention_trigger
  AFTER INSERT OR UPDATE OR DELETE ON interventions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sync_recettes_intervention();

-- 5. Fonction pour synchroniser tous les employés d'un mois donné
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

-- 6. Fonction pour vérifier la cohérence des données
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

-- 7. Commentaires pour expliquer le système
COMMENT ON FUNCTION calculer_recettes_employe_mois IS 'Calcule les recettes réelles d''un employé pour un mois donné';
COMMENT ON FUNCTION synchroniser_recettes_employe IS 'Synchronise automatiquement les recettes d''un employé';
COMMENT ON FUNCTION trigger_sync_recettes_intervention IS 'Trigger automatique pour synchroniser les recettes lors des modifications d''interventions';
COMMENT ON FUNCTION synchroniser_tous_employes_mois IS 'Synchronise tous les employés d''un mois donné';
COMMENT ON FUNCTION verifier_coherence_recettes IS 'Vérifie la cohérence entre les recettes stockées et calculées';

-- 8. Message de confirmation
SELECT 'Système de synchronisation automatique des recettes créé avec succès !' as message;
