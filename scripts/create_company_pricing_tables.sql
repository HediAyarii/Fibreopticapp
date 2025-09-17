-- Tables pour les tarifs des entreprises ERT et Axecom
-- Structure: Companies → Name, Code, Category, Prix, Prix Tech

-- Table principale pour les tarifs des entreprises
CREATE TABLE IF NOT EXISTS company_pricing (
    id SERIAL PRIMARY KEY,
    company_name TEXT NOT NULL, -- AXECOM, ERT OUEST
    service_code TEXT NOT NULL, -- CLEM, CABLE_PAV_1, RACPRO_S, etc.
    category TEXT NOT NULL, -- SAV, RACC
    prix_base DECIMAL(10,2) NOT NULL, -- Prix de base
    prix_tech DECIMAL(10,2) NOT NULL DEFAULT 0, -- Prix technicien/supplément
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_name, service_code, category)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_company_pricing_company ON company_pricing(company_name);
CREATE INDEX IF NOT EXISTS idx_company_pricing_category ON company_pricing(category);
CREATE INDEX IF NOT EXISTS idx_company_pricing_service ON company_pricing(service_code);
CREATE INDEX IF NOT EXISTS idx_company_pricing_company_category ON company_pricing(company_name, category);

-- Table pour les frais d'entreprise (ancienne structure adaptée)
CREATE TABLE IF NOT EXISTS frais_entreprise (
    id SERIAL PRIMARY KEY,
    company_name TEXT NOT NULL, -- AXECOM ou ERT OUEST
    service_code TEXT NOT NULL, -- Code du service utilisé
    category TEXT NOT NULL, -- SAV ou RACC
    numero_facture TEXT UNIQUE NOT NULL,
    date_facture DATE NOT NULL,
    fournisseur TEXT NOT NULL,
    type_frais TEXT NOT NULL, -- transport, materiel, formation, autre
    montant_ht DECIMAL(10,2) NOT NULL,
    montant_ttc DECIMAL(10,2) NOT NULL,
    tva DECIMAL(5,2) DEFAULT 20.00,
    description TEXT,
    statut TEXT DEFAULT 'en_attente', -- en_attente, valide, paye, refuse
    employe_id INTEGER REFERENCES employes(id),
    projet_reference TEXT,
    justificatifs TEXT[], -- Array de fichiers justificatifs
    commentaires TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les frais d'entreprise
CREATE INDEX IF NOT EXISTS idx_frais_entreprise_company ON frais_entreprise(company_name);
CREATE INDEX IF NOT EXISTS idx_frais_entreprise_employe ON frais_entreprise(employe_id);
CREATE INDEX IF NOT EXISTS idx_frais_entreprise_date ON frais_entreprise(date_facture);
CREATE INDEX IF NOT EXISTS idx_frais_entreprise_statut ON frais_entreprise(statut);
CREATE INDEX IF NOT EXISTS idx_frais_entreprise_type ON frais_entreprise(type_frais);

-- Insertion des données de tarifs
INSERT INTO company_pricing (company_name, service_code, category, prix_base, prix_tech) VALUES
-- AXECOM SAV
('AXECOM', 'CLEM', 'SAV', 11, 0),
('AXECOM', 'CABLE_PAV_1', 'SAV', 20, 0),
('AXECOM', 'RACPRO_S', 'SAV', 176, 65),
('AXECOM', 'RACPRO_C', 'SAV', 165, 65),
('AXECOM', 'RACIH', 'SAV', 82, 30),
('AXECOM', 'CABLE_PAV_2', 'SAV', 40, 0),
('AXECOM', 'CABLE_PAV_3', 'SAV', 61, 0),
('AXECOM', 'CABLE_PAV_4', 'SAV', 81, 0),
('AXECOM', 'RECOIP', 'SAV', 50, 25),
('AXECOM', 'REFRAC', 'SAV', 85, 30),
('AXECOM', 'REPFOU_ASPHA', 'SAV', 386, 70),
('AXECOM', 'REPFOU_PUB', 'SAV', 170, 50),
('AXECOM', 'REPFOU_PRI', 'SAV', 170, 50),
('AXECOM', 'SAV', 'SAV', 15, 10),
('AXECOM', 'DEP_OFFE', 'SAV', 15, 10),
('AXECOM', 'SWAP_EQT', 'SAV', 15, 10),
('AXECOM', 'DEMO', 'SAV', 15, 10),
('AXECOM', 'DEP_TORT', 'SAV', 0, 0),
('AXECOM', 'REF_DGR', 'SAV', 85, 30),

-- AXECOM RACC
('AXECOM', 'RACPAV', 'RACC', 140, 65),
('AXECOM', 'CLEM', 'RACC', 11, 0),
('AXECOM', 'CABLE_PAV_1', 'RACC', 20, 0),
('AXECOM', 'RACPRO_S', 'RACC', 176, 65),
('AXECOM', 'RACPRO_C', 'RACC', 165, 65),
('AXECOM', 'RACIH', 'RACC', 85, 30),
('AXECOM', 'CABLE_PAV_2', 'RACC', 40, 0),
('AXECOM', 'CABLE_PAV_3', 'RACC', 61, 0),
('AXECOM', 'CABLE_PAV_4', 'RACC', 81, 0),
('AXECOM', 'RECOIP', 'RACC', 50, 25),
('AXECOM', 'REFRAC', 'RACC', 85, 30),
('AXECOM', 'REPFOU_ASPHA', 'RACC', 386, 50),
('AXECOM', 'REPFOU_PUB', 'RACC', 170, 70),
('AXECOM', 'REPFOU_PRI', 'RACC', 170, 50),
('AXECOM', 'SAV', 'RACC', 15, 10),
('AXECOM', 'REF_DGR', 'RACC', 85, 30),

-- ERT OUEST SAV
('ERT OUEST', 'RACPAV', 'SAV', 140, 60),
('ERT OUEST', 'CLEM', 'SAV', 5, 0),
('ERT OUEST', 'CABLE_PAV_1', 'SAV', 20, 0),
('ERT OUEST', 'RACPRO_S', 'SAV', 195, 60),
('ERT OUEST', 'RACPRO_C', 'SAV', 245, 60),
('ERT OUEST', 'RACIH', 'SAV', 75, 30),
('ERT OUEST', 'CABLE_PAV_2', 'SAV', 40, 0),
('ERT OUEST', 'CABLE_PAV_3', 'SAV', 60, 0),
('ERT OUEST', 'CABLE_PAV_4', 'SAV', 80, 0),
('ERT OUEST', 'RECOIP', 'SAV', 40, 20),
('ERT OUEST', 'REFRAC', 'SAV', 50, 30),
('ERT OUEST', 'REPFOU_ASPHA', 'SAV', 400, 50),
('ERT OUEST', 'REPFOU_PUB', 'SAV', 200, 50),
('ERT OUEST', 'REPFOU_PRI', 'SAV', 200, 50),
('ERT OUEST', 'SAV', 'SAV', 22, 10),
('ERT OUEST', 'DEP_OFFE', 'SAV', 0, 0),
('ERT OUEST', 'SWAP_EQT', 'SAV', 22, 10),
('ERT OUEST', 'DEMO', 'SAV', 22, 10),
('ERT OUEST', 'DEPLPRISE', 'SAV', 85, 30),
('ERT OUEST', 'REF_DGR', 'SAV', 85, 30),
('ERT OUEST', 'DEP_TORT', 'SAV', 0, 0),

-- ERT OUEST RACC
('ERT OUEST', 'RACPAV', 'RACC', 140, 60),
('ERT OUEST', 'CLEM', 'RACC', 5, 0),
('ERT OUEST', 'CABLE_PAV_1', 'RACC', 20, 0),
('ERT OUEST', 'RACPRO_S', 'RACC', 195, 60),
('ERT OUEST', 'RACPRO_C', 'RACC', 245, 60),
('ERT OUEST', 'RACIH', 'RACC', 75, 30),
('ERT OUEST', 'CABLE_PAV_2', 'RACC', 40, 0),
('ERT OUEST', 'CABLE_PAV_3', 'RACC', 60, 0),
('ERT OUEST', 'CABLE_PAV_4', 'RACC', 80, 0),
('ERT OUEST', 'RECOIP', 'RACC', 40, 20),
('ERT OUEST', 'REFRAC', 'RACC', 50, 30),
('ERT OUEST', 'REPFOU_ASPHA', 'RACC', 400, 50),
('ERT OUEST', 'REPFOU_PUB', 'RACC', 200, 50),
('ERT OUEST', 'REPFOU_PRI', 'RACC', 200, 50),
('ERT OUEST', 'REF_DGR', 'RACC', 85, 30)
ON CONFLICT (company_name, service_code, category) DO UPDATE SET
    prix_base = EXCLUDED.prix_base,
    prix_tech = EXCLUDED.prix_tech,
    updated_at = CURRENT_TIMESTAMP;

-- Vue pour faciliter les requêtes
CREATE OR REPLACE VIEW v_company_pricing_summary AS
SELECT 
    company_name,
    category,
    COUNT(*) as service_count,
    SUM(prix_base) as total_base_price,
    SUM(prix_tech) as total_tech_price,
    SUM(prix_base + prix_tech) as total_price
FROM company_pricing
GROUP BY company_name, category
ORDER BY company_name, category;
