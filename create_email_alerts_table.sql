-- Table pour logger les emails d'alertes envoyés
-- Exécuter ce script pour créer la table

CREATE TABLE IF NOT EXISTS email_alerts_log (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL,
    recipients TEXT NOT NULL,
    subject VARCHAR(255),
    vehicules_count INTEGER DEFAULT 0,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour rechercher rapidement par date et type
CREATE INDEX IF NOT EXISTS idx_email_alerts_log_date ON email_alerts_log (DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_email_alerts_log_type ON email_alerts_log (alert_type);

-- Commentaire
COMMENT ON TABLE email_alerts_log IS 'Journal des emails d''alertes envoyés (véhicules, etc.)';
