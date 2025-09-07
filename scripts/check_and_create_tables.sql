-- Script pour vérifier et créer les tables nécessaires pour le matériel et les affectations

-- Vérifier si la table materiel existe et créer les colonnes manquantes
DO $$ 
BEGIN
    -- Ajouter la colonne quantite si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'materiel' AND column_name = 'quantite') THEN
        ALTER TABLE materiel ADD COLUMN quantite INTEGER DEFAULT 1;
        RAISE NOTICE 'Colonne quantite ajoutée à la table materiel';
    END IF;
    
    -- Ajouter la colonne prix_unitaire si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'materiel' AND column_name = 'prix_unitaire') THEN
        ALTER TABLE materiel ADD COLUMN prix_unitaire DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE 'Colonne prix_unitaire ajoutée à la table materiel';
    END IF;
    
    -- Ajouter la colonne type_materiel si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'materiel' AND column_name = 'type_materiel') THEN
        ALTER TABLE materiel ADD COLUMN type_materiel TEXT;
        RAISE NOTICE 'Colonne type_materiel ajoutée à la table materiel';
    END IF;
    
    -- Ajouter la colonne marque si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'materiel' AND column_name = 'marque') THEN
        ALTER TABLE materiel ADD COLUMN marque TEXT;
        RAISE NOTICE 'Colonne marque ajoutée à la table materiel';
    END IF;
    
    -- Ajouter la colonne modele si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'materiel' AND column_name = 'modele') THEN
        ALTER TABLE materiel ADD COLUMN modele TEXT;
        RAISE NOTICE 'Colonne modele ajoutée à la table materiel';
    END IF;
    
    -- Ajouter la colonne localisation si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'materiel' AND column_name = 'localisation') THEN
        ALTER TABLE materiel ADD COLUMN localisation TEXT;
        RAISE NOTICE 'Colonne localisation ajoutée à la table materiel';
    END IF;
    
    -- Ajouter la colonne statut si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'materiel' AND column_name = 'statut') THEN
        ALTER TABLE materiel ADD COLUMN statut TEXT DEFAULT 'disponible';
        RAISE NOTICE 'Colonne statut ajoutée à la table materiel';
    END IF;
    
    -- Ajouter les colonnes de dates si elles n'existent pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'materiel' AND column_name = 'created_at') THEN
        ALTER TABLE materiel ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Colonne created_at ajoutée à la table materiel';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'materiel' AND column_name = 'updated_at') THEN
        ALTER TABLE materiel ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Colonne updated_at ajoutée à la table materiel';
    END IF;
END $$;

-- Créer la table affectations_materiel si elle n'existe pas
CREATE TABLE IF NOT EXISTS affectations_materiel (
    id SERIAL PRIMARY KEY,
    materiel_id INTEGER REFERENCES materiel(id) ON DELETE CASCADE,
    employe_id INTEGER REFERENCES employes(id) ON DELETE CASCADE,
    quantite_assignee INTEGER NOT NULL DEFAULT 1,
    date_affectation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_retour TIMESTAMP,
    statut TEXT DEFAULT 'active',
    commentaires TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Créer les index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_affectations_materiel_id ON affectations_materiel(materiel_id);
CREATE INDEX IF NOT EXISTS idx_affectations_employe_id ON affectations_materiel(employe_id);
CREATE INDEX IF NOT EXISTS idx_affectations_statut ON affectations_materiel(statut);
CREATE INDEX IF NOT EXISTS idx_affectations_date ON affectations_materiel(date_affectation);
CREATE INDEX IF NOT EXISTS idx_materiel_quantite ON materiel(quantite);
CREATE INDEX IF NOT EXISTS idx_materiel_statut ON materiel(statut);

-- Afficher les tables créées
SELECT 'Tables créées avec succès' as message;
