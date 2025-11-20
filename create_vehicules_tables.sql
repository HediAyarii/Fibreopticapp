-- Création de la table vehicules
CREATE TABLE IF NOT EXISTS vehicules (
  id SERIAL PRIMARY KEY,
  matricule VARCHAR(50) UNIQUE NOT NULL,
  marque VARCHAR(100) NOT NULL,
  modele VARCHAR(100),
  annee INTEGER NOT NULL,
  kilometrage INTEGER DEFAULT 0,
  type_vehicule VARCHAR(50) DEFAULT 'voiture',
  couleur VARCHAR(50),
  numero_chassis VARCHAR(100),
  date_acquisition DATE,
  statut VARCHAR(50) DEFAULT 'disponible',
  commentaires TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Création de la table assignations_vehicules
CREATE TABLE IF NOT EXISTS assignations_vehicules (
  id SERIAL PRIMARY KEY,
  vehicule_id INTEGER REFERENCES vehicules(id) ON DELETE CASCADE,
  employe_id INTEGER REFERENCES employes(id) ON DELETE SET NULL,
  date_assignation DATE NOT NULL,
  date_fin DATE,
  kilometrage_debut INTEGER DEFAULT 0,
  kilometrage_fin INTEGER DEFAULT 0,
  statut VARCHAR(50) DEFAULT 'active',
  commentaires TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Création de la table entretiens_vehicules
CREATE TABLE IF NOT EXISTS entretiens_vehicules (
  id SERIAL PRIMARY KEY,
  vehicule_id INTEGER REFERENCES vehicules(id) ON DELETE CASCADE,
  categorie_entretien VARCHAR(100) NOT NULL,
  date_entretien DATE NOT NULL,
  cout_entretien DECIMAL(10, 2) NOT NULL,
  kilometrage_entretien INTEGER,
  garage VARCHAR(200),
  facture_numero VARCHAR(100),
  description TEXT,
  prochain_entretien_km INTEGER,
  prochain_entretien_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_vehicules_statut ON vehicules(statut);
CREATE INDEX IF NOT EXISTS idx_vehicules_matricule ON vehicules(matricule);
CREATE INDEX IF NOT EXISTS idx_assignations_vehicules_vehicule_id ON assignations_vehicules(vehicule_id);
CREATE INDEX IF NOT EXISTS idx_assignations_vehicules_employe_id ON assignations_vehicules(employe_id);
CREATE INDEX IF NOT EXISTS idx_assignations_vehicules_statut ON assignations_vehicules(statut);
CREATE INDEX IF NOT EXISTS idx_entretiens_vehicules_vehicule_id ON entretiens_vehicules(vehicule_id);
CREATE INDEX IF NOT EXISTS idx_entretiens_vehicules_date ON entretiens_vehicules(date_entretien);

-- Commentaires sur les tables
COMMENT ON TABLE vehicules IS 'Table pour gérer la flotte de véhicules';
COMMENT ON TABLE assignations_vehicules IS 'Table pour gérer les assignations de véhicules aux techniciens';
COMMENT ON TABLE entretiens_vehicules IS 'Table pour gérer les entretiens et réparations des véhicules';
