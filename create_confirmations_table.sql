-- Table pour stocker les confirmations de montants mensuels des techniciens
CREATE TABLE IF NOT EXISTS confirmations_montants (
  id SERIAL PRIMARY KEY,
  employe_id INTEGER NOT NULL,
  matricule VARCHAR(50),
  mois VARCHAR(7) NOT NULL, -- Format: YYYY-MM (ex: 2025-10)
  montant_confirme DECIMAL(10, 2) NOT NULL,
  date_confirmation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  details JSONB, -- Stocke les détails: interventions, montants par catégorie, carburant, pénalités
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Contrainte unique: un employé ne peut confirmer qu'une seule fois par mois
  UNIQUE(employe_id, mois)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_confirmations_employe_id ON confirmations_montants(employe_id);
CREATE INDEX IF NOT EXISTS idx_confirmations_mois ON confirmations_montants(mois);
CREATE INDEX IF NOT EXISTS idx_confirmations_date ON confirmations_montants(date_confirmation);

-- Commentaires
COMMENT ON TABLE confirmations_montants IS 'Confirmations mensuelles des montants par les techniciens';
COMMENT ON COLUMN confirmations_montants.mois IS 'Mois concerné au format YYYY-MM (ex: 2025-10)';
COMMENT ON COLUMN confirmations_montants.details IS 'JSON contenant: total_interventions, montants_par_categorie, carburant, penalites';
