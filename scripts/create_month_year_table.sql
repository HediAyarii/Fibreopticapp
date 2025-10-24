-- Table pour stocker les mois et années disponibles
CREATE TABLE IF NOT EXISTS mois_annee (
    id SERIAL PRIMARY KEY,
    mois INTEGER NOT NULL,
    annee INTEGER NOT NULL,
    nom_mois TEXT NOT NULL,
    nom_annee TEXT NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    statut TEXT DEFAULT 'actif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_mois_annee_mois ON mois_annee(mois);
CREATE INDEX IF NOT EXISTS idx_mois_annee_annee ON mois_annee(annee);
CREATE INDEX IF NOT EXISTS idx_mois_annee_statut ON mois_annee(statut);

-- Insérer 36 mois (3 ans) à partir du mois actuel
DO $$
DECLARE
    current_date DATE := CURRENT_DATE;
    start_month INTEGER;
    start_year INTEGER;
    i INTEGER;
    target_month INTEGER;
    target_year INTEGER;
    month_names TEXT[] := ARRAY['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                               'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
BEGIN
    -- Nettoyer les données existantes
    DELETE FROM mois_annee;
    
    -- Commencer à partir du mois actuel
    start_month := EXTRACT(MONTH FROM current_date);
    start_year := EXTRACT(YEAR FROM current_date);
    
    -- Créer 36 mois (3 ans)
    FOR i IN 0..35 LOOP
        target_month := start_month + i;
        target_year := start_year;
        
        -- Gérer le passage d'année
        WHILE target_month > 12 LOOP
            target_month := target_month - 12;
            target_year := target_year + 1;
        END LOOP;
        
        -- Insérer le mois/année
        INSERT INTO mois_annee (mois, annee, nom_mois, nom_annee, date_debut, date_fin)
        VALUES (
            target_month,
            target_year,
            month_names[target_month],
            target_year::TEXT,
            DATE(target_year || '-' || LPAD(target_month::TEXT, 2, '0') || '-01'),
            (DATE(target_year || '-' || LPAD(target_month::TEXT, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day')::DATE
        );
    END LOOP;
    
    RAISE NOTICE '36 mois/années créés avec succès';
END $$;

-- Commentaires sur la table
COMMENT ON TABLE mois_annee IS 'Table des mois et années disponibles pour les charges fixes';
COMMENT ON COLUMN mois_annee.mois IS 'Numéro du mois (1-12)';
COMMENT ON COLUMN mois_annee.annee IS 'Année (ex: 2025)';
COMMENT ON COLUMN mois_annee.nom_mois IS 'Nom du mois en français';
COMMENT ON COLUMN mois_annee.nom_annee IS 'Nom de l''année en texte';
COMMENT ON COLUMN mois_annee.date_debut IS 'Premier jour du mois';
COMMENT ON COLUMN mois_annee.date_fin IS 'Dernier jour du mois';
