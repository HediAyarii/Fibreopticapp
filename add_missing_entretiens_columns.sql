-- Ajouter les colonnes manquantes à la table entretiens_vehicules
-- pour la rendre identique à la structure VPS

-- Vérifier et ajouter les colonnes si elles n'existent pas déjà
DO $$ 
BEGIN
    -- Ajouter cout_entretien si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='entretiens_vehicules' AND column_name='cout_entretien') THEN
        ALTER TABLE entretiens_vehicules ADD COLUMN cout_entretien NUMERIC(10,2);
        RAISE NOTICE 'Colonne cout_entretien ajoutée';
    END IF;

    -- Ajouter garage si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='entretiens_vehicules' AND column_name='garage') THEN
        ALTER TABLE entretiens_vehicules ADD COLUMN garage VARCHAR(200);
        RAISE NOTICE 'Colonne garage ajoutée';
    END IF;

    -- Ajouter facture_numero si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='entretiens_vehicules' AND column_name='facture_numero') THEN
        ALTER TABLE entretiens_vehicules ADD COLUMN facture_numero VARCHAR(100);
        RAISE NOTICE 'Colonne facture_numero ajoutée';
    END IF;

    -- Ajouter prochain_entretien_km si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='entretiens_vehicules' AND column_name='prochain_entretien_km') THEN
        ALTER TABLE entretiens_vehicules ADD COLUMN prochain_entretien_km INTEGER;
        RAISE NOTICE 'Colonne prochain_entretien_km ajoutée';
    END IF;

    -- Ajouter prochain_entretien_date si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='entretiens_vehicules' AND column_name='prochain_entretien_date') THEN
        ALTER TABLE entretiens_vehicules ADD COLUMN prochain_entretien_date DATE;
        RAISE NOTICE 'Colonne prochain_entretien_date ajoutée';
    END IF;

    -- Ajouter categorie_entretien si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='entretiens_vehicules' AND column_name='categorie_entretien') THEN
        ALTER TABLE entretiens_vehicules ADD COLUMN categorie_entretien VARCHAR(100);
        RAISE NOTICE 'Colonne categorie_entretien ajoutée';
    END IF;

    -- Ajouter kilometrage_entretien si elle n'existe pas (renommer de kilometrage)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='entretiens_vehicules' AND column_name='kilometrage_entretien') THEN
        -- Si la colonne kilometrage existe, la renommer
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='entretiens_vehicules' AND column_name='kilometrage') THEN
            ALTER TABLE entretiens_vehicules RENAME COLUMN kilometrage TO kilometrage_entretien;
            RAISE NOTICE 'Colonne kilometrage renommée en kilometrage_entretien';
        ELSE
            ALTER TABLE entretiens_vehicules ADD COLUMN kilometrage_entretien INTEGER;
            RAISE NOTICE 'Colonne kilometrage_entretien ajoutée';
        END IF;
    END IF;

    -- Ajouter type_entretien si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='entretiens_vehicules' AND column_name='type_entretien') THEN
        ALTER TABLE entretiens_vehicules ADD COLUMN type_entretien VARCHAR(100);
        RAISE NOTICE 'Colonne type_entretien ajoutée';
    END IF;

    -- Modifier la valeur par défaut de statut si nécessaire
    ALTER TABLE entretiens_vehicules ALTER COLUMN statut SET DEFAULT 'effectue';
    
END $$;

-- Créer les index s'ils n'existent pas
CREATE INDEX IF NOT EXISTS idx_entretiens_date ON entretiens_vehicules(date_entretien);
CREATE INDEX IF NOT EXISTS idx_entretiens_type ON entretiens_vehicules(type_entretien);
CREATE INDEX IF NOT EXISTS idx_entretiens_vehicule ON entretiens_vehicules(vehicule_id);

-- Afficher la structure finale
\d entretiens_vehicules
