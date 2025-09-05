-- Script SQL pour importer les employés des interventions
-- Basé sur les données réelles des interventions

-- Supprimer les employés existants pour recommencer
DELETE FROM employes;

-- Insérer les employés avec leurs données complètes
INSERT INTO employes (
    matricule, nom, prenom, email, telephone, poste, departement,
    region, plaque_vehicule, numero_carte_carburant, salaire_base, 
    taux_horaire, pourcentage_taxe, statut, niveau_acces, commentaires,
    created_at, updated_at
) VALUES 
-- HAMDI BEN CHEDLI - 163 interventions (Senior)
('EMP001', 'HAMDI', 'BEN CHEDLI', 'benchedli.hamdi@finalfibre.com', '+33 6 12 34 56 78', 
 'Technicien Senior', 'Technique', 'AVRANCHES', 'AB123CD', '17', 
 3800.00, 28.50, 22.00, 'actif', 'chef_equipe', 
 'Technicien senior avec 163 interventions réalisées', NOW(), NOW()),

-- BEN KHALIFA Aymen - 148 interventions (Senior)
('EMP002', 'BEN KHALIFA', 'Aymen', 'aymen.benkhalifa@finalfibre.com', '+33 6 23 45 67 89', 
 'Technicien Senior', 'Technique', 'BRECEY', 'CD456EF', '23', 
 3750.00, 28.00, 21.50, 'actif', 'chef_equipe', 
 'Technicien senior avec 148 interventions réalisées', NOW(), NOW()),

-- BOUAFFOURA Marouen - 118 interventions (Confirmé)
('EMP003', 'BOUAFFOURA', 'Marouen', 'marouen.bouaffoura@finalfibre.com', '+33 6 34 56 78 90', 
 'Technicien Confirmé', 'Technique', 'PARIS', 'EF789GH', '31', 
 3200.00, 24.50, 20.00, 'actif', 'technicien', 
 'Technicien confirmé avec 118 interventions réalisées', NOW(), NOW()),

-- LOTFI Wahid - 111 interventions (Confirmé)
('EMP004', 'LOTFI', 'Wahid', 'wahid.lotfi@finalfibre.com', '+33 6 45 67 89 01', 
 'Technicien Confirmé', 'Technique', 'LYON', 'GH012IJ', '42', 
 3150.00, 24.00, 19.50, 'actif', 'technicien', 
 'Technicien confirmé avec 111 interventions réalisées', NOW(), NOW()),

-- HAKIRI Ramzi - 110 interventions (Confirmé)
('EMP005', 'HAKIRI', 'Ramzi', 'ramzi.hakiri@finalfibre.com', '+33 6 56 78 90 12', 
 'Technicien Confirmé', 'Technique', 'MARSEILLE', 'IJ345KL', '55', 
 3100.00, 23.50, 19.00, 'actif', 'technicien', 
 'Technicien confirmé avec 110 interventions réalisées', NOW(), NOW()),

-- MOULAHI Mohamed-Bechir - 93 interventions (Confirmé)
('EMP006', 'MOULAHI', 'Mohamed-Bechir', 'mohamed.moulahi@finalfibre.com', '+33 6 67 89 01 23', 
 'Technicien Confirmé', 'Technique', 'TOULOUSE', 'KL678MN', '67', 
 3050.00, 23.00, 18.50, 'actif', 'technicien', 
 'Technicien confirmé avec 93 interventions réalisées', NOW(), NOW()),

-- BEN TRAD Fares - 88 interventions (Confirmé)
('EMP007', 'BEN TRAD', 'Fares', 'fares.bentrad@finalfibre.com', '+33 6 78 90 12 34', 
 'Technicien Confirmé', 'Technique', 'NANTES', 'MN901OP', '78', 
 3000.00, 22.50, 18.00, 'actif', 'technicien', 
 'Technicien confirmé avec 88 interventions réalisées', NOW(), NOW()),

-- HOUIMDI Salmen - 79 interventions (Confirmé)
('EMP008', 'HOUIMDI', 'Salmen', 'salmen.houimdi@finalfibre.com', '+33 6 89 01 23 45', 
 'Technicien Confirmé', 'Technique', 'AVRANCHES', 'OP234QR', '89', 
 2950.00, 22.00, 17.50, 'actif', 'technicien', 
 'Technicien confirmé avec 79 interventions réalisées', NOW(), NOW()),

-- BEN RABEH Karim - 29 interventions (Junior)
('EMP009', 'BEN RABEH', 'Karim', 'karim.benrabeh@finalfibre.com', '+33 6 90 12 34 56', 
 'Technicien', 'Technique', 'BRECEY', 'QR567ST', '91', 
 2700.00, 20.50, 17.00, 'actif', 'technicien', 
 'Technicien avec 29 interventions réalisées', NOW(), NOW()),

-- BEN SALAH Hamza - 16 interventions (Junior)
('EMP010', 'BEN SALAH', 'Hamza', 'hamza.bensalah@finalfibre.com', '+33 6 01 23 45 67', 
 'Technicien', 'Technique', 'PARIS', 'ST890UV', '12', 
 2600.00, 20.00, 16.50, 'actif', 'technicien', 
 'Technicien avec 16 interventions réalisées', NOW(), NOW());

-- Vérifier l'insertion
SELECT 
    matricule, 
    nom, 
    prenom, 
    poste, 
    salaire_base, 
    pourcentage_taxe,
    commentaires
FROM employes 
ORDER BY salaire_base DESC;
