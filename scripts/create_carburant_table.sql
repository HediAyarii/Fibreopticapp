-- Script pour créer la table carburant manquante
-- Cette table stocke les informations des cartes carburant

CREATE TABLE IF NOT EXISTS carburant (
    id SERIAL PRIMARY KEY,
    numero_carte VARCHAR(50) UNIQUE NOT NULL,
    montant DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    date_livraison DATE NOT NULL,
    statut VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Créer un index sur le numéro de carte pour les performances
CREATE INDEX IF NOT EXISTS idx_carburant_numero_carte ON carburant(numero_carte);

-- Insérer quelques cartes de test si la table est vide
INSERT INTO carburant (numero_carte, montant, date_livraison, statut) 
SELECT * FROM (VALUES 
    ('CARD-001', 1000.00, '2025-01-01', 'active'),
    ('CARD-002', 1500.00, '2025-01-02', 'active'),
    ('CARD-003', 2000.00, '2025-01-03', 'active'),
    ('CARD-004', 1200.00, '2025-01-04', 'active'),
    ('CARD-005', 1800.00, '2025-01-05', 'active')
) AS test_data(numero_carte, montant, date_livraison, statut)
WHERE NOT EXISTS (SELECT 1 FROM carburant LIMIT 1);

-- Afficher les cartes créées
SELECT 'Cartes carburant créées:' as message;
SELECT numero_carte, montant, date_livraison, statut FROM carburant ORDER BY numero_carte;
