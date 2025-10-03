-- Script to add type_affectation column to affectations_materiel table
-- This script adds the type_affectation column to distinguish between permanent, temporary, and consumable assignments

-- Add type_affectation column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'affectations_materiel' 
        AND column_name = 'type_affectation'
    ) THEN
        ALTER TABLE affectations_materiel ADD COLUMN type_affectation TEXT DEFAULT 'permanent';
        RAISE NOTICE 'Column type_affectation added to affectations_materiel table';
    ELSE
        RAISE NOTICE 'Column type_affectation already exists in affectations_materiel table';
    END IF;
END $$;
