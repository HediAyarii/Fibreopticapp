-- Créer une fonction pour synchroniser automatiquement les taxes
CREATE OR REPLACE FUNCTION sync_taxes_automatique()
RETURNS TRIGGER AS $$
BEGIN
  -- Synchroniser les taxes dans cout_par_salaire quand un employé est modifié
  IF TG_OP = 'UPDATE' AND (OLD.pourcentage_taxe IS DISTINCT FROM NEW.pourcentage_taxe) THEN
    -- Mettre à jour les taxes dans cout_par_salaire
    UPDATE cout_par_salaire 
    SET 
      taxe = NEW.pourcentage_taxe,
      impot = charge * (NEW.pourcentage_taxe / 100),
      updated_at = CURRENT_TIMESTAMP
    WHERE LOWER(nom) = LOWER(NEW.nom) AND LOWER(prenom) = LOWER(NEW.prenom);
    
    -- Recalculer le RAP pour tous les employés affectés
    UPDATE cout_par_salaire 
    SET 
      rap = total_genere - salaire_net - (charge * (NEW.pourcentage_taxe / 100)) + COALESCE(prime, 0),
      updated_at = CURRENT_TIMESTAMP
    WHERE LOWER(nom) = LOWER(NEW.nom) AND LOWER(prenom) = LOWER(NEW.prenom);
    
    RAISE NOTICE 'Taxes synchronisées automatiquement pour % %', NEW.nom, NEW.prenom;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger sur la table employes
DROP TRIGGER IF EXISTS trigger_sync_taxes_automatique ON employes;
CREATE TRIGGER trigger_sync_taxes_automatique
  AFTER UPDATE ON employes
  FOR EACH ROW
  EXECUTE FUNCTION sync_taxes_automatique();

-- Créer une fonction pour synchroniser automatiquement les totaux générés
CREATE OR REPLACE FUNCTION sync_total_genere_automatique()
RETURNS TRIGGER AS $$
DECLARE
  total_calcule DECIMAL(10,2);
BEGIN
  -- Calculer le total généré basé sur les interventions
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
  ), 0) INTO total_calcule
  FROM interventions i
  WHERE (
    (LOWER(i.nom_technicien) = LOWER(NEW.nom) AND LOWER(i.prenom_technicien) = LOWER(NEW.prenom)) OR
    (LOWER(i.nom_technicien) LIKE LOWER(NEW.nom) AND LOWER(i.prenom_technicien) LIKE LOWER(NEW.prenom)) OR
    (LOWER(i.nom_technicien) LIKE LOWER(NEW.prenom) AND LOWER(i.prenom_technicien) LIKE LOWER(NEW.nom)) OR
    (LOWER(REPLACE(i.nom_technicien, ' ', '')) = LOWER(REPLACE(NEW.nom, ' ', '')) AND LOWER(REPLACE(i.prenom_technicien, ' ', '')) = LOWER(REPLACE(NEW.prenom, ' ', ''))) OR
    (LOWER(REPLACE(i.nom_technicien, ' ', '')) LIKE LOWER(REPLACE(NEW.nom, ' ', '')) AND LOWER(REPLACE(i.prenom_technicien, ' ', '')) LIKE LOWER(REPLACE(NEW.prenom, ' ', ''))) OR
    (LOWER(REPLACE(i.nom_technicien, ' ', '')) LIKE LOWER(REPLACE(NEW.prenom, ' ', '')) AND LOWER(REPLACE(i.prenom_technicien, ' ', '')) LIKE LOWER(REPLACE(NEW.nom, ' ', '')))
  )
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
     (i.date_rdv::date >= DATE(NEW.annee || '-' || LPAD(NEW.mois::text, 2, '0') || '-01') AND 
      i.date_rdv::date <= (DATE(NEW.annee || '-' || LPAD(NEW.mois::text, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day')))
  );
  
  -- Mettre à jour le total généré si différent
  IF ABS(COALESCE(NEW.total_genere, 0) - total_calcule) > 0.01 THEN
    NEW.total_genere := total_calcule;
    
    -- Recalculer le RAP
    NEW.rap := total_calcule - COALESCE(NEW.salaire_net, 0) - COALESCE(NEW.impot, 0) + COALESCE(NEW.prime, 0);
    
    RAISE NOTICE 'Total généré synchronisé automatiquement pour % %: %€', NEW.nom, NEW.prenom, total_calcule;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger sur la table cout_par_salaire
DROP TRIGGER IF EXISTS trigger_sync_total_genere_automatique ON cout_par_salaire;
CREATE TRIGGER trigger_sync_total_genere_automatique
  BEFORE INSERT OR UPDATE ON cout_par_salaire
  FOR EACH ROW
  EXECUTE FUNCTION sync_total_genere_automatique();

-- Afficher les triggers créés
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table, 
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%sync%automatique%';