-- Augmenter la taille du champ statut_km dans assignations_vehicules
ALTER TABLE assignations_vehicules 
ALTER COLUMN statut_km TYPE VARCHAR(50);

-- Augmenter la taille du champ statut dans vehicules_km_updates
ALTER TABLE vehicules_km_updates 
ALTER COLUMN statut TYPE VARCHAR(50);

-- Augmenter la taille du champ type_update dans vehicules_km_updates
ALTER TABLE vehicules_km_updates 
ALTER COLUMN type_update TYPE VARCHAR(50);

-- Vérifier les modifications
\d assignations_vehicules
\d vehicules_km_updates
