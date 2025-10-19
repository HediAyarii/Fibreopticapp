-- Script pour créer la fonction detecter_conflits_assignation
CREATE OR REPLACE FUNCTION detecter_conflits_assignation(
    p_employe_id INTEGER,
    p_carte_id VARCHAR(255),
    p_date_debut TIMESTAMP
) RETURNS TABLE(
    conflit_existe BOOLEAN,
    message_conflit TEXT,
    assignation_existante_id INTEGER,
    assignation_existante_employe_id INTEGER,
    assignation_existante_carte_id VARCHAR(255),
    assignation_existante_date_debut TIMESTAMP,
    assignation_existante_date_fin TIMESTAMP
) AS $$
BEGIN
    -- Vérifier s'il y a des conflits d'assignation
    RETURN QUERY
    SELECT 
        CASE 
            WHEN ca.id IS NOT NULL THEN TRUE
            ELSE FALSE
        END as conflit_existe,
        CASE 
            WHEN ca.id IS NOT NULL THEN 
                'Conflit détecté: La carte ' || ca.carte_id || ' est déjà assignée à l''employé ' || 
                COALESCE(e.nom || ' ' || e.prenom, 'ID:' || ca.employe_id) || 
                ' du ' || ca.date_assignation::DATE || ' au ' || COALESCE(ca.date_fin::DATE, 'actuellement')
            ELSE 'Aucun conflit détecté'
        END as message_conflit,
        ca.id as assignation_existante_id,
        ca.employe_id as assignation_existante_employe_id,
        ca.carte_id as assignation_existante_carte_id,
        ca.date_assignation as assignation_existante_date_debut,
        ca.date_fin as assignation_existante_date_fin
    FROM carburant_assignations ca
    LEFT JOIN employes e ON e.id = ca.employe_id
    WHERE ca.carte_id = p_carte_id
        AND ca.statut = 'active'
        AND (
            -- Conflit 1: La carte est déjà assignée à un autre employé
            (ca.employe_id != p_employe_id)
            OR
            -- Conflit 2: L'employé a déjà une carte assignée
            (ca.employe_id = p_employe_id AND ca.carte_id != p_carte_id)
        )
        AND (
            -- Vérifier les chevauchements de dates
            (ca.date_fin IS NULL) -- Assignation active sans date de fin
            OR
            (ca.date_fin IS NOT NULL AND ca.date_fin >= p_date_debut) -- Chevauchement de dates
        )
    LIMIT 1;
    
    -- Si aucun conflit trouvé, retourner un résultat par défaut
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            FALSE as conflit_existe,
            'Aucun conflit détecté' as message_conflit,
            NULL::INTEGER as assignation_existante_id,
            NULL::INTEGER as assignation_existante_employe_id,
            NULL::VARCHAR(255) as assignation_existante_carte_id,
            NULL::TIMESTAMP as assignation_existante_date_debut,
            NULL::TIMESTAMP as assignation_existante_date_fin;
    END IF;
END;
$$ LANGUAGE plpgsql;





