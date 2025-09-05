-- Migration script to add prix_unitaire field to materiel table
-- This script adds the prix_unitaire field for calculating total material value

-- Add prix_unitaire column to materiel table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'materiel' AND column_name = 'prix_unitaire') THEN
        ALTER TABLE materiel ADD COLUMN prix_unitaire DECIMAL(10,2) DEFAULT 0.00;
    END IF;
END $$;

-- Update existing materiel records to have prix_unitaire = 0 if NULL
UPDATE materiel SET prix_unitaire = 0.00 WHERE prix_unitaire IS NULL;

-- Set default value for prix_unitaire column
ALTER TABLE materiel ALTER COLUMN prix_unitaire SET DEFAULT 0.00;

-- Add NOT NULL constraint to prix_unitaire column
ALTER TABLE materiel ALTER COLUMN prix_unitaire SET NOT NULL;

COMMIT;
