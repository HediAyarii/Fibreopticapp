-- Script pour ajouter les colonnes de documents PDF aux véhicules

-- Ajouter les colonnes pour le PDF d'assurance
ALTER TABLE vehicules 
ADD COLUMN IF NOT EXISTS assurance_pdf_url TEXT,
ADD COLUMN IF NOT EXISTS assurance_pdf_filename VARCHAR(255);

-- Ajouter les colonnes pour le PDF de carte grise
ALTER TABLE vehicules 
ADD COLUMN IF NOT EXISTS carte_grise_pdf_url TEXT,
ADD COLUMN IF NOT EXISTS carte_grise_pdf_filename VARCHAR(255);

-- Commentaires pour la documentation
COMMENT ON COLUMN vehicules.assurance_pdf_url IS 'URL du document PDF de l''assurance';
COMMENT ON COLUMN vehicules.assurance_pdf_filename IS 'Nom du fichier PDF de l''assurance';
COMMENT ON COLUMN vehicules.carte_grise_pdf_url IS 'URL du document PDF de la carte grise';
COMMENT ON COLUMN vehicules.carte_grise_pdf_filename IS 'Nom du fichier PDF de la carte grise';
