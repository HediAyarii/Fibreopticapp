-- Script d'initialisation de la base de données pour Docker
-- Ce script sera exécuté automatiquement lors du premier démarrage du conteneur PostgreSQL

-- Créer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Créer la table users si elle n'existe pas
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id INTEGER DEFAULT 2, -- 2 = employee par défaut
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Créer la table roles si elle n'existe pas
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{"sections": []}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insérer les rôles par défaut
INSERT INTO roles (id, name, description, permissions) VALUES
(1, 'admin', 'Administrateur avec accès total', '{"sections": ["dashboard", "employees", "interventions", "materials", "fuel", "fuel-consumption", "penalties", "statistics", "costs", "cout-par-salaire", "claims", "documents", "recap-calcul", "tarifs", "recette-generer", "technicien-accounts", "compte-admin"]}'::jsonb),
(2, 'employee', 'Employé avec permissions limitées', '{"sections": []}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Créer la table user_sessions si elle n'existe pas
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);

-- Créer un utilisateur admin par défaut
INSERT INTO users (username, email, password_hash, role_id, first_name, last_name, is_active) VALUES
('admin', 'admin@fibertech.com', '$2b$10$yjhqFtbmbWr1aHGNVb.1reKzahD5cWQSdzx2tZmh.2MQdsdeg71Gu', 1, 'Admin', 'System', true)
ON CONFLICT (email) DO NOTHING;

-- Créer les fonctions nécessaires
CREATE OR REPLACE FUNCTION check_user_permission(
  p_user_id INTEGER,
  p_section VARCHAR(50)
) RETURNS BOOLEAN AS $$
DECLARE
  user_role VARCHAR(20);
  user_permissions JSONB;
BEGIN
  SELECT r.name, r.permissions INTO user_role, user_permissions
  FROM users u
  LEFT JOIN roles r ON u.role_id = r.id
  WHERE u.id = p_user_id AND u.is_active = true;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  IF user_role = 'admin' THEN
    RETURN true;
  END IF;
  
  IF user_role = 'employee' THEN
    RETURN (user_permissions->'sections') ? p_section;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_available_sections() 
RETURNS TABLE(section_key VARCHAR(50), section_name VARCHAR(100)) AS $$
BEGIN
  RETURN QUERY
  SELECT 'dashboard'::VARCHAR(50) as section_key, 'Tableau de Bord'::VARCHAR(100) as section_name
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
  SELECT 'vehicules'::VARCHAR(50), 'Véhicules'::VARCHAR(100)
  UNION ALL
  SELECT 'reclamations-techniques'::VARCHAR(50), 'Réclamations Techniques'::VARCHAR(100)
  UNION ALL
  SELECT 'compte-admin'::VARCHAR(50), 'Compte Admin'::VARCHAR(100);
END;
$$ LANGUAGE plpgsql;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Base de données FinalFibre initialisée avec succès!';
  RAISE NOTICE 'Utilisateur admin par défaut: admin@fibertech.com / admin123';
END $$;
