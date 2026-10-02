-- =====================================================================
-- Cartes carburant : périodes d'assignation sans chevauchement
-- =====================================================================
-- Règles appliquées :
--   * Une période = [date_assignation, date_fin[  (date_fin exclue).
--     La date de fin de l'ancien titulaire = la date de début du nouveau :
--     la consommation du jour de bascule appartient au nouveau titulaire.
--   * Une carte n'a qu'un titulaire à la fois, un employé n'a qu'une carte
--     carburant à la fois (contraintes d'exclusion en base). La carte 0 est
--     le badge Télépéage : il se cumule avec une carte carburant.
--   * statut = 'annulee' : l'assignation est ignorée partout. Les autres
--     statuts sont indicatifs, seules les dates comptent.
--   * carburant_consommation."employe_assigné" est recalculé automatiquement
--     par des triggers à partir des périodes (import, assignation, etc.).
--
-- Idempotent : peut être relancé sans risque.
-- Usage (VPS) :
--   PGPASSWORD='...' psql -h localhost -U finalfibre_user -d finalfibre_db \
--     -v ON_ERROR_STOP=1 -f scripts/fix_carburant_assignations_periodes.sql
-- Si "permission denied to create extension btree_gist" :
--   sudo -u postgres psql -d finalfibre_db -c "CREATE EXTENSION IF NOT EXISTS btree_gist;"
--   puis relancer ce script.
-- =====================================================================

\set ON_ERROR_STOP on

CREATE EXTENSION IF NOT EXISTS btree_gist;

BEGIN;

-- Sauvegarde avant modification (créée une seule fois)
CREATE TABLE IF NOT EXISTS carburant_assignations_backup_20261002 AS
  TABLE carburant_assignations;

-- Les contraintes sont recréées en fin de script
ALTER TABLE carburant_assignations DROP CONSTRAINT IF EXISTS carburant_assignations_carte_sans_chevauchement;
ALTER TABLE carburant_assignations DROP CONSTRAINT IF EXISTS carburant_assignations_employe_sans_chevauchement;
ALTER TABLE carburant_assignations DROP CONSTRAINT IF EXISTS carburant_assignations_periode_valide;

-- Badge Télépéage (transactions "Péage TIS VL") : cumulable avec une carte carburant
CREATE OR REPLACE FUNCTION carburant_carte_peage(p_carte TEXT)
RETURNS BOOLEAN
LANGUAGE sql IMMUTABLE
AS $$
  SELECT p_carte = '0'
$$;

-- ---------------------------------------------------------------------
-- 1. Dates au jour près
-- ---------------------------------------------------------------------
UPDATE carburant_assignations SET statut = 'active' WHERE statut IS NULL;
UPDATE carburant_assignations SET date_assignation = created_at WHERE date_assignation IS NULL;

UPDATE carburant_assignations
SET date_assignation = date_trunc('day', date_assignation)
WHERE date_assignation <> date_trunc('day', date_assignation);

-- Une fin avec une heure venait d'un NOW() ("jusqu'à maintenant", jour inclus) :
-- la fin exclue correspondante est le lendemain.
UPDATE carburant_assignations
SET date_fin = date_trunc('day', date_fin) + INTERVAL '1 day'
WHERE date_fin <> date_trunc('day', date_fin);

ALTER TABLE carburant_assignations ALTER COLUMN statut SET NOT NULL;
ALTER TABLE carburant_assignations ALTER COLUMN date_assignation SET NOT NULL;

-- Période vide ou inversée : annulée
UPDATE carburant_assignations
SET statut = 'annulee',
    commentaires = concat_ws(' | ', NULLIF(commentaires, ''), 'Annulée (correction 02/10/2026) : période vide'),
    updated_at = CURRENT_TIMESTAMP
WHERE statut <> 'annulee' AND date_fin IS NOT NULL AND date_fin <= date_assignation;

-- ---------------------------------------------------------------------
-- 2. Correction connue : la carte 61 est à Walid KRAIEM depuis le 01/09/2026,
--    Ramzi HAKIRI garde la carte 26.
-- ---------------------------------------------------------------------
UPDATE carburant_assignations ca
SET statut = 'annulee',
    commentaires = concat_ws(' | ', NULLIF(ca.commentaires, ''), 'Annulée (correction 02/10/2026) : carte 61 attribuée à Walid KRAIEM, Ramzi HAKIRI garde la carte 26'),
    updated_at = CURRENT_TIMESTAMP
FROM employes e
WHERE e.id = ca.employe_id
  AND upper(e.nom) = 'HAKIRI' AND upper(e.prenom) = 'RAMZI'
  AND ca.carte_id = '61'
  AND ca.date_assignation = '2026-09-01'
  AND ca.statut <> 'annulee';

-- ---------------------------------------------------------------------
-- 3. Doublons : même employé, même carte, périodes qui se chevauchent.
--    On garde la plus ancienne (étendue si besoin), les autres sont annulées.
-- ---------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  LOOP
    SELECT a.id AS garder, b.id AS doublon,
           CASE WHEN a.date_fin IS NULL OR b.date_fin IS NULL THEN NULL
                ELSE greatest(a.date_fin, b.date_fin) END AS nouvelle_fin
    INTO r
    FROM carburant_assignations a
    JOIN carburant_assignations b
      ON a.employe_id = b.employe_id
     AND a.carte_id = b.carte_id
     AND (a.date_assignation, a.id) < (b.date_assignation, b.id)
     AND b.date_assignation < COALESCE(a.date_fin, 'infinity')
    WHERE a.statut <> 'annulee' AND b.statut <> 'annulee'
    ORDER BY a.date_assignation, a.id, b.date_assignation, b.id
    LIMIT 1;

    EXIT WHEN NOT FOUND;

    UPDATE carburant_assignations
    SET statut = 'annulee',
        commentaires = concat_ws(' | ', NULLIF(commentaires, ''), 'Annulée (correction 02/10/2026) : doublon de l''assignation #' || r.garder),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = r.doublon;

    UPDATE carburant_assignations
    SET date_fin = r.nouvelle_fin, updated_at = CURRENT_TIMESTAMP
    WHERE id = r.garder AND date_fin IS DISTINCT FROM r.nouvelle_fin;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 4. Cas ambigus (même date de début) : on s'arrête, décision manuelle.
-- ---------------------------------------------------------------------
DO $$
DECLARE
  details TEXT;
BEGIN
  SELECT string_agg(format('carte %s : %s / %s (début %s)', a.carte_id, ea.prenom || ' ' || ea.nom,
                           eb.prenom || ' ' || eb.nom, a.date_assignation::date), E'\n')
  INTO details
  FROM carburant_assignations a
  JOIN carburant_assignations b ON a.carte_id = b.carte_id AND a.id < b.id AND a.employe_id <> b.employe_id
                               AND a.date_assignation = b.date_assignation
  JOIN employes ea ON ea.id = a.employe_id
  JOIN employes eb ON eb.id = b.employe_id
  WHERE a.statut <> 'annulee' AND b.statut <> 'annulee';
  IF details IS NOT NULL THEN
    RAISE EXCEPTION E'Même carte, deux employés, même date de début : à corriger manuellement\n%', details;
  END IF;

  SELECT string_agg(format('%s : cartes %s / %s (début %s)', e.prenom || ' ' || e.nom, a.carte_id,
                           b.carte_id, a.date_assignation::date), E'\n')
  INTO details
  FROM carburant_assignations a
  JOIN carburant_assignations b ON a.employe_id = b.employe_id AND a.id < b.id AND a.carte_id <> b.carte_id
                               AND a.date_assignation = b.date_assignation
  JOIN employes e ON e.id = a.employe_id
  WHERE a.statut <> 'annulee' AND b.statut <> 'annulee'
    AND NOT carburant_carte_peage(a.carte_id) AND NOT carburant_carte_peage(b.carte_id);
  IF details IS NOT NULL THEN
    RAISE EXCEPTION E'Même employé, deux cartes, même date de début : à corriger manuellement\n%', details;
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 5. Un employé = une carte carburant à la fois : l'ancienne carte se
--    termine le jour où la suivante commence.
-- ---------------------------------------------------------------------
WITH suivante AS (
  SELECT id, date_fin,
         lead(date_assignation) OVER (PARTITION BY employe_id ORDER BY date_assignation, id) AS debut_suivante,
         lead(carte_id) OVER (PARTITION BY employe_id ORDER BY date_assignation, id) AS carte_suivante
  FROM carburant_assignations
  WHERE statut <> 'annulee' AND NOT carburant_carte_peage(carte_id)
)
UPDATE carburant_assignations ca
SET date_fin = s.debut_suivante,
    commentaires = concat_ws(' | ', NULLIF(ca.commentaires, ''),
                             'Clôturée (correction 02/10/2026) : remplacée par la carte ' || s.carte_suivante
                             || ' le ' || to_char(s.debut_suivante, 'DD/MM/YYYY')),
    updated_at = CURRENT_TIMESTAMP
FROM suivante s
WHERE s.id = ca.id
  AND s.debut_suivante IS NOT NULL
  AND COALESCE(s.date_fin, 'infinity') > s.debut_suivante;

-- ---------------------------------------------------------------------
-- 6. Une carte = un titulaire à la fois : l'ancien titulaire s'arrête
--    le jour où le suivant commence.
-- ---------------------------------------------------------------------
WITH suivante AS (
  SELECT id, date_fin,
         lead(date_assignation) OVER (PARTITION BY carte_id ORDER BY date_assignation, id) AS debut_suivante,
         lead(employe_id) OVER (PARTITION BY carte_id ORDER BY date_assignation, id) AS employe_suivant
  FROM carburant_assignations
  WHERE statut <> 'annulee'
)
UPDATE carburant_assignations ca
SET date_fin = s.debut_suivante,
    commentaires = concat_ws(' | ', NULLIF(ca.commentaires, ''),
                             'Clôturée (correction 02/10/2026) : carte reprise par ' || e.prenom || ' ' || e.nom
                             || ' le ' || to_char(s.debut_suivante, 'DD/MM/YYYY')),
    updated_at = CURRENT_TIMESTAMP
FROM suivante s
JOIN employes e ON e.id = s.employe_suivant
WHERE s.id = ca.id
  AND s.debut_suivante IS NOT NULL
  AND COALESCE(s.date_fin, 'infinity') > s.debut_suivante;

-- Statut indicatif aligné sur les dates
UPDATE carburant_assignations
SET statut = CASE WHEN date_fin IS NOT NULL AND date_fin <= CURRENT_DATE THEN 'inactive' ELSE 'active' END
WHERE statut <> 'annulee'
  AND statut IS DISTINCT FROM CASE WHEN date_fin IS NOT NULL AND date_fin <= CURRENT_DATE THEN 'inactive' ELSE 'active' END;

-- ---------------------------------------------------------------------
-- 7. Garanties en base
-- ---------------------------------------------------------------------
ALTER TABLE carburant_assignations
  ADD CONSTRAINT carburant_assignations_periode_valide
  CHECK (statut = 'annulee' OR date_fin IS NULL OR date_fin > date_assignation);

ALTER TABLE carburant_assignations
  ADD CONSTRAINT carburant_assignations_carte_sans_chevauchement
  EXCLUDE USING gist (carte_id WITH =, tsrange(date_assignation, date_fin, '[)') WITH &&)
  WHERE (statut <> 'annulee');

ALTER TABLE carburant_assignations
  ADD CONSTRAINT carburant_assignations_employe_sans_chevauchement
  EXCLUDE USING gist (employe_id WITH =, tsrange(date_assignation, date_fin, '[)') WITH &&)
  WHERE (statut <> 'annulee' AND NOT carburant_carte_peage(carte_id));

-- ---------------------------------------------------------------------
-- 8. Attribution automatique de la consommation
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION carburant_parse_date(p_texte TEXT)
RETURNS DATE
LANGUAGE sql STABLE
AS $$
  SELECT CASE
    WHEN p_texte ~ '^\d{2}\.\d{2}\.\d{4}$' THEN to_date(p_texte, 'DD.MM.YYYY')
    WHEN p_texte ~ '^\d{2}/\d{2}/\d{4}$' THEN to_date(p_texte, 'DD/MM/YYYY')
    WHEN p_texte ~ '^\d{4}-\d{2}-\d{2}' THEN to_date(left(p_texte, 10), 'YYYY-MM-DD')
  END
$$;

-- La règle unique : quelle assignation couvre cette carte à cette date ?
CREATE OR REPLACE FUNCTION carburant_assignation_a_date(p_carte TEXT, p_date DATE)
RETURNS INTEGER
LANGUAGE sql STABLE
AS $$
  SELECT ca.id
  FROM carburant_assignations ca
  WHERE ca.carte_id = p_carte
    AND ca.statut <> 'annulee'
    AND p_date >= ca.date_assignation
    AND (ca.date_fin IS NULL OR p_date < ca.date_fin)
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION carburant_titulaire_a_date(p_carte TEXT, p_date DATE)
RETURNS INTEGER
LANGUAGE sql STABLE
AS $$
  SELECT employe_id FROM carburant_assignations
  WHERE id = carburant_assignation_a_date(p_carte, p_date)
$$;

-- Chaque transaction insérée ou modifiée reçoit son titulaire
CREATE OR REPLACE FUNCTION trg_carburant_consommation_titulaire()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."employe_assigné" := carburant_titulaire_a_date(NEW.numero_carte, carburant_parse_date(NEW.date_livraison));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS carburant_consommation_titulaire ON carburant_consommation;
CREATE TRIGGER carburant_consommation_titulaire
  BEFORE INSERT OR UPDATE ON carburant_consommation
  FOR EACH ROW EXECUTE FUNCTION trg_carburant_consommation_titulaire();

-- Chaque changement d'assignation recalcule les transactions de la carte
CREATE OR REPLACE FUNCTION trg_carburant_assignations_recalcul()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  cartes TEXT[];
BEGIN
  IF TG_OP = 'INSERT' THEN
    cartes := ARRAY[NEW.carte_id];
  ELSIF TG_OP = 'DELETE' THEN
    cartes := ARRAY[OLD.carte_id];
  ELSE
    cartes := ARRAY[OLD.carte_id, NEW.carte_id];
  END IF;

  UPDATE carburant_consommation cc
  SET "employe_assigné" = carburant_titulaire_a_date(cc.numero_carte, carburant_parse_date(cc.date_livraison))
  WHERE cc.numero_carte = ANY (cartes);

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS carburant_assignations_recalcul ON carburant_assignations;
CREATE TRIGGER carburant_assignations_recalcul
  AFTER INSERT OR UPDATE OR DELETE ON carburant_assignations
  FOR EACH ROW EXECUTE FUNCTION trg_carburant_assignations_recalcul();

-- Recalcul initial de toutes les transactions
UPDATE carburant_consommation
SET "employe_assigné" = carburant_titulaire_a_date(numero_carte, carburant_parse_date(date_livraison));

COMMIT;

-- ---------------------------------------------------------------------
-- Rapport
-- ---------------------------------------------------------------------
\echo '--- Assignations par statut'
SELECT statut, count(*) FROM carburant_assignations GROUP BY statut ORDER BY statut;

\echo '--- Titulaires actuels'
SELECT ca.carte_id AS carte, e.prenom || ' ' || e.nom AS employe,
       to_char(ca.date_assignation, 'DD/MM/YYYY') AS depuis,
       COALESCE(to_char(ca.date_fin, 'DD/MM/YYYY'), 'sans fin') AS jusqu_au
FROM carburant_assignations ca
JOIN employes e ON e.id = ca.employe_id
WHERE ca.statut <> 'annulee'
  AND ca.date_assignation <= CURRENT_DATE
  AND (ca.date_fin IS NULL OR ca.date_fin > CURRENT_DATE)
ORDER BY e.nom, e.prenom;

\echo '--- Transactions avec / sans titulaire'
SELECT ("employe_assigné" IS NOT NULL) AS avec_titulaire, count(*) AS transactions,
       round(sum(CASE WHEN replace(ca_ttc, ',', '.') ~ '^-?[0-9]+(\.[0-9]+)?$'
                      THEN replace(ca_ttc, ',', '.')::numeric ELSE 0 END), 2) AS montant_ttc
FROM carburant_consommation GROUP BY 1 ORDER BY 1 DESC;

\echo '--- Cartes utilisées sans titulaire (dates à compléter)'
SELECT numero_carte AS carte,
       to_char(min(carburant_parse_date(date_livraison)), 'DD/MM/YYYY') AS premiere,
       to_char(max(carburant_parse_date(date_livraison)), 'DD/MM/YYYY') AS derniere,
       count(*) AS transactions
FROM carburant_consommation
WHERE "employe_assigné" IS NULL
GROUP BY numero_carte
ORDER BY min(carburant_parse_date(date_livraison));
