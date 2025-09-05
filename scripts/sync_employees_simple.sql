-- Script SQL pour synchroniser les employés depuis les interventions
-- Ne remplir que les champs essentiels (nom, prénom, matricule, statut, commentaires)

-- Supprimer les employés existants pour tester
DELETE FROM employes;

-- Insérer les employés avec seulement les champs essentiels
INSERT INTO employes (
    matricule, nom, prenom, statut, commentaires, created_at, updated_at
)
SELECT DISTINCT 
    CONCAT('EMP', SUBSTRING(nom_technicien, 1, 3), SUBSTRING(prenom_technicien, 1, 2)) as matricule,
    nom_technicien,
    prenom_technicien,
    'actif' as statut,
    CONCAT('Technicien avec ', COUNT(*), ' interventions réalisées - À compléter par l''admin') as commentaires,
    NOW() as created_at,
    NOW() as updated_at
FROM interventions 
WHERE nom_technicien IS NOT NULL 
AND prenom_technicien IS NOT NULL
AND nom_technicien != 'nan'
AND prenom_technicien != 'nan'
GROUP BY nom_technicien, prenom_technicien;

-- Vérifier le résultat
SELECT 
    matricule,
    nom,
    prenom,
    statut,
    commentaires,
    telephone,
    email,
    salaire_base,
    pourcentage_taxe
FROM employes 
ORDER BY nom, prenom;
