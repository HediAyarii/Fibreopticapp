-- Table pour les amendes de véhicules
-- Note: Les amendes sont toujours payées par l'entreprise, pas de gestion de statut de paiement
CREATE TABLE IF NOT EXISTS amendes_vehicules (
    id SERIAL PRIMARY KEY,
    vehicule_id INTEGER NOT NULL REFERENCES vehicules(id) ON DELETE CASCADE,
    employe_id INTEGER REFERENCES employes(id) ON DELETE SET NULL,
    
    -- Détails de l'amende
    date_amende DATE NOT NULL,
    date_infraction DATE,
    numero_amende VARCHAR(100),
    type_infraction VARCHAR(255) NOT NULL,
    lieu_infraction VARCHAR(255),
    montant DECIMAL(10, 2) NOT NULL,
    
    -- Document PDF
    pdf_url TEXT,
    pdf_filename VARCHAR(255),
    
    -- Notes
    description TEXT,
    
    -- Métadonnées
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_amendes_vehicules_vehicule_id ON amendes_vehicules(vehicule_id);
CREATE INDEX IF NOT EXISTS idx_amendes_vehicules_employe_id ON amendes_vehicules(employe_id);
CREATE INDEX IF NOT EXISTS idx_amendes_vehicules_date ON amendes_vehicules(date_amende DESC);

-- Commentaires
COMMENT ON TABLE amendes_vehicules IS 'Table des amendes de véhicules avec upload PDF - payées par l''entreprise';
COMMENT ON COLUMN amendes_vehicules.pdf_url IS 'URL du fichier PDF de l''amende';
