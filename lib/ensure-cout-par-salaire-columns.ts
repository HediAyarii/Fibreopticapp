import { query } from "@/lib/database"

let columnsEnsured = false

/**
 * Ajoute la colonne `importe` à cout_par_salaire.
 *
 * Elle distingue :
 *  - TRUE  : ligne issue de l'export de paie (ou de la synchro "Tech. Manquants")
 *  - FALSE : ligne créée avant l'import, uniquement pour porter une prime saisie en avance
 *
 * C'est ce drapeau qui pilote l'affichage prévisionnel : tant qu'aucune ligne `importe = TRUE`
 * n'existe pour une période, tous les salariés actifs sont affichés.
 */
export async function ensureCoutParSalaireColumns() {
  if (columnsEnsured) return
  try {
    // Colonne ajoutée SANS default : les lignes existantes restent à NULL et peuvent
    // donc être distinguées lors du backfill (un DEFAULT FALSE les aurait toutes
    // marquées comme non importées).
    await query(`ALTER TABLE cout_par_salaire ADD COLUMN IF NOT EXISTS importe BOOLEAN`)

    // Backfill unique : toutes les lignes existantes datent d'avant cette colonne et
    // proviennent donc d'un import (ou de la synchro des techniciens manquants).
    await query(`UPDATE cout_par_salaire SET importe = TRUE WHERE importe IS NULL`)

    // Les nouvelles lignes sont non importées par défaut ; l'import positionne TRUE.
    await query(`ALTER TABLE cout_par_salaire ALTER COLUMN importe SET DEFAULT FALSE`)

    await fixSyncTotalGenereTrigger()

    columnsEnsured = true
  } catch (error) {
    console.error("⚠️ Erreur ensureCoutParSalaireColumns:", error)
  }
}

/**
 * Corrige le trigger BEFORE INSERT/UPDATE `sync_total_genere_automatique`.
 *
 * La version d'origine castait directement `cloture_tech::date` / `date_rdv::date`.
 * Or ces colonnes sont du texte et contiennent deux formats : "YYYY-MM-DD ..." et
 * "DD/MM/YYYY HH:MM". Sur le second, Postgres lève
 * `date/time field value out of range` (22008) et fait échouer TOUTE écriture dans
 * cout_par_salaire pour le technicien concerné — import CSV compris.
 *
 * On garde exactement la même logique métier, en rendant l'extraction de date sûre :
 * les formats non reconnus donnent NULL au lieu de faire planter la transaction.
 */
async function fixSyncTotalGenereTrigger() {
  // Extrait une date depuis une colonne texte, quel que soit le format, sans jamais lever
  await query(`
    CREATE OR REPLACE FUNCTION extraire_date_intervention(valeur TEXT)
    RETURNS DATE AS $$
    BEGIN
      IF valeur IS NULL OR valeur = '' OR valeur = 'nan' THEN
        RETURN NULL;
      ELSIF valeur ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN
        RETURN SUBSTRING(valeur FROM 1 FOR 10)::date;
      ELSIF valeur ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN
        RETURN TO_DATE(SUBSTRING(valeur FROM 1 FOR 10), 'DD/MM/YYYY');
      ELSE
        RETURN NULL;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql IMMUTABLE
  `)

  await query(`
    CREATE OR REPLACE FUNCTION sync_total_genere_automatique()
    RETURNS trigger AS $$
    DECLARE
      total_calcule DECIMAL(10,2);
      periode_debut DATE;
      periode_fin DATE;
    BEGIN
      periode_debut := DATE(NEW.annee || '-' || LPAD(NEW.mois::text, 2, '0') || '-01');
      periode_fin := periode_debut + INTERVAL '1 month' - INTERVAL '1 day';

      SELECT COALESCE(SUM(
        CASE
          WHEN i.statut = 'CLOTURE TERMINEE' THEN
            COALESCE(
              (SELECT SUM(
                CASE
                  WHEN cp.prix_tech IS NOT NULL THEN cp.prix_tech
                  ELSE 0
                END
              )
              FROM unnest(string_to_array(i.articles, ',')) as article_item
              LEFT JOIN company_pricing cp ON
                TRIM(SPLIT_PART(article_item, 'x', 1)) = cp.service_code
                AND cp.company_name = 'ERT OUEST'
                AND cp.category = i.type_intervention
              ), 0
            )
          ELSE 0
        END
      ), 0) INTO total_calcule
      FROM interventions i
      WHERE (
        (LOWER(i.nom_technicien) = LOWER(NEW.nom) AND LOWER(i.prenom_technicien) = LOWER(NEW.prenom)) OR
        (LOWER(i.nom_technicien) LIKE LOWER(NEW.nom) AND LOWER(i.prenom_technicien) LIKE LOWER(NEW.prenom)) OR
        (LOWER(i.nom_technicien) LIKE LOWER(NEW.prenom) AND LOWER(i.prenom_technicien) LIKE LOWER(NEW.nom)) OR
        (LOWER(REPLACE(i.nom_technicien, ' ', '')) = LOWER(REPLACE(NEW.nom, ' ', '')) AND LOWER(REPLACE(i.prenom_technicien, ' ', '')) = LOWER(REPLACE(NEW.prenom, ' ', ''))) OR
        (LOWER(REPLACE(i.nom_technicien, ' ', '')) LIKE LOWER(REPLACE(NEW.nom, ' ', '')) AND LOWER(REPLACE(i.prenom_technicien, ' ', '')) LIKE LOWER(REPLACE(NEW.prenom, ' ', ''))) OR
        (LOWER(REPLACE(i.nom_technicien, ' ', '')) LIKE LOWER(REPLACE(NEW.prenom, ' ', '')) AND LOWER(REPLACE(i.prenom_technicien, ' ', '')) LIKE LOWER(REPLACE(NEW.nom, ' ', '')))
      )
      AND (
        (extraire_date_intervention(i.cloture_tech) BETWEEN periode_debut AND periode_fin) OR
        (extraire_date_intervention(i.cloture_hotline) BETWEEN periode_debut AND periode_fin) OR
        (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND
         extraire_date_intervention(i.date_rdv) BETWEEN periode_debut AND periode_fin)
      );

      IF ABS(COALESCE(NEW.total_genere, 0) - total_calcule) > 0.01 THEN
        NEW.total_genere := total_calcule;
        NEW.rap := total_calcule - COALESCE(NEW.salaire_net, 0) - COALESCE(NEW.impot, 0) + COALESCE(NEW.prime, 0);
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `)
}
