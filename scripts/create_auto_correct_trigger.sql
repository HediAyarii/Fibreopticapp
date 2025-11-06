-- ============================================================================
-- FONCTION ET TRIGGER POUR CORRECTION AUTOMATIQUE DES NOMS
-- Utilise le MATRICULE pour synchroniser automatiquement avec employes
-- ============================================================================

-- 1. Créer la fonction de correction automatique
CREATE OR REPLACE FUNCTION auto_correct_cout_par_salaire_names()
RETURNS TRIGGER AS $$
DECLARE
    emp_record RECORD;
BEGIN
    -- Si un matricule est fourni, on cherche l'employé correspondant
    IF NEW.matricule IS NOT NULL AND NEW.matricule != '' THEN
        -- Récupérer les informations de l'employé depuis la table employes
        SELECT 
            id,
            nom,
            prenom,
            pourcentage_taxe
        INTO emp_record
        FROM employes
        WHERE matricule = NEW.matricule
        AND statut = 'actif'
        LIMIT 1;
        
        -- Si un employé est trouvé, corriger automatiquement
        IF FOUND THEN
            -- Corriger le nom et prénom
            NEW.nom := emp_record.nom;
            NEW.prenom := emp_record.prenom;
            NEW.employe_id := emp_record.id;
            
            -- Synchroniser la taxe aussi
            NEW.taxe := emp_record.pourcentage_taxe;
            
            -- Recalculer l'impôt
            NEW.impot := NEW.charge * (emp_record.pourcentage_taxe / 100);
            
            RAISE NOTICE 'Auto-correction: % % (matricule: %) → % % (employe_id: %)', 
                OLD.nom, OLD.prenom, NEW.matricule, NEW.nom, NEW.prenom, NEW.employe_id;
        ELSE
            RAISE WARNING 'Matricule % non trouvé dans la table employes', NEW.matricule;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Créer le trigger sur INSERT
DROP TRIGGER IF EXISTS trigger_auto_correct_names_insert ON cout_par_salaire;
CREATE TRIGGER trigger_auto_correct_names_insert
    BEFORE INSERT ON cout_par_salaire
    FOR EACH ROW
    EXECUTE FUNCTION auto_correct_cout_par_salaire_names();

-- 3. Créer le trigger sur UPDATE
DROP TRIGGER IF EXISTS trigger_auto_correct_names_update ON cout_par_salaire;
CREATE TRIGGER trigger_auto_correct_names_update
    BEFORE UPDATE ON cout_par_salaire
    FOR EACH ROW
    WHEN (OLD.matricule IS DISTINCT FROM NEW.matricule OR NEW.employe_id IS NULL)
    EXECUTE FUNCTION auto_correct_cout_par_salaire_names();

-- 4. Fonction pour forcer la correction sur toutes les entrées existantes
CREATE OR REPLACE FUNCTION force_correct_all_cout_par_salaire()
RETURNS TABLE(
    corrected_count INTEGER,
    failed_count INTEGER,
    message TEXT
) AS $$
DECLARE
    v_corrected INTEGER := 0;
    v_failed INTEGER := 0;
BEGIN
    -- Corriger toutes les entrées avec matricule
    UPDATE cout_par_salaire cps
    SET 
        nom = e.nom,
        prenom = e.prenom,
        employe_id = e.id,
        taxe = e.pourcentage_taxe,
        impot = cps.charge * (e.pourcentage_taxe / 100),
        updated_at = CURRENT_TIMESTAMP
    FROM employes e
    WHERE cps.matricule = e.matricule
    AND cps.matricule IS NOT NULL
    AND cps.matricule != ''
    AND e.statut = 'actif';
    
    GET DIAGNOSTICS v_corrected = ROW_COUNT;
    
    -- Compter les entrées qui n'ont pas pu être corrigées
    SELECT COUNT(*)
    INTO v_failed
    FROM cout_par_salaire cps
    WHERE (cps.matricule IS NULL OR cps.matricule = '')
    OR NOT EXISTS (
        SELECT 1 FROM employes e 
        WHERE e.matricule = cps.matricule 
        AND e.statut = 'actif'
    );
    
    RETURN QUERY SELECT 
        v_corrected,
        v_failed,
        format('✅ %s entrées corrigées, ⚠️ %s entrées non corrigées', v_corrected, v_failed);
END;
$$ LANGUAGE plpgsql;

-- 5. Afficher les triggers créés
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'cout_par_salaire'
AND trigger_name LIKE '%auto_correct%'
ORDER BY trigger_name;

-- 6. Message de confirmation
SELECT 
    '✅ TRIGGER DE CORRECTION AUTOMATIQUE INSTALLÉ !' as message,
    'Les noms seront automatiquement corrigés à chaque INSERT/UPDATE' as details,
    'Utilisez: SELECT * FROM force_correct_all_cout_par_salaire();' as commande_correction_manuelle;
