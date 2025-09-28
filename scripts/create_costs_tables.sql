-- Script de création des tables pour le module de calcul des coûts
-- Créé le: 2025-01-15

-- Table des coûts fixes (récurrents chaque mois)
CREATE TABLE IF NOT EXISTS fixed_costs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des coûts variables (spécifiques à un mois)
CREATE TABLE IF NOT EXISTS variable_costs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, month, year)
);

-- Table des coûts mensuels calculés (pour l'historique)
CREATE TABLE IF NOT EXISTS monthly_costs (
    id SERIAL PRIMARY KEY,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    total_fixed_costs DECIMAL(10,2) DEFAULT 0,
    total_variable_costs DECIMAL(10,2) DEFAULT 0,
    total_costs DECIMAL(10,2) DEFAULT 0,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(month, year)
);

-- Table des catégories de coûts
CREATE TABLE IF NOT EXISTS cost_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertion des catégories par défaut
INSERT INTO cost_categories (name, description, color) VALUES
('Personnel', 'Salaires et charges sociales', '#EF4444'),
('Loyer', 'Loyers et charges locatives', '#F59E0B'),
('Équipement', 'Achat et maintenance d\'équipements', '#10B981'),
('Transport', 'Carburant et frais de transport', '#3B82F6'),
('Communication', 'Téléphone, internet, abonnements', '#8B5CF6'),
('Formation', 'Formations et certifications', '#EC4899'),
('Assurance', 'Assurances diverses', '#6B7280'),
('Autres', 'Autres dépenses', '#9CA3AF')
ON CONFLICT (name) DO NOTHING;

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_fixed_costs_active ON fixed_costs(is_active);
CREATE INDEX IF NOT EXISTS idx_variable_costs_month_year ON variable_costs(month, year);
CREATE INDEX IF NOT EXISTS idx_monthly_costs_month_year ON monthly_costs(month, year);

-- Fonction pour calculer automatiquement les coûts mensuels
CREATE OR REPLACE FUNCTION calculate_monthly_costs(target_month INTEGER, target_year INTEGER)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    fixed_total DECIMAL(10,2) := 0;
    variable_total DECIMAL(10,2) := 0;
    total_costs DECIMAL(10,2) := 0;
BEGIN
    -- Calculer le total des coûts fixes actifs
    SELECT COALESCE(SUM(amount), 0) INTO fixed_total
    FROM fixed_costs 
    WHERE is_active = true;
    
    -- Calculer le total des coûts variables pour le mois/année
    SELECT COALESCE(SUM(amount), 0) INTO variable_total
    FROM variable_costs 
    WHERE month = target_month AND year = target_year;
    
    -- Calculer le total
    total_costs := fixed_total + variable_total;
    
    -- Insérer ou mettre à jour le calcul mensuel
    INSERT INTO monthly_costs (month, year, total_fixed_costs, total_variable_costs, total_costs)
    VALUES (target_month, target_year, fixed_total, variable_total, total_costs)
    ON CONFLICT (month, year) 
    DO UPDATE SET 
        total_fixed_costs = EXCLUDED.total_fixed_costs,
        total_variable_costs = EXCLUDED.total_variable_costs,
        total_costs = EXCLUDED.total_costs,
        calculated_at = CURRENT_TIMESTAMP;
    
    RETURN total_costs;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement les coûts mensuels
CREATE OR REPLACE FUNCTION trigger_update_monthly_costs()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculer pour tous les mois de l'année courante
    PERFORM calculate_monthly_costs(EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour les coûts fixes
CREATE TRIGGER update_monthly_costs_fixed
    AFTER INSERT OR UPDATE OR DELETE ON fixed_costs
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_update_monthly_costs();

-- Triggers pour les coûts variables
CREATE TRIGGER update_monthly_costs_variable
    AFTER INSERT OR UPDATE OR DELETE ON variable_costs
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_update_monthly_costs();

-- Vue pour faciliter les requêtes de coûts
CREATE OR REPLACE VIEW costs_summary AS
SELECT 
    mc.month,
    mc.year,
    mc.total_fixed_costs,
    mc.total_variable_costs,
    mc.total_costs,
    mc.calculated_at,
    -- Détail des coûts fixes
    (SELECT json_agg(
        json_build_object(
            'id', fc.id,
            'name', fc.name,
            'amount', fc.amount,
            'category', fc.category
        )
    ) FROM fixed_costs fc WHERE fc.is_active = true) as fixed_costs_detail,
    -- Détail des coûts variables
    (SELECT json_agg(
        json_build_object(
            'id', vc.id,
            'name', vc.name,
            'amount', vc.amount,
            'category', vc.category
        )
    ) FROM variable_costs vc WHERE vc.month = mc.month AND vc.year = mc.year) as variable_costs_detail
FROM monthly_costs mc
ORDER BY mc.year DESC, mc.month DESC;

COMMENT ON TABLE fixed_costs IS 'Coûts fixes récurrents chaque mois';
COMMENT ON TABLE variable_costs IS 'Coûts variables spécifiques à un mois';
COMMENT ON TABLE monthly_costs IS 'Calculs mensuels des coûts totaux';
COMMENT ON TABLE cost_categories IS 'Catégories de coûts pour l\'organisation';
