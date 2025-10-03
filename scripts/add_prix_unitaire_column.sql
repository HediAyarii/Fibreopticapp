-- Script to add prix_unitaire column to materiel table
-- This script adds the missing prix_unitaire column to the existing materiel table

-- Add prix_unitaire column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'materiel' 
        AND column_name = 'prix_unitaire'
    ) THEN
        ALTER TABLE materiel ADD COLUMN prix_unitaire DECIMAL(10,2);
        RAISE NOTICE 'Column prix_unitaire added to materiel table';
    ELSE
        RAISE NOTICE 'Column prix_unitaire already exists in materiel table';
    END IF;
END $$;
