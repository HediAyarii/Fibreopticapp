-- Table pour les documents administratifs
CREATE TABLE IF NOT EXISTS documents_administratifs (
    id SERIAL PRIMARY KEY,
    employe_id INTEGER NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
    type_document VARCHAR(50) NOT NULL, -- 'fiche_paie', 'attestation_travail', 'certificat_salaire', etc.
    statut VARCHAR(20) DEFAULT 'en_attente', -- 'en_attente', 'traite', 'rejete'
    date_demande TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_traitement TIMESTAMP NULL,
    commentaire_demande TEXT,
    commentaire_admin TEXT,
    fichier_jointe VARCHAR(255) NULL, -- Nom du fichier uploadé
    chemin_fichier VARCHAR(500) NULL, -- Chemin complet du fichier
    taille_fichier BIGINT NULL, -- Taille en bytes
    type_fichier VARCHAR(50) NULL, -- 'pdf', 'csv', 'jpg', 'png', etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_documents_employe_id ON documents_administratifs(employe_id);
CREATE INDEX IF NOT EXISTS idx_documents_statut ON documents_administratifs(statut);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents_administratifs(type_document);
CREATE INDEX IF NOT EXISTS idx_documents_date_demande ON documents_administratifs(date_demande);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_documents_updated_at
    BEFORE UPDATE ON documents_administratifs
    FOR EACH ROW
    EXECUTE FUNCTION update_documents_updated_at();

-- Types de documents prédéfinis
INSERT INTO documents_administratifs (employe_id, type_document, statut, commentaire_demande) VALUES
(1, 'fiche_paie', 'en_attente', 'Demande de fiche de paie pour le mois de janvier 2025'),
(2, 'attestation_travail', 'en_attente', 'Besoin d''une attestation de travail pour un prêt bancaire'),
(3, 'autre', 'en_attente', 'Demande de document spécifique: Certificat de formation')
ON CONFLICT DO NOTHING;

-- Vue pour faciliter les requêtes
CREATE OR REPLACE VIEW v_documents_administratifs AS
SELECT 
    da.id,
    da.employe_id,
    e.prenom,
    e.nom,
    e.matricule,
    da.type_document,
    da.statut,
    da.date_demande,
    da.date_traitement,
    da.commentaire_demande,
    da.commentaire_admin,
    da.fichier_jointe,
    da.chemin_fichier,
    da.taille_fichier,
    da.type_fichier,
    da.created_at,
    da.updated_at,
    CASE 
        WHEN da.statut = 'en_attente' THEN 'En attente'
        WHEN da.statut = 'traite' THEN 'Traité'
        WHEN da.statut = 'rejete' THEN 'Rejeté'
        ELSE da.statut
    END as statut_libelle,
           CASE
               WHEN da.type_document = 'fiche_paie' THEN 'Fiche de Paie'
               WHEN da.type_document = 'attestation_travail' THEN 'Attestation de Travail'
               WHEN da.type_document LIKE 'autre:%' THEN 'Autre: ' || SUBSTRING(da.type_document FROM 7)
               WHEN da.type_document = 'autre' THEN 'Autre'
               ELSE da.type_document
           END as type_document_libelle
FROM documents_administratifs da
JOIN employes e ON da.employe_id = e.id
ORDER BY da.date_demande DESC;
