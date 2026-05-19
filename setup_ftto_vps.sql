-- ============================================================
-- FTTO Setup Script for VPS PostgreSQL
-- Run: psql -U <user> -d <database> -f setup_ftto_vps.sql
-- ============================================================

-- 1. Table des tarifs FTTO
CREATE TABLE IF NOT EXISTS ftto_tarifs (
  id          SERIAL PRIMARY KEY,
  code_article VARCHAR(100) NOT NULL,
  designation TEXT         NOT NULL,
  bpu         DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table des tickets FTTO
CREATE TABLE IF NOT EXISTS ftto_tickets (
  id                   SERIAL PRIMARY KEY,
  num_ticket           VARCHAR(100),
  date_ticket          DATE,
  code_g2r             VARCHAR(100),
  ville                VARCHAR(255),
  code_article         VARCHAR(100),
  designation          VARCHAR(255),
  prix_unitaire        NUMERIC(10,2) DEFAULT 0,
  quantite             INTEGER       DEFAULT 1,
  employe_id           INTEGER REFERENCES employes(id) ON DELETE SET NULL,
  technicien_nom       VARCHAR(255),
  technicien_prenom    VARCHAR(255),
  technicien_matricule VARCHAR(100),
  created_at           TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- Drop any NOT NULL constraints on ftto_tickets (except id) from old schema
DO $$
DECLARE col TEXT;
BEGIN
  FOR col IN
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'ftto_tickets'
      AND is_nullable  = 'NO'
      AND column_name  != 'id'
  LOOP
    EXECUTE 'ALTER TABLE ftto_tickets ALTER COLUMN ' || quote_ident(col) || ' DROP NOT NULL';
  END LOOP;
END $$;

-- 3. Seed tarifs (skip if already populated)
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM ftto_tarifs) = 0 THEN
    INSERT INTO ftto_tarifs (code_article, designation, bpu) VALUES
      ('FO-010',        'Pose câble optique de 6 FO à 144 Fo sous fourreau',                                                                                                     0.73),
      ('FO-011',        'Pose câble optique de 6 FO à 144 FO en intérieur',                                                                                                      1.46),
      ('FO-013',        'Pose câble optique de 6 FO à 144 FO en aérien',                                                                                                         1.28),
      ('FO-130',        'Câble optique de 6 FO',                                                                                                                                 16.61),
      ('FO-131',        'Câble optique de 12 FO',                                                                                                                                20.02),
      ('FO-132',        'Câble optique de 24 FO',                                                                                                                                22.02),
      ('FO-133',        'Câble optique de 36 FO',                                                                                                                                24.21),
      ('FO-134',        'Câble optique de 48 FO',                                                                                                                                26.71),
      ('FO-136',        'Câble optique de 72 FO',                                                                                                                                32.28),
      ('FO-138',        'Câble optique de 96 FO',                                                                                                                                39.11),
      ('FO-139',        'Câble optique de 144 FO',                                                                                                                               43.00),
      ('FO-141',        'Câble optique de 288 FO',                                                                                                                               84.01),
      ('FO-144',        'Câble optique de 720 FO',                                                                                                                              169.16),
      ('FO-240',        'Câble optique de 6 FO à 144 FO (boîte)',                                                                                                                83.04),
      ('FO-241',        'Câble optique de 145 FO à 576 FO',                                                                                                                    166.08),
      ('FO-350',        'A l''unité',                                                                                                                                             5.34),
      ('FO-351',        'Epissurage 12 FO',                                                                                                                                      35.93),
      ('FO-352',        'Epissurage 24 FO',                                                                                                                                      71.86),
      ('FO-352B',       'Epissurage 36 FO',                                                                                                                                     107.79),
      ('FO-354',        'Epissurage 48 FO',                                                                                                                                     143.07),
      ('FO-356',        'Epissurage 72 FO',                                                                                                                                     214.61),
      ('FO-358',        'Epissurage 96 FO',                                                                                                                                     285.88),
      ('FO-359',        'Epissurage 144 FO',                                                                                                                                    428.81),
      ('FO-361',        'Epissurage 288 FO',                                                                                                                                    851.31),
      ('FO-400',        'Pose de boite 6 FO à 144 FO',                                                                                                                          23.36),
      ('FO-800',        'Forfait intervention',                                                                                                                                  73.00),
      ('ALIGNEMENT',    'FORFAIT ALIGNEMENT',                                                                                                                                   200.00),
      ('IM-101',        'VISITE TECHNIQUE',                                                                                                                                     154.00),
      ('TRVX INT',      'TRAVAUX INTRASITE',                                                                                                                                    400.00),
      ('TRVX EXT',      'TRAVAUX EXTRASITE',                                                                                                                                    500.00),
      ('PV EXTRASITE',  'PLUS VALUE EXTRA SITE',                                                                                                                                  0.90),
      ('IG-93',         'Plus-value applicable pour les sites complexes de type centres commerciaux : dépose faux-plafonds en HNO, nacelle, prestataire intra-site imposé',     600.00),
      ('IC-508',        'Forfait location 1 Jour Nacelle intérieure électrique pour travail en hauteur jusque 12m, compris transport A/R',                                      230.00),
      ('RACC-FTTE-BRE', 'BRE existante jusqu''à 500ml de tirage avec la pose d''une PTO (FOURNITURES ET POSES)',                                                                565.00),
      ('COMPL ML FTTE', 'Complément au raccordement pour tirage au-delà de 500ml pour arriver en limite de propriété. Prix au ML tout compris',                                  0.64),
      ('DEPLOY PM-BRE', 'Création distribution PM-BRE (prix au ML déployé)',                                                                                                     1.40),
      ('TIROIR ENT PM', 'F&P Tiroir entreprise au PM',                                                                                                                          40.00),
      ('TIROIR FTTE',   'F&P Tiroir optique Client dans le cadre de déploiement FTTE (Fixation - Nommage - Etiquetage - Photos)',                                               40.00),
      ('PANNE B2B',     'PANNE B2B FORFAIT',                                                                                                                                    95.00);

    RAISE NOTICE '✅ % tarifs FTTO insérés', (SELECT COUNT(*) FROM ftto_tarifs);
  ELSE
    RAISE NOTICE 'ℹ️  ftto_tarifs déjà peuplé (% lignes), skip seed.', (SELECT COUNT(*) FROM ftto_tarifs);
  END IF;
END $$;

SELECT 'Setup FTTO terminé ✅' AS status;
