-- Script pour créer la table reclamation_photos avec stockage BYTEA
-- Cette table stockera les images directement dans PostgreSQL

CREATE TABLE IF NOT EXISTS reclamation_photos (
    id SERIAL PRIMARY KEY,
    reclamation_id INTEGER REFERENCES reclamations(id) ON DELETE CASCADE,
    photo_data BYTEA NOT NULL,
    photo_name TEXT NOT NULL,
    photo_type TEXT NOT NULL,
    photo_size INTEGER NOT NULL,
    uploaded_by INTEGER REFERENCES employes(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reclamation_photos_reclamation
        FOREIGN KEY(reclamation_id)
        REFERENCES reclamations(id)
        ON DELETE CASCADE
);

-- Créer un index sur reclamation_id pour des recherches rapides
CREATE INDEX IF NOT EXISTS idx_reclamation_photos_reclamation_id ON reclamation_photos(reclamation_id);

-- Créer un index sur uploaded_by pour les requêtes par utilisateur
CREATE INDEX IF NOT EXISTS idx_reclamation_photos_uploaded_by ON reclamation_photos(uploaded_by);

-- Créer un index sur uploaded_at pour les requêtes temporelles
CREATE INDEX IF NOT EXISTS idx_reclamation_photos_uploaded_at ON reclamation_photos(uploaded_at);










