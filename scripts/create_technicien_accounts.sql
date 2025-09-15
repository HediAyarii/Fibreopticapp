-- Script de création des tables pour le système de comptes techniciens
-- Exécuter ce script dans votre base de données PostgreSQL

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

-- Table des sessions techniciens (optionnel, pour un suivi plus détaillé)
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

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_technicien_accounts_username ON technicien_accounts(username);
CREATE INDEX IF NOT EXISTS idx_technicien_accounts_technicien_id ON technicien_accounts(technicien_id);
CREATE INDEX IF NOT EXISTS idx_technicien_sessions_account_id ON technicien_sessions(account_id);
CREATE INDEX IF NOT EXISTS idx_technicien_sessions_token ON technicien_sessions(session_token);

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
COMMENT ON VIEW technicien_accounts_view IS 'Vue combinant les comptes techniciens avec les informations des employés';

-- Exemple d'insertion d'un compte technicien (remplacer les valeurs par les vraies données)
-- INSERT INTO technicien_accounts (technicien_id, username, password_hash) 
-- VALUES (1, 'technicien1', '$2a$10$example_hash_here');

-- Note: Le password_hash doit être généré avec bcrypt
-- Exemple en Node.js: const hash = await bcrypt.hash('motdepasse', 10);
