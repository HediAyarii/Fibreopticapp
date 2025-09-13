-- Migration pour ajouter les champs du bordereau de prix à la table frais_ert
ALTER TABLE frais_ert 
ADD COLUMN IF NOT EXISTS article_code TEXT,
ADD COLUMN IF NOT EXISTS quantite INTEGER DEFAULT 1;

-- Mettre à jour les données existantes si nécessaire
UPDATE frais_ert 
SET article_code = 'AUTRE', quantite = 1 
WHERE article_code IS NULL;

-- Ajouter un index sur le nouveau champ
CREATE INDEX IF NOT EXISTS idx_frais_ert_article_code ON frais_ert(article_code);
