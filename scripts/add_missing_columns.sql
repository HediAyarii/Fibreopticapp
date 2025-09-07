-- Script pour ajouter les colonnes manquantes aux tables existantes
-- Ce script ajoute les colonnes manquantes qui causent des erreurs dans les APIs

-- 1. Ajouter la colonne date_fin à carburant_assignations
ALTER TABLE carburant_assignations 
ADD COLUMN IF NOT EXISTS date_fin TIMESTAMP;

-- 2. Ajouter la colonne prix_unitaire à materiel
ALTER TABLE materiel 
ADD COLUMN IF NOT EXISTS prix_unitaire DECIMAL(10,2) DEFAULT 0.00;

-- 3. Mettre à jour les assignations existantes pour avoir une date_fin NULL par défaut
UPDATE carburant_assignations 
SET date_fin = NULL 
WHERE date_fin IS NULL;

-- Afficher les informations de mise à jour
SELECT 'Colonnes ajoutées avec succès:' as message;
SELECT 'carburant_assignations.date_fin' as colonne_ajoutee
UNION ALL
SELECT 'materiel.prix_unitaire' as colonne_ajoutee;

-- Vérifier la structure des tables
SELECT 'Structure de carburant_assignations:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'carburant_assignations' 
ORDER BY ordinal_position;

SELECT 'Structure de materiel:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'materiel' 
ORDER BY ordinal_position;
