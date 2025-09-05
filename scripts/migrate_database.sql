-- Migration script to update existing database schema
-- This script adds the quantite field to materiel table and creates affectations_materiel table

-- Add quantite column to materiel table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'materiel' AND column_name = 'quantite') THEN
        ALTER TABLE materiel ADD COLUMN quantite INTEGER DEFAULT 1;
    END IF;
END $$;

-- Remove employe_responsable column if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'materiel' AND column_name = 'employe_responsable') THEN
        ALTER TABLE materiel DROP COLUMN employe_responsable;
    END IF;
END $$;

-- Create affectations_materiel table if it doesn't exist
CREATE TABLE IF NOT EXISTS affectations_materiel (
    id SERIAL PRIMARY KEY,
    materiel_id INTEGER REFERENCES materiel(id) NOT NULL,
    employe_id INTEGER REFERENCES employes(id) NOT NULL,
    quantite_assignee INTEGER NOT NULL DEFAULT 1,
    date_affectation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_retour TIMESTAMP,
    statut TEXT DEFAULT 'active', -- active, retourne, perdu
    commentaires TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for affectations_materiel if they don't exist
CREATE INDEX IF NOT EXISTS idx_affectations_materiel ON affectations_materiel(materiel_id);
CREATE INDEX IF NOT EXISTS idx_affectations_employe ON affectations_materiel(employe_id);
CREATE INDEX IF NOT EXISTS idx_affectations_statut ON affectations_materiel(statut);
CREATE INDEX IF NOT EXISTS idx_affectations_date ON affectations_materiel(date_affectation);

-- Create index for quantite on materiel if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_materiel_quantite ON materiel(quantite);

-- Drop old index on employe_responsable if it exists
DROP INDEX IF EXISTS idx_materiel_employe;

-- Update existing materiel records to have quantite = 1 if NULL
UPDATE materiel SET quantite = 1 WHERE quantite IS NULL;

-- Set default value for quantite column
ALTER TABLE materiel ALTER COLUMN quantite SET DEFAULT 1;

-- Add NOT NULL constraint to quantite column
ALTER TABLE materiel ALTER COLUMN quantite SET NOT NULL;

COMMIT;

