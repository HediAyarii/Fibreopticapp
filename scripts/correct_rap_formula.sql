-- Correction de la formule RAP pour taxe 50%
-- Nouvelle formule: RAP = Total Généré - Salaire Net - (0.5 × Charge) - Total Paiements

-- 1. Mettre à jour la fonction de calcul du RAP
CREATE OR REPLACE FUNCTION calculer_rap_avec_paiements(
  p_cout_par_salaire_id INTEGER
) RETURNS DECIMAL(10,2) AS $$
DECLARE
  v_total_genere DECIMAL(10,2);
  v_salaire_net DECIMAL(10,2);
  v_charge DECIMAL(10,2);
  v_cout_total DECIMAL(10,2);
  v_taxe DECIMAL(5,2);
  v_total_paiements DECIMAL(10,2);
  v_rap_base DECIMAL(10,2);
  v_rap_final DECIMAL(10,2);
BEGIN
  -- Récupérer les données du cout_par_salaire
  SELECT 
    COALESCE(total_genere, 0),
    COALESCE(salaire_net, 0),
    COALESCE(charge, 0),
    COALESCE(cout_total, 0),
    COALESCE(taxe, 0)
  INTO v_total_genere, v_salaire_net, v_charge, v_cout_total, v_taxe
  FROM cout_par_salaire 
  WHERE id = p_cout_par_salaire_id;
  
  -- Calculer le total des paiements
  v_total_paiements := calculer_total_paiements(p_cout_par_salaire_id);
  
  -- Calculer le RAP de base selon la logique correcte
  IF ABS(v_taxe - 100) < 0.01 THEN
    -- Si taxe = 100% : RAP = Total Généré - Salaire Net
    v_rap_base := v_total_genere - v_salaire_net;
  ELSIF ABS(v_taxe - 50) < 0.01 THEN
    -- Si taxe = 50% : RAP = Total Généré - Salaire Net - (0.5 × Charge)
    v_rap_base := v_total_genere - v_salaire_net - (0.5 * v_charge);
  ELSIF ABS(v_taxe) < 0.01 THEN
    -- Si taxe = 0% : RAP = Total Généré - Coût Total
    v_rap_base := v_total_genere - v_cout_total;
  ELSE
    -- Pourcentage de taxe personnalisé : utiliser la logique 0%
    v_rap_base := v_total_genere - v_cout_total;
  END IF;
  
  -- Soustraire les paiements du RAP de base
  v_rap_final := v_rap_base - v_total_paiements;
  
  RETURN v_rap_final;
END;
$$ LANGUAGE plpgsql;

-- 2. Recalculer tous les RAP existants
UPDATE cout_par_salaire 
SET rap = calculer_rap_avec_paiements(id),
    updated_at = CURRENT_TIMESTAMP
WHERE rap IS NOT NULL;

-- 3. Vérifier le cas spécifique de BENADBALLAH TAOUFIK
SELECT 
  nom, prenom, matricule,
  total_genere, salaire_net, charge, taxe, rap, total_paiements,
  -- Calcul manuel pour vérification
  (total_genere - salaire_net - (0.5 * charge) - COALESCE(total_paiements, 0)) as rap_manuel
FROM cout_par_salaire 
WHERE nom = 'BENADBALLAH' AND prenom = 'TAOUFIK';

-- 4. Afficher quelques autres exemples avec taxe 50%
SELECT 
  nom, prenom, matricule,
  total_genere, salaire_net, charge, taxe, rap, total_paiements,
  -- Calcul manuel pour vérification
  (total_genere - salaire_net - (0.5 * charge) - COALESCE(total_paiements, 0)) as rap_manuel
FROM cout_par_salaire 
WHERE ABS(taxe - 50) < 0.01 
ORDER BY id 
LIMIT 5;
