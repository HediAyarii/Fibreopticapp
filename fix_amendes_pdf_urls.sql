-- Migration pour corriger les URLs des fichiers uploadés
-- Remplace /uploads/ par /api/uploads/ pour tous les types de fichiers

-- 1. Amendes véhicules
UPDATE amendes_vehicules 
SET pdf_url = REPLACE(pdf_url, '/uploads/amendes/', '/api/uploads/amendes/')
WHERE pdf_url LIKE '/uploads/amendes/%';

-- 2. Documents administratifs
UPDATE documents_administratifs 
SET file_path = REPLACE(file_path, '/uploads/documents/', '/api/uploads/documents/')
WHERE file_path LIKE '/uploads/documents/%';

-- 3. Photos de réclamations
UPDATE reclamation_photos 
SET photo_path = REPLACE(photo_path, '/uploads/reclamations/', '/api/uploads/reclamations/')
WHERE photo_path LIKE '/uploads/reclamations/%';

-- 4. Photos de véhicules (km updates)
UPDATE vehicules_km_updates 
SET photo_compteur = REPLACE(photo_compteur, '/uploads/vehicules/', '/api/uploads/vehicules/')
WHERE photo_compteur LIKE '/uploads/vehicules/%';

-- Vérification des amendes
SELECT id, pdf_filename, pdf_url FROM amendes_vehicules WHERE pdf_url IS NOT NULL;
