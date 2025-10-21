-- Script pour créer la table users avec système de permissions granulaires
-- Ce script remplace l'ancien système de rôles rigides par un système flexible

-- Table des utilisateurs avec permissions personnalisées
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
    permissions JSONB DEFAULT '{"sections": []}'::jsonb,
    employee_id INTEGER REFERENCES employes(id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    login_attempts INTEGER DEFAULT 0,
    is_locked BOOLEAN DEFAULT false
);

-- Table des sessions utilisateurs
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);

-- Vue pour faciliter les requêtes sur les utilisateurs avec leurs permissions
CREATE OR REPLACE VIEW users_with_permissions AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.role,
    u.permissions,
    u.employee_id,
    u.created_by,
    u.created_at,
    u.updated_at,
    u.is_active,
    u.last_login,
    u.login_attempts,
    u.is_locked,
    e.nom as employee_nom,
    e.prenom as employee_prenom,
    e.matricule as employee_matricule,
    creator.username as created_by_username
FROM users u
LEFT JOIN employes e ON u.employee_id = e.id
LEFT JOIN users creator ON u.created_by = creator.id;

-- Fonction pour vérifier les permissions d'un utilisateur
CREATE OR REPLACE FUNCTION check_user_permission(
    p_user_id INTEGER,
    p_section VARCHAR(50)
) RETURNS BOOLEAN AS $$
DECLARE
    user_role VARCHAR(20);
    user_permissions JSONB;
BEGIN
    -- Récupérer le rôle et les permissions de l'utilisateur
    SELECT role, permissions INTO user_role, user_permissions
    FROM users 
    WHERE id = p_user_id AND is_active = true;
    
    -- Si l'utilisateur n'existe pas ou n'est pas actif
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Les admins ont accès à tout
    IF user_role = 'admin' THEN
        RETURN true;
    END IF;
    
    -- Pour les employés, vérifier les permissions spécifiques
    IF user_role = 'employee' THEN
        RETURN (user_permissions->'sections') ? p_section;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir toutes les sections disponibles
CREATE OR REPLACE FUNCTION get_available_sections() 
RETURNS TABLE(section_key VARCHAR(50), section_name VARCHAR(100)) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'dashboard'::VARCHAR(50) as section_key,
        'Tableau de Bord'::VARCHAR(100) as section_name
    UNION ALL
    SELECT 'employees'::VARCHAR(50), 'Employés'::VARCHAR(100)
    UNION ALL
    SELECT 'interventions'::VARCHAR(50), 'Interventions'::VARCHAR(100)
    UNION ALL
    SELECT 'materials'::VARCHAR(50), 'Matériel'::VARCHAR(100)
    UNION ALL
    SELECT 'fuel'::VARCHAR(50), 'Carburant'::VARCHAR(100)
    UNION ALL
    SELECT 'fuel-consumption'::VARCHAR(50), 'Consommation Carburant'::VARCHAR(100)
    UNION ALL
    SELECT 'penalties'::VARCHAR(50), 'Pénalités'::VARCHAR(100)
    UNION ALL
    SELECT 'statistics'::VARCHAR(50), 'Statistiques'::VARCHAR(100)
    UNION ALL
    SELECT 'costs'::VARCHAR(50), 'Charges'::VARCHAR(100)
    UNION ALL
    SELECT 'cout-par-salaire'::VARCHAR(50), 'Charges par Salarié'::VARCHAR(100)
    UNION ALL
    SELECT 'claims'::VARCHAR(50), 'Réclamations'::VARCHAR(100)
    UNION ALL
    SELECT 'documents'::VARCHAR(50), 'Documents'::VARCHAR(100)
    UNION ALL
    SELECT 'recap-calcul'::VARCHAR(50), 'Récap Calcul'::VARCHAR(100)
    UNION ALL
    SELECT 'tarifs'::VARCHAR(50), 'Tarifs'::VARCHAR(100)
    UNION ALL
    SELECT 'recette-generer'::VARCHAR(50), 'BENEFICE BRUTE'::VARCHAR(100)
    UNION ALL
    SELECT 'technicien-accounts'::VARCHAR(50), 'Comptes Techniciens'::VARCHAR(100)
    UNION ALL
    SELECT 'compte-admin'::VARCHAR(50), 'Compte Admin'::VARCHAR(100);
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur les tables
COMMENT ON TABLE users IS 'Table des utilisateurs avec permissions granulaires';
COMMENT ON TABLE user_sessions IS 'Sessions des utilisateurs pour la gestion des connexions';
COMMENT ON FUNCTION check_user_permission IS 'Vérifie si un utilisateur a accès à une section spécifique';
COMMENT ON FUNCTION get_available_sections IS 'Retourne toutes les sections disponibles pour les permissions';

-- Insérer un utilisateur admin par défaut (mot de passe: admin123)
INSERT INTO users (username, email, password_hash, role, permissions, is_active)
VALUES (
    'admin',
    'admin@fibertech.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
    'admin',
    '{"sections": ["dashboard", "employees", "interventions", "materials", "fuel", "fuel-consumption", "penalties", "statistics", "costs", "cout-par-salaire", "claims", "documents", "recap-calcul", "tarifs", "recette-generer", "technicien-accounts", "compte-admin"]}'::jsonb,
    true
) ON CONFLICT (username) DO NOTHING;
