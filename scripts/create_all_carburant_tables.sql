-- Script complet pour créer toutes les tables manquantes pour le système de carburant
-- Ce script crée les tables carburant, carburant_assignations, et carburant_consommation

-- 1. Créer la table carburant (cartes carburant)
CREATE TABLE IF NOT EXISTS carburant (
    id SERIAL PRIMARY KEY,
    numero_carte VARCHAR(50) UNIQUE NOT NULL,
    montant DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    date_livraison DATE NOT NULL,
    statut VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Créer la table carburant_assignations (assignation des cartes aux employés)
CREATE TABLE IF NOT EXISTS carburant_assignations (
    id SERIAL PRIMARY KEY,
    numero_carte VARCHAR(50) NOT NULL,
    employe_id INTEGER NOT NULL,
    date_assignation DATE NOT NULL DEFAULT CURRENT_DATE,
    statut VARCHAR(20) DEFAULT 'active',
    commentaires TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employe_id) REFERENCES employes(id) ON DELETE CASCADE
);

-- 3. Créer la table carburant_consommation (historique des consommations)
CREATE TABLE IF NOT EXISTS carburant_consommation (
    id SERIAL PRIMARY KEY,
    numero_carte VARCHAR(50) NOT NULL,
    employe_id INTEGER,
    date_livraison DATE NOT NULL,
    heure_livraison TIME,
    immat_vehicule VARCHAR(20),
    km INTEGER,
    poste1 VARCHAR(100),
    poste2 VARCHAR(100),
    pays VARCHAR(10),
    numero_station VARCHAR(50),
    point_acceptation VARCHAR(200),
    identifiant_autoroute VARCHAR(100),
    cp VARCHAR(10),
    type_marchandises VARCHAR(100),
    quantite DECIMAL(10,2),
    taux_tva DECIMAL(5,2),
    ca_ht DECIMAL(10,2),
    tva DECIMAL(10,2),
    ca_ttc DECIMAL(10,2),
    numero_justificatif VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employe_id) REFERENCES employes(id) ON DELETE SET NULL
);

-- Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_carburant_numero_carte ON carburant(numero_carte);
CREATE INDEX IF NOT EXISTS idx_carburant_assignations_carte ON carburant_assignations(numero_carte);
CREATE INDEX IF NOT EXISTS idx_carburant_assignations_employe ON carburant_assignations(employe_id);
CREATE INDEX IF NOT EXISTS idx_carburant_assignations_statut ON carburant_assignations(statut);
CREATE INDEX IF NOT EXISTS idx_carburant_consommation_carte ON carburant_consommation(numero_carte);
CREATE INDEX IF NOT EXISTS idx_carburant_consommation_employe ON carburant_consommation(employe_id);
CREATE INDEX IF NOT EXISTS idx_carburant_consommation_date ON carburant_consommation(date_livraison);

-- Insérer quelques cartes de test si la table est vide
INSERT INTO carburant (numero_carte, montant, date_livraison, statut) 
SELECT * FROM (VALUES 
    ('CARD-001', 1000.00, '2025-01-01', 'active'),
    ('CARD-002', 1500.00, '2025-01-02', 'active'),
    ('CARD-003', 2000.00, '2025-01-03', 'active'),
    ('CARD-004', 1200.00, '2025-01-04', 'active'),
    ('CARD-005', 1800.00, '2025-01-05', 'active'),
    ('CARD-006', 2200.00, '2025-01-06', 'active'),
    ('CARD-007', 1600.00, '2025-01-07', 'active'),
    ('CARD-008', 1900.00, '2025-01-08', 'active')
) AS test_data(numero_carte, montant, date_livraison, statut)
WHERE NOT EXISTS (SELECT 1 FROM carburant LIMIT 1);

-- Afficher les informations de création
SELECT 'Tables créées avec succès:' as message;
SELECT 'carburant' as table_name, COUNT(*) as records FROM carburant
UNION ALL
SELECT 'carburant_assignations' as table_name, COUNT(*) as records FROM carburant_assignations
UNION ALL
SELECT 'carburant_consommation' as table_name, COUNT(*) as records FROM carburant_consommation;

-- Afficher les cartes créées
SELECT 'Cartes carburant disponibles:' as message;
SELECT numero_carte, montant, date_livraison, statut FROM carburant ORDER BY numero_carte;
