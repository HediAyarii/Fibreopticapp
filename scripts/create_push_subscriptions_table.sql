-- Table pour stocker les souscriptions push
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, endpoint)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_employee_id ON push_subscriptions(employee_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- Commentaires
COMMENT ON TABLE push_subscriptions IS 'Souscriptions push pour les notifications';
COMMENT ON COLUMN push_subscriptions.employee_id IS 'ID de l\'employé';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'URL du service push';
COMMENT ON COLUMN push_subscriptions.p256dh_key IS 'Clé publique P256DH';
COMMENT ON COLUMN push_subscriptions.auth_key IS 'Clé d\'authentification';
