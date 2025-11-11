-- Table pour les réclamations techniques des techniciens
CREATE TABLE IF NOT EXISTS reclamations_techniques (
    id SERIAL PRIMARY KEY,
    intervention_id INTEGER REFERENCES interventions(id) ON DELETE CASCADE,
    num_inter TEXT NOT NULL,
    technicien_id INTEGER,
    nom_technicien TEXT,
    prenom_technicien TEXT,
    type_reclamation TEXT NOT NULL CHECK (type_reclamation IN ('article_manquant', 'probleme_technique', 'erreur_grille', 'autre')),
    description TEXT NOT NULL,
    statut TEXT DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'en_cours', 'resolu', 'rejete')),
    reponse_admin TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_resolution TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_reclamations_techniques_intervention ON reclamations_techniques(intervention_id);
CREATE INDEX IF NOT EXISTS idx_reclamations_techniques_num_inter ON reclamations_techniques(num_inter);
CREATE INDEX IF NOT EXISTS idx_reclamations_techniques_technicien ON reclamations_techniques(nom_technicien, prenom_technicien);
CREATE INDEX IF NOT EXISTS idx_reclamations_techniques_statut ON reclamations_techniques(statut);
CREATE INDEX IF NOT EXISTS idx_reclamations_techniques_date ON reclamations_techniques(date_creation DESC);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_reclamations_techniques_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_update_reclamations_techniques_updated_at ON reclamations_techniques;
CREATE TRIGGER trigger_update_reclamations_techniques_updated_at
    BEFORE UPDATE ON reclamations_techniques
    FOR EACH ROW
    EXECUTE FUNCTION update_reclamations_techniques_updated_at();

COMMENT ON TABLE reclamations_techniques IS 'Réclamations techniques des techniciens sur les interventions (articles manquants, problèmes, etc.)';
