-- Tables pour la gestion des documents de sécurité des techniciens

-- Table des catégories de documents de sécurité
CREATE TABLE IF NOT EXISTS securite_categories (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    ordre INT DEFAULT 0,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des documents de sécurité
CREATE TABLE IF NOT EXISTS securite_documents (
    id SERIAL PRIMARY KEY,
    categorie_id INT NOT NULL REFERENCES securite_categories(id) ON DELETE CASCADE,
    technicien_account_id INT REFERENCES technicien_accounts(id) ON DELETE CASCADE, -- NULL = document global pour tous
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    fichier_url TEXT NOT NULL,
    fichier_nom VARCHAR(255) NOT NULL,
    fichier_type VARCHAR(50),
    fichier_taille INT,
    date_expiration DATE, -- Pour les documents avec date d'expiration (habilitations, etc.)
    est_global BOOLEAN DEFAULT false, -- true = visible par tous les techniciens
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_securite_documents_categorie ON securite_documents(categorie_id);
CREATE INDEX IF NOT EXISTS idx_securite_documents_technicien ON securite_documents(technicien_account_id);
CREATE INDEX IF NOT EXISTS idx_securite_documents_global ON securite_documents(est_global);

-- Insérer quelques catégories par défaut
INSERT INTO securite_categories (nom, description, ordre) VALUES 
    ('Plan de Prévention', 'Documents relatifs aux plans de prévention', 1),
    ('Habilitation Électrique', 'Habilitations électriques des techniciens', 2),
    ('AIPR', 'Autorisation d''Intervention à Proximité des Réseaux', 3),
    ('CACES', 'Certificat d''Aptitude à la Conduite En Sécurité', 4)
ON CONFLICT (nom) DO NOTHING;

-- Commentaires
COMMENT ON TABLE securite_categories IS 'Catégories de documents de sécurité (Plan prévention, Habilitation, AIPR, CACES...)';
COMMENT ON TABLE securite_documents IS 'Documents de sécurité associés aux techniciens ou globaux';
COMMENT ON COLUMN securite_documents.est_global IS 'Si true, le document est visible par tous les techniciens';
COMMENT ON COLUMN securite_documents.technicien_account_id IS 'NULL si document global, sinon ID du compte technicien';
