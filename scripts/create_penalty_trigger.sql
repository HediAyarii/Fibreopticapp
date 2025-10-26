-- Trigger pour mettre à jour automatiquement cout_par_salaire lors de l'ajout d'une pénalité
-- Ce trigger se déclenche après l'insertion d'une pénalité et met à jour la colonne penalite dans cout_par_salaire

-- Fonction trigger pour mettre à jour cout_par_salaire
CREATE OR REPLACE FUNCTION update_cout_par_salaire_penalite()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour la colonne penalite dans cout_par_salaire
    -- en utilisant le matricule de l'employé et la date d'attribution
    UPDATE cout_par_salaire 
    SET 
        penalite = (
            SELECT COALESCE(SUM(montant), 0)
            FROM penalites p
            JOIN employes e ON p.employe_id = e.id
            WHERE e.matricule = (
                SELECT matricule 
                FROM employes 
                WHERE id = NEW.employe_id
            )
            AND EXTRACT(YEAR FROM p.date_attribution) = EXTRACT(YEAR FROM NEW.date_attribution)
            AND EXTRACT(MONTH FROM p.date_attribution) = EXTRACT(MONTH FROM NEW.date_attribution)
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE matricule = (
        SELECT matricule 
        FROM employes 
        WHERE id = NEW.employe_id
    )
    AND annee = EXTRACT(YEAR FROM NEW.date_attribution)
    AND mois = EXTRACT(MONTH FROM NEW.date_attribution);
    
    -- Si aucun enregistrement trouvé, créer un nouvel enregistrement
    IF NOT FOUND THEN
        INSERT INTO cout_par_salaire (
            nom, prenom, matricule, annee, mois, penalite, created_at, updated_at
        )
        SELECT 
            e.nom,
            e.prenom,
            e.matricule,
            EXTRACT(YEAR FROM NEW.date_attribution),
            EXTRACT(MONTH FROM NEW.date_attribution),
            NEW.montant,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        FROM employes e
        WHERE e.id = NEW.employe_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_update_cout_par_salaire_penalite ON penalites;

CREATE TRIGGER trigger_update_cout_par_salaire_penalite
    AFTER INSERT ON penalites
    FOR EACH ROW
    EXECUTE FUNCTION update_cout_par_salaire_penalite();

-- Commentaire sur le trigger
COMMENT ON TRIGGER trigger_update_cout_par_salaire_penalite ON penalites 
IS 'Met à jour automatiquement cout_par_salaire lors de l''ajout d''une pénalité';
