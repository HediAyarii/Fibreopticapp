-- Script pour créer la table des photos justificatives des réclamations
-- Exécuter ce script dans votre base de données PostgreSQL

-- Créer la table pour stocker les photos justificatives
CREATE TABLE IF NOT EXISTS reclamation_photos (
    id SERIAL PRIMARY KEY,
    reclamation_id INTEGER REFERENCES reclamations(id) ON DELETE CASCADE,
    photo_path TEXT NOT NULL,
    photo_name TEXT,
    uploaded_by INTEGER REFERENCES employes(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_size INTEGER,
    mime_type TEXT
);

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_reclamation_photos_reclamation_id ON reclamation_photos(reclamation_id);

-- Ajouter les colonnes manquantes à la table reclamations si elles n'existent pas
ALTER TABLE reclamations 
ADD COLUMN IF NOT EXISTS date_resolution TIMESTAMP,
ADD COLUMN IF NOT EXISTS commentaire_resolution TEXT,
ADD COLUMN IF NOT EXISTS resolved_by INTEGER REFERENCES employes(id);

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_reclamations_resolved_by ON reclamations(resolved_by);
CREATE INDEX IF NOT EXISTS idx_reclamations_statut ON reclamations(statut);
CREATE INDEX IF NOT EXISTS idx_reclamations_date_resolution ON reclamations(date_resolution);



















