-- Table pour tracer toutes les actions des utilisateurs
CREATE TABLE IF NOT EXISTS historiques (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  user_name VARCHAR(255),
  action VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
  table_name VARCHAR(100) NOT NULL, -- Nom de la table affectée
  record_id INTEGER, -- ID de l'enregistrement affecté
  section VARCHAR(100), -- Section de l'application (Interventions, Employés, Pénalités, etc.)
  description TEXT, -- Description détaillée de l'action
  old_values JSONB, -- Anciennes valeurs (pour UPDATE et DELETE)
  new_values JSONB, -- Nouvelles valeurs (pour CREATE et UPDATE)
  ip_address VARCHAR(45), -- Adresse IP de l'utilisateur
  user_agent TEXT, -- Navigateur/Agent utilisateur
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances des recherches
CREATE INDEX IF NOT EXISTS idx_historiques_user_id ON historiques(user_id);
CREATE INDEX IF NOT EXISTS idx_historiques_action ON historiques(action);
CREATE INDEX IF NOT EXISTS idx_historiques_table_name ON historiques(table_name);
CREATE INDEX IF NOT EXISTS idx_historiques_created_at ON historiques(created_at);
CREATE INDEX IF NOT EXISTS idx_historiques_section ON historiques(section);

-- Commentaires pour documentation
COMMENT ON TABLE historiques IS 'Table de traçabilité des actions utilisateurs dans l''application';
COMMENT ON COLUMN historiques.action IS 'Type d''action: CREATE, UPDATE, DELETE';
COMMENT ON COLUMN historiques.table_name IS 'Nom de la table de la base de données affectée';
COMMENT ON COLUMN historiques.section IS 'Section de l''application: Interventions, Employés, Pénalités, Réclamations, etc.';
COMMENT ON COLUMN historiques.old_values IS 'Valeurs avant modification (JSON)';
COMMENT ON COLUMN historiques.new_values IS 'Valeurs après modification (JSON)';
