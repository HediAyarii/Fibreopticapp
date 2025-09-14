-- Script pour mettre à jour les pénalités existantes sans type
-- Mettre à jour toutes les pénalités qui ont un type_penalite NULL ou vide

UPDATE penalites 
SET type_penalite = 'dossier_non_cloture' 
WHERE type_penalite IS NULL OR type_penalite = '';

-- Vérifier le résultat
SELECT id, type_penalite, montant, statut 
FROM penalites 
ORDER BY created_at DESC;
