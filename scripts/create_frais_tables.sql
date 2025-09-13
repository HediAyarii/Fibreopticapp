-- Tables pour les frais d'entreprise ERT et Axecom

-- Table pour les frais ERT
CREATE TABLE IF NOT EXISTS frais_ert (
    id SERIAL PRIMARY KEY,
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

-- Table pour les frais Axecom
CREATE TABLE IF NOT EXISTS frais_axecom (
    id SERIAL PRIMARY KEY,
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

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_frais_ert_employe ON frais_ert(employe_id);
CREATE INDEX IF NOT EXISTS idx_frais_ert_date ON frais_ert(date_facture);
CREATE INDEX IF NOT EXISTS idx_frais_ert_statut ON frais_ert(statut);
CREATE INDEX IF NOT EXISTS idx_frais_ert_type ON frais_ert(type_frais);

CREATE INDEX IF NOT EXISTS idx_frais_axecom_employe ON frais_axecom(employe_id);
CREATE INDEX IF NOT EXISTS idx_frais_axecom_date ON frais_axecom(date_facture);
CREATE INDEX IF NOT EXISTS idx_frais_axecom_statut ON frais_axecom(statut);
CREATE INDEX IF NOT EXISTS idx_frais_axecom_type ON frais_axecom(type_frais);
