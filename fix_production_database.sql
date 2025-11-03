-- Script pour corriger la base de données de production
-- Ajouter les colonnes manquantes pour le système de charges amélioré

-- 1. Ajouter la colonne frequency à fixed_costs
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'fixed_costs' 
        AND column_name = 'frequency'
    ) THEN
        ALTER TABLE fixed_costs ADD COLUMN frequency CHARACTER VARYING(20) DEFAULT 'monthly';
        RAISE NOTICE 'Colonne frequency ajoutée à la table fixed_costs';
    ELSE
        RAISE NOTICE 'Colonne frequency existe déjà dans la table fixed_costs';
    END IF;
END $$;

-- 2. Ajouter la colonne attribution à frais_entreprise
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'frais_entreprise' 
        AND column_name = 'attribution'
    ) THEN
        ALTER TABLE frais_entreprise ADD COLUMN attribution VARCHAR(20) DEFAULT 'LES_DEUX' CHECK (attribution IN ('AXECOM', 'ERT', 'LES_DEUX'));
        RAISE NOTICE 'Colonne attribution ajoutée à la table frais_entreprise';
    ELSE
        RAISE NOTICE 'Colonne attribution existe déjà dans la table frais_entreprise';
    END IF;
END $$;

-- 2b. Ajouter des colonnes à frais_axecom si la table existe
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'frais_axecom') THEN
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'frais_axecom' 
            AND column_name = 'montant_ttc'
        ) THEN
            ALTER TABLE frais_axecom ADD COLUMN montant_ttc DECIMAL(10,2);
            ALTER TABLE frais_axecom ADD COLUMN montant_ht DECIMAL(10,2);
            ALTER TABLE frais_axecom ADD COLUMN tva DECIMAL(10,2);
            ALTER TABLE frais_axecom ADD COLUMN date_facture DATE;
            ALTER TABLE frais_axecom ADD COLUMN type_frais VARCHAR(50);
            RAISE NOTICE 'Colonnes ajoutées à la table frais_axecom';
        ELSE
            RAISE NOTICE 'Colonnes existent déjà dans la table frais_axecom';
        END IF;
    ELSE
        RAISE NOTICE 'Table frais_axecom n''existe pas encore, ignorée';
    END IF;
END $$;

-- 2c. Ajouter des colonnes à frais_ert si la table existe
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'frais_ert') THEN
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'frais_ert' 
            AND column_name = 'montant_ttc'
        ) THEN
            ALTER TABLE frais_ert ADD COLUMN montant_ttc DECIMAL(10,2);
            ALTER TABLE frais_ert ADD COLUMN montant_ht DECIMAL(10,2);
            ALTER TABLE frais_ert ADD COLUMN tva DECIMAL(10,2);
            ALTER TABLE frais_ert ADD COLUMN date_facture DATE;
            ALTER TABLE frais_ert ADD COLUMN type_frais VARCHAR(50);
            RAISE NOTICE 'Colonnes ajoutées à la table frais_ert';
        ELSE
            RAISE NOTICE 'Colonnes existent déjà dans la table frais_ert';
        END IF;
    ELSE
        RAISE NOTICE 'Table frais_ert n''existe pas encore, ignorée';
    END IF;
END $$;

-- 3. Ajouter la colonne attribution à fixed_costs
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'fixed_costs' 
        AND column_name = 'attribution'
    ) THEN
        ALTER TABLE fixed_costs ADD COLUMN attribution VARCHAR(20) DEFAULT 'LES_DEUX' CHECK (attribution IN ('AXECOM', 'ERT', 'LES_DEUX'));
        RAISE NOTICE 'Colonne attribution ajoutée à la table fixed_costs';
    ELSE
        RAISE NOTICE 'Colonne attribution existe déjà dans la table fixed_costs';
    END IF;
END $$;

-- 4. Mettre à jour les enregistrements existants
UPDATE fixed_costs SET frequency = 'monthly' WHERE frequency IS NULL;
UPDATE fixed_costs SET attribution = 'LES_DEUX' WHERE attribution IS NULL;
UPDATE frais_entreprise SET attribution = 'LES_DEUX' WHERE attribution IS NULL;

-- 5. Ajouter les index manquants
CREATE INDEX IF NOT EXISTS idx_fixed_costs_active ON fixed_costs (is_active);
CREATE INDEX IF NOT EXISTS idx_fixed_costs_attribution ON fixed_costs (attribution);
CREATE INDEX IF NOT EXISTS idx_frais_entreprise_attribution ON frais_entreprise (attribution);

-- 5. Vérifier la structure des tables
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'fixed_costs' 
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'frais_entreprise' 
ORDER BY ordinal_position;

-- 6. Afficher quelques exemples de données
SELECT id, name, amount, is_active, frequency, created_at 
FROM fixed_costs 
LIMIT 5;

SELECT id, fournisseur, type_frais, montant_ttc, attribution, date_facture
FROM frais_entreprise 
ORDER BY created_at DESC 
LIMIT 5;
