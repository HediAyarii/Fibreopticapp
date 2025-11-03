-- Script pour mettre à jour la table reclamations avec les colonnes de résolution
-- Exécuter ce script dans votre base de données PostgreSQL

-- Ajouter les colonnes nécessaires pour la résolution des réclamations
ALTER TABLE reclamations 
ADD COLUMN IF NOT EXISTS date_resolution TIMESTAMP,
ADD COLUMN IF NOT EXISTS commentaire_resolution TEXT,
ADD COLUMN IF NOT EXISTS photos_justificatives JSONB,
ADD COLUMN IF NOT EXISTS resolved_by INTEGER REFERENCES employes(id);

-- Créer un index sur la colonne resolved_by pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_reclamations_resolved_by ON reclamations(resolved_by);

-- Créer un index sur la colonne statut pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_reclamations_statut ON reclamations(statut);

-- Mettre à jour les réclamations existantes si nécessaire
-- (Optionnel: définir un statut par défaut pour les réclamations sans statut)
UPDATE reclamations 
SET statut = 'en_attente' 
WHERE statut IS NULL OR statut = '';

-- Afficher un message de confirmation
SELECT 'Table reclamations mise à jour avec succès' as message;






















