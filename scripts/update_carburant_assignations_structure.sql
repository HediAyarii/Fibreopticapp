-- Mise à jour de la structure des assignations carburant
-- Pour permettre les assignations par période et l'historique des mouvements

-- 1. Modifier la table carburant_assignations pour supporter les périodes
ALTER TABLE carburant_assignations 
DROP CONSTRAINT IF EXISTS unique_active_assignment;

-- Ajouter des colonnes pour la gestion des périodes
ALTER TABLE carburant_assignations 
ADD COLUMN IF NOT EXISTS date_debut DATE NOT NULL DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS date_fin_prevue DATE,
ADD COLUMN IF NOT EXISTS date_fin_reelle DATE,
ADD COLUMN IF NOT EXISTS motif_fin TEXT,
ADD COLUMN IF NOT EXISTS assignee_par INTEGER REFERENCES employes(id),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Renommer la colonne existante pour plus de clarté (si elle n'existe pas déjà)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'carburant_assignations' AND column_name = 'date_assignation') 
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'carburant_assignations' AND column_name = 'date_debut') THEN
        ALTER TABLE carburant_assignations RENAME COLUMN date_assignation TO date_debut;
    END IF;
END $$;

-- 2. Créer une table pour l'historique des mouvements de cartes
CREATE TABLE IF NOT EXISTS carburant_mouvements (
    id SERIAL PRIMARY KEY,
    numero_carte VARCHAR(50) NOT NULL,
    employe_id_precedent INTEGER REFERENCES employes(id),
    employe_id_nouveau INTEGER REFERENCES employes(id),
    date_mouvement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    type_mouvement VARCHAR(50) NOT NULL, -- 'assignation', 'retour', 'transfert', 'suspension'
    motif TEXT,
    assignee_par INTEGER REFERENCES employes(id),
    commentaires TEXT,
    assignation_id INTEGER REFERENCES carburant_assignations(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Créer une table pour les conflits d'assignation
CREATE TABLE IF NOT EXISTS carburant_conflits (
    id SERIAL PRIMARY KEY,
    numero_carte VARCHAR(50) NOT NULL,
    assignation_1_id INTEGER REFERENCES carburant_assignations(id),
    assignation_2_id INTEGER REFERENCES carburant_assignations(id),
    date_debut_conflit DATE NOT NULL,
    date_fin_conflit DATE NOT NULL,
    statut VARCHAR(20) DEFAULT 'detecte', -- 'detecte', 'resolu', 'ignore'
    resolution TEXT,
    resolu_par INTEGER REFERENCES employes(id),
    date_resolution TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Créer des index pour les performances
CREATE INDEX IF NOT EXISTS idx_carburant_assignations_periode ON carburant_assignations(date_debut, date_fin_prevue);
CREATE INDEX IF NOT EXISTS idx_carburant_assignations_carte_periode ON carburant_assignations(numero_carte, date_debut, date_fin_prevue);
CREATE INDEX IF NOT EXISTS idx_carburant_mouvements_carte ON carburant_mouvements(numero_carte);
CREATE INDEX IF NOT EXISTS idx_carburant_mouvements_date ON carburant_mouvements(date_mouvement);
CREATE INDEX IF NOT EXISTS idx_carburant_mouvements_employe ON carburant_mouvements(employe_id_nouveau);
CREATE INDEX IF NOT EXISTS idx_carburant_conflits_carte ON carburant_conflits(numero_carte);

-- 5. Créer une fonction pour détecter les conflits d'assignation
CREATE OR REPLACE FUNCTION detecter_conflits_assignation(p_numero_carte VARCHAR(50), p_date_debut DATE, p_date_fin DATE)
RETURNS TABLE(
    assignation_id INTEGER,
    employe_nom VARCHAR(255),
    date_debut_conflit DATE,
    date_fin_conflit DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ca.id,
        ca.employe_nom,
        ca.date_debut,
        COALESCE(ca.date_fin_reelle, ca.date_fin_prevue, '2099-12-31'::DATE) as date_fin
    FROM carburant_assignations ca
    WHERE ca.numero_carte = p_numero_carte
    AND ca.statut = 'active'
    AND (
        -- Chevauchement de périodes
        (ca.date_debut <= p_date_fin AND COALESCE(ca.date_fin_reelle, ca.date_fin_prevue, '2099-12-31'::DATE) >= p_date_debut)
    );
END;
$$ LANGUAGE plpgsql;

-- 6. Créer une fonction pour l'historique des assignations d'une carte
CREATE OR REPLACE FUNCTION historique_carte(p_numero_carte VARCHAR(50))
RETURNS TABLE(
    periode TEXT,
    employe_nom VARCHAR(255),
    type_mouvement VARCHAR(50),
    date_mouvement TIMESTAMP,
    motif TEXT,
    statut VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CONCAT(ca.date_debut, ' -> ', COALESCE(ca.date_fin_reelle::TEXT, ca.date_fin_prevue::TEXT, 'En cours')) as periode,
        ca.employe_nom,
        'assignation'::VARCHAR(50) as type_mouvement,
        ca.created_at as date_mouvement,
        ca.commentaires as motif,
        ca.statut
    FROM carburant_assignations ca
    WHERE ca.numero_carte = p_numero_carte
    
    UNION ALL
    
    SELECT 
        cm.date_mouvement::DATE::TEXT as periode,
        COALESCE(e.prenom || ' ' || e.nom, 'Système') as employe_nom,
        cm.type_mouvement,
        cm.date_mouvement,
        cm.motif,
        'historique'::VARCHAR(20) as statut
    FROM carburant_mouvements cm
    LEFT JOIN employes e ON cm.employe_id_nouveau = e.id
    WHERE cm.numero_carte = p_numero_carte
    
    ORDER BY date_mouvement DESC;
END;
$$ LANGUAGE plpgsql;

-- 7. Créer une vue pour les assignations actives avec informations complètes
CREATE OR REPLACE VIEW carburant_assignations_actives AS
SELECT 
    ca.*,
    e.prenom,
    e.nom,
    e.matricule,
    c.montant as montant_carte,
    c.statut as statut_carte,
    CASE 
        WHEN ca.date_fin_reelle IS NOT NULL THEN 'terminee'
        WHEN ca.date_fin_prevue IS NOT NULL AND ca.date_fin_prevue < CURRENT_DATE THEN 'expiree'
        ELSE 'active'
    END as statut_reel
FROM carburant_assignations ca
JOIN employes e ON ca.employe_id = e.id
JOIN carburant c ON ca.numero_carte = c.numero_carte
WHERE ca.statut = 'active';

-- 8. Trigger pour créer automatiquement un mouvement lors d'une assignation
CREATE OR REPLACE FUNCTION trigger_carburant_mouvement()
RETURNS TRIGGER AS $$
BEGIN
    -- Lors d'une nouvelle assignation
    IF TG_OP = 'INSERT' THEN
        INSERT INTO carburant_mouvements (
            numero_carte, 
            employe_id_nouveau, 
            type_mouvement, 
            motif, 
            assignation_id,
            assignee_par
        ) VALUES (
            NEW.numero_carte,
            NEW.employe_id,
            'assignation',
            'Nouvelle assignation: ' || NEW.date_debut || COALESCE(' -> ' || NEW.date_fin_prevue::TEXT, ''),
            NEW.id,
            NEW.assignee_par
        );
    END IF;
    
    -- Lors de la fin d'une assignation
    IF TG_OP = 'UPDATE' AND OLD.date_fin_reelle IS NULL AND NEW.date_fin_reelle IS NOT NULL THEN
        INSERT INTO carburant_mouvements (
            numero_carte,
            employe_id_precedent,
            type_mouvement,
            motif,
            assignation_id
        ) VALUES (
            NEW.numero_carte,
            NEW.employe_id,
            'retour',
            COALESCE(NEW.motif_fin, 'Fin d''assignation'),
            NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_carburant_assignation_mouvement
    AFTER INSERT OR UPDATE ON carburant_assignations
    FOR EACH ROW
    EXECUTE FUNCTION trigger_carburant_mouvement();

-- 9. Commentaires sur les nouvelles structures
COMMENT ON TABLE carburant_mouvements IS 'Historique de tous les mouvements des cartes carburant';
COMMENT ON TABLE carburant_conflits IS 'Détection et résolution des conflits d''assignation';
COMMENT ON COLUMN carburant_assignations.date_debut IS 'Date de début de l''assignation';
COMMENT ON COLUMN carburant_assignations.date_fin_prevue IS 'Date de fin prévue de l''assignation';
COMMENT ON COLUMN carburant_assignations.date_fin_reelle IS 'Date de fin réelle de l''assignation';
COMMENT ON VIEW carburant_assignations_actives IS 'Vue des assignations actives avec informations complètes';

-- 10. Insérer quelques données de test
INSERT INTO carburant_assignations (numero_carte, employe_id, employe_nom, date_debut, date_fin_prevue, statut, commentaires, assignee_par)
SELECT 'CARD-001', 1, 'Test Employé', '2025-01-01', '2025-01-31', 'active', 'Assignation de test', 1
WHERE EXISTS (SELECT 1 FROM employes LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM carburant_assignations WHERE numero_carte = 'CARD-001');

-- Afficher le résultat
SELECT 'Mise à jour terminée - Structure des assignations par période créée' as message;
