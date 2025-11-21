-- Script de création des tables pour la gestion des véhicules et entretiens

-- Table vehicules
CREATE TABLE IF NOT EXISTS vehicules (
    id SERIAL PRIMARY KEY,
    matricule VARCHAR(20) UNIQUE NOT NULL,
    marque VARCHAR(100) NOT NULL,
    modele VARCHAR(100) NOT NULL,
    annee INTEGER,
    couleur VARCHAR(50),
    type_vehicule VARCHAR(50) DEFAULT 'utilitaire',
    immatriculation VARCHAR(20) UNIQUE,
    numero_chassis VARCHAR(100) UNIQUE,
    carburant VARCHAR(20) DEFAULT 'diesel',
    puissance_cv INTEGER,
    kilometrage INTEGER DEFAULT 0,
    date_mise_service DATE,
    statut VARCHAR(20) DEFAULT 'actif',
    employe_id INTEGER REFERENCES employes(id),
    assurance_numero VARCHAR(100),
    assurance_expiration DATE,
    visite_technique_expiration DATE,
    cout_acquisition DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table entretiens_vehicules
CREATE TABLE IF NOT EXISTS entretiens_vehicules (
    id SERIAL PRIMARY KEY,
    vehicule_id INTEGER NOT NULL REFERENCES vehicules(id) ON DELETE CASCADE,
    type_entretien VARCHAR(100) NOT NULL,
    date_entretien DATE NOT NULL,
    kilometrage INTEGER,
    cout DECIMAL(10,2),
    description TEXT,
    prestataire VARCHAR(200),
    numero_facture VARCHAR(100),
    prochaine_echeance DATE,
    prochaine_echeance_km INTEGER,
    statut VARCHAR(20) DEFAULT 'termine',
    employe_demandeur_id INTEGER REFERENCES employes(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_vehicules_employe ON vehicules(employe_id);
CREATE INDEX IF NOT EXISTS idx_vehicules_statut ON vehicules(statut);
CREATE INDEX IF NOT EXISTS idx_entretiens_vehicule ON entretiens_vehicules(vehicule_id);
CREATE INDEX IF NOT EXISTS idx_entretiens_date ON entretiens_vehicules(date_entretien);

-- Fonction de mise à jour du timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour mettre à jour automatiquement updated_at
DROP TRIGGER IF EXISTS update_vehicules_updated_at ON vehicules;
CREATE TRIGGER update_vehicules_updated_at
    BEFORE UPDATE ON vehicules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_entretiens_vehicules_updated_at ON entretiens_vehicules;
CREATE TRIGGER update_entretiens_vehicules_updated_at
    BEFORE UPDATE ON entretiens_vehicules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insertion de données d'exemple pour les véhicules
INSERT INTO vehicules (
    matricule, marque, modele, annee, couleur, type_vehicule, 
    immatriculation, carburant, puissance_cv, kilometrage, 
    date_mise_service, statut, cout_acquisition
) VALUES
('VH001', 'Renault', 'Kangoo', 2020, 'Blanc', 'utilitaire', 'TN-123-456', 'diesel', 90, 45000, '2020-01-15', 'actif', 18500.00),
('VH002', 'Peugeot', 'Partner', 2021, 'Gris', 'utilitaire', 'TN-789-012', 'diesel', 100, 32000, '2021-03-10', 'actif', 21000.00),
('VH003', 'Citroën', 'Berlingo', 2019, 'Blanc', 'utilitaire', 'TN-345-678', 'diesel', 85, 67000, '2019-06-20', 'actif', 17800.00),
('VH004', 'Ford', 'Transit', 2022, 'Bleu', 'camionnette', 'TN-901-234', 'diesel', 130, 15000, '2022-02-01', 'actif', 28500.00)
ON CONFLICT (matricule) DO NOTHING;

-- Insertion de données d'exemple pour les entretiens
INSERT INTO entretiens_vehicules (
    vehicule_id, type_entretien, date_entretien, kilometrage, 
    cout, description, prestataire, statut
) VALUES
(1, 'Vidange', '2024-11-01', 45000, 85.50, 'Vidange moteur + filtre à huile', 'Garage Central', 'termine'),
(1, 'Révision', '2024-06-15', 42000, 250.00, 'Révision complète 40000km', 'Garage Central', 'termine'),
(2, 'Vidange', '2024-10-20', 32000, 90.00, 'Vidange + contrôle général', 'Auto Service', 'termine'),
(3, 'Pneus', '2024-09-10', 65000, 320.00, 'Changement 4 pneus', 'Pneumatique Express', 'termine'),
(4, 'Vidange', '2024-11-15', 15000, 95.00, 'Première vidange', 'Ford Service', 'termine')
ON CONFLICT DO NOTHING;

COMMIT;