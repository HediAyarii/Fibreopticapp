-- Script de mise à jour pour ajouter les tables et attributs manquants
-- Exécuter ce script après create_database_schema.sql

-- Table des comptes techniciens
CREATE TABLE IF NOT EXISTS technicien_accounts (
    id SERIAL PRIMARY KEY,
    technicien_id INTEGER NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_locked BOOLEAN DEFAULT false,
    login_attempts INTEGER DEFAULT 0,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des sessions techniciens
CREATE TABLE IF NOT EXISTS technicien_sessions (
    id SERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL REFERENCES technicien_accounts(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- Table pour les souscriptions push
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table pour les photos justificatives des réclamations
CREATE TABLE IF NOT EXISTS reclamation_photos (
    id SERIAL PRIMARY KEY,
    reclamation_id INTEGER REFERENCES reclamations(id) ON DELETE CASCADE,
    photo_path TEXT NOT NULL,
    photo_name TEXT,
    uploaded_by INTEGER REFERENCES employes(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_size INTEGER,
    mime_type TEXT
);

-- Ajouter les colonnes manquantes à la table reclamations
ALTER TABLE reclamations 
ADD COLUMN IF NOT EXISTS date_resolution TIMESTAMP,
ADD COLUMN IF NOT EXISTS commentaire_resolution TEXT,
ADD COLUMN IF NOT EXISTS resolved_by INTEGER REFERENCES employes(id);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_technicien_accounts_username ON technicien_accounts(username);
CREATE INDEX IF NOT EXISTS idx_technicien_accounts_technicien_id ON technicien_accounts(technicien_id);
CREATE INDEX IF NOT EXISTS idx_technicien_sessions_account_id ON technicien_sessions(account_id);
CREATE INDEX IF NOT EXISTS idx_technicien_sessions_token ON technicien_sessions(session_token);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_employee_id ON push_subscriptions(employee_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

CREATE INDEX IF NOT EXISTS idx_reclamation_photos_reclamation_id ON reclamation_photos(reclamation_id);
CREATE INDEX IF NOT EXISTS idx_reclamations_resolved_by ON reclamations(resolved_by);
CREATE INDEX IF NOT EXISTS idx_reclamations_date_resolution ON reclamations(date_resolution);

-- Vue pour faciliter les requêtes sur les comptes techniciens
CREATE OR REPLACE VIEW technicien_accounts_view AS
SELECT 
    ta.id,
    ta.technicien_id,
    ta.username,
    ta.is_active,
    ta.is_locked,
    ta.login_attempts,
    ta.last_login,
    ta.created_at,
    ta.updated_at,
    e.prenom as technicien_prenom,
    e.nom as technicien_nom,
    e.matricule as technicien_matricule,
    e.email as technicien_email,
    e.telephone as technicien_telephone,
    e.niveau_acces as technicien_niveau_acces,
    e.statut as technicien_statut
FROM technicien_accounts ta
JOIN employes e ON ta.technicien_id = e.id;

-- Fonction pour nettoyer les sessions expirées
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM technicien_sessions 
    WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_technicien_accounts_updated_at
    BEFORE UPDATE ON technicien_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Commentaires sur les tables
COMMENT ON TABLE technicien_accounts IS 'Comptes de connexion pour les techniciens';
COMMENT ON TABLE technicien_sessions IS 'Sessions actives des techniciens';
COMMENT ON TABLE push_subscriptions IS 'Souscriptions push pour les notifications';
COMMENT ON TABLE reclamation_photos IS 'Photos justificatives des réclamations';
COMMENT ON VIEW technicien_accounts_view IS 'Vue combinant les comptes techniciens avec les informations des employés';
