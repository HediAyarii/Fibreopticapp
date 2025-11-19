-- ============================================================================
-- AJOUT DE LA GESTION DES DÉPÔTS POUR LE MATÉRIEL
-- ============================================================================
-- Ce script ajoute :
-- 1. Colonne 'depot' à la table materiel (AXECOM ou ERT)
-- 2. Table historique_transferts_materiel pour tracer les transferts
-- 3. Index pour optimiser les recherches par dépôt
-- ============================================================================

-- 1. Ajouter la colonne depot à la table materiel
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'materiel' 
        AND column_name = 'depot'
    ) THEN
        ALTER TABLE materiel 
        ADD COLUMN depot VARCHAR(20) DEFAULT 'AXECOM' 
        CHECK (depot IN ('AXECOM', 'ERT'));
        
        RAISE NOTICE 'Colonne depot ajoutée à la table materiel';
    ELSE
        RAISE NOTICE 'Colonne depot existe déjà dans la table materiel';
    END IF;
END $$;

-- 2. Créer un index sur la colonne depot pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_materiel_depot ON materiel(depot);
RAISE NOTICE 'Index idx_materiel_depot créé';

-- 3. Créer la table historique_transferts_materiel
CREATE TABLE IF NOT EXISTS historique_transferts_materiel (
    id SERIAL PRIMARY KEY,
    materiel_id INTEGER NOT NULL REFERENCES materiel(id) ON DELETE CASCADE,
    depot_origine VARCHAR(20) NOT NULL CHECK (depot_origine IN ('AXECOM', 'ERT')),
    depot_destination VARCHAR(20) NOT NULL CHECK (depot_destination IN ('AXECOM', 'ERT')),
    quantite_transferee INTEGER DEFAULT 1,
    date_transfert TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    motif TEXT,
    utilisateur_id INTEGER REFERENCES employes(id),
    utilisateur_nom VARCHAR(200),
    commentaires TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3.1 Ajouter la colonne quantite_transferee si la table existe déjà
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'historique_transferts_materiel' 
        AND column_name = 'quantite_transferee'
    ) THEN
        ALTER TABLE historique_transferts_materiel 
        ADD COLUMN quantite_transferee INTEGER DEFAULT 1;
        
        RAISE NOTICE 'Colonne quantite_transferee ajoutée à la table historique_transferts_materiel';
    ELSE
        RAISE NOTICE 'Colonne quantite_transferee existe déjà dans la table historique_transferts_materiel';
    END IF;
END $$;

-- 4. Créer les index pour la table historique_transferts_materiel
CREATE INDEX IF NOT EXISTS idx_transferts_materiel_id ON historique_transferts_materiel(materiel_id);
CREATE INDEX IF NOT EXISTS idx_transferts_date ON historique_transferts_materiel(date_transfert);
CREATE INDEX IF NOT EXISTS idx_transferts_depot_origine ON historique_transferts_materiel(depot_origine);
CREATE INDEX IF NOT EXISTS idx_transferts_depot_destination ON historique_transferts_materiel(depot_destination);

-- 5. Ajouter un commentaire à la table
COMMENT ON TABLE historique_transferts_materiel IS 'Historique des transferts de matériel entre dépôts AXECOM et ERT';
COMMENT ON COLUMN materiel.depot IS 'Dépôt de stockage du matériel : AXECOM ou ERT';

-- 6. Afficher un résumé
DO $$ 
DECLARE
    count_materiel INTEGER;
    count_axecom INTEGER;
    count_ert INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_materiel FROM materiel;
    SELECT COUNT(*) INTO count_axecom FROM materiel WHERE depot = 'AXECOM';
    SELECT COUNT(*) INTO count_ert FROM materiel WHERE depot = 'ERT';
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'RÉSUMÉ DE LA MIGRATION';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total matériel : %', count_materiel;
    RAISE NOTICE 'Matériel AXECOM : %', count_axecom;
    RAISE NOTICE 'Matériel ERT : %', count_ert;
    RAISE NOTICE '========================================';
END $$;

COMMIT;
