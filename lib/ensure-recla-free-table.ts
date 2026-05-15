import { query } from "@/lib/database"

let tableEnsured = false

export async function ensureReclaFreeTable() {
  if (tableEnsured) return
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS recla_free (
        id SERIAL PRIMARY KEY,
        type_litige VARCHAR(50) NOT NULL DEFAULT 'client',
        reference_client VARCHAR(255),
        agence VARCHAR(255),
        date DATE,
        region VARCHAR(255),
        code_postal VARCHAR(20),
        nature_travaux VARCHAR(50) DEFAULT 'FIBRE',
        nature_travaux_detail VARCHAR(255),
        commentaire TEXT,
        status_ticket VARCHAR(50) DEFAULT 'pas_clos',
        date_retour DATE,
        montant DECIMAL(10,2) DEFAULT 0,
        montant_technicien DECIMAL(10,2) DEFAULT 0,
        montant_entreprise DECIMAL(10,2) DEFAULT 0,
        employe_id INTEGER REFERENCES employes(id) ON DELETE SET NULL,
        confirmer BOOLEAN DEFAULT FALSE,
        date_confirmation TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
    // Migrations pour les colonnes ajoutées après la création initiale
    await query(`ALTER TABLE recla_free ADD COLUMN IF NOT EXISTS montant_technicien DECIMAL(10,2) DEFAULT 0`)
    await query(`ALTER TABLE recla_free ADD COLUMN IF NOT EXISTS montant_entreprise DECIMAL(10,2) DEFAULT 0`)
    await query(`ALTER TABLE recla_free ADD COLUMN IF NOT EXISTS date_confirmation TIMESTAMP`)
    // Recalculer les lignes existantes sans montant_technicien renseigné
    await query(`
      UPDATE recla_free SET
        montant_technicien = CASE type_litige WHEN 'controleur' THEN 30 WHEN 'client' THEN 60 ELSE 0 END,
        montant_entreprise = GREATEST(0, montant - CASE type_litige WHEN 'controleur' THEN 30 WHEN 'client' THEN 60 ELSE 0 END)
      WHERE montant_technicien = 0 AND montant > 0
    `)
    tableEnsured = true
  } catch (e) {
    // Table existe déjà ou erreur DDL — on continue
  }
}
