-- Table des absences
CREATE TABLE IF NOT EXISTS absences (
  id SERIAL PRIMARY KEY,
  employe_id INTEGER REFERENCES employes(id) ON DELETE CASCADE,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  type_absence VARCHAR(50) NOT NULL DEFAULT 'conge',
  -- Types: conge, maladie, sans_solde, formation, autre
  motif TEXT,
  statut VARCHAR(20) NOT NULL DEFAULT 'en_attente',
  -- Statuts: en_attente (demande tech), approuvee, refusee, directe (créée par admin)
  commentaire_admin TEXT,
  demande_par VARCHAR(20) NOT NULL DEFAULT 'technicien',
  -- demande_par: technicien (le tech a fait la demande), admin (créé directement par admin/employé)
  approuve_par VARCHAR(100),
  date_decision TIMESTAMP,
  couleur VARCHAR(20) DEFAULT '#3B82F6',
  -- Couleurs par défaut par type: conge=#3B82F6(bleu), maladie=#EF4444(rouge), sans_solde=#F59E0B(orange), formation=#8B5CF6(violet), autre=#6B7280(gris)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_absences_employe_id ON absences(employe_id);
CREATE INDEX IF NOT EXISTS idx_absences_dates ON absences(date_debut, date_fin);
CREATE INDEX IF NOT EXISTS idx_absences_statut ON absences(statut);
