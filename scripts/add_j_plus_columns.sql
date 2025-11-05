-- Ajouter les colonnes j_plus_1 et j_plus_n à la table penalites
ALTER TABLE penalites 
ADD COLUMN IF NOT EXISTS j_plus_1 BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS j_plus_n BOOLEAN DEFAULT FALSE;

-- Créer un index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_penalites_j_plus ON penalites(j_plus_1, j_plus_n);

-- Afficher les colonnes de la table pour vérification
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'penalites' 
ORDER BY ordinal_position;
