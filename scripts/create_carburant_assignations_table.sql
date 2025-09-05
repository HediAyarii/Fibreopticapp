-- Script pour créer la table carburant_assignations
-- Cette table gère l'historique des assignations de cartes carburant aux employés

CREATE TABLE IF NOT EXISTS carburant_assignations (
    id SERIAL PRIMARY KEY,
    numero_carte VARCHAR(50) NOT NULL,
    employe_id INTEGER NOT NULL,
    employe_nom VARCHAR(255) NOT NULL,
    date_assignation DATE NOT NULL,
    date_fin DATE NULL,
    statut VARCHAR(20) DEFAULT 'active' CHECK (statut IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Contraintes
    CONSTRAINT fk_carburant_assignations_employe 
        FOREIGN KEY (employe_id) REFERENCES employes(id) ON DELETE CASCADE,
    
    -- Index pour améliorer les performances
    CONSTRAINT unique_active_assignment 
        UNIQUE (employe_id, statut) DEFERRABLE INITIALLY DEFERRED
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_carburant_assignations_employe_id ON carburant_assignations(employe_id);
CREATE INDEX IF NOT EXISTS idx_carburant_assignations_numero_carte ON carburant_assignations(numero_carte);
CREATE INDEX IF NOT EXISTS idx_carburant_assignations_statut ON carburant_assignations(statut);
CREATE INDEX IF NOT EXISTS idx_carburant_assignations_date_assignation ON carburant_assignations(date_assignation);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_carburant_assignations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_carburant_assignations_updated_at
    BEFORE UPDATE ON carburant_assignations
    FOR EACH ROW
    EXECUTE FUNCTION update_carburant_assignations_updated_at();

-- Commentaires pour la documentation
COMMENT ON TABLE carburant_assignations IS 'Table de gestion des assignations de cartes carburant aux employés';
COMMENT ON COLUMN carburant_assignations.numero_carte IS 'Numéro de la carte carburant assignée';
COMMENT ON COLUMN carburant_assignations.employe_id IS 'ID de l''employé à qui la carte est assignée';
COMMENT ON COLUMN carburant_assignations.employe_nom IS 'Nom complet de l''employé (pour référence rapide)';
COMMENT ON COLUMN carburant_assignations.date_assignation IS 'Date d''assignation de la carte';
COMMENT ON COLUMN carburant_assignations.date_fin IS 'Date de fin d''assignation (quand la carte est changée)';
COMMENT ON COLUMN carburant_assignations.statut IS 'Statut de l''assignation: active ou inactive';

-- Insérer quelques données de test (optionnel)
-- INSERT INTO carburant_assignations (numero_carte, employe_id, employe_nom, date_assignation, statut) 
-- VALUES 
--     ('1234567890', 1, 'Test Employé', '2024-01-01', 'active'),
--     ('0987654321', 2, 'Autre Employé', '2024-01-15', 'active');

-- Afficher les informations de la table créée
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'carburant_assignations'
ORDER BY ordinal_position;
