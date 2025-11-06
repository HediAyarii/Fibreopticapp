-- ====================================================================
-- SCRIPT DE TEST - SYSTÈME DE GESTION DES DÉPÔTS
-- ====================================================================
-- Ce script teste toutes les fonctionnalités du système de dépôts
-- ====================================================================

\echo '====================================='
\echo 'TEST DU SYSTÈME DE GESTION DES DÉPÔTS'
\echo '====================================='
\echo ''

-- Test 1: Vérifier que la colonne depot existe
\echo '1. Vérification de la colonne depot...'
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Colonne depot existe'
        ELSE '❌ Colonne depot manquante'
    END as resultat
FROM information_schema.columns 
WHERE table_name = 'materiel' AND column_name = 'depot';

-- Test 2: Vérifier que la table historique existe
\echo ''
\echo '2. Vérification de la table historique_transferts_materiel...'
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Table historique_transferts_materiel existe'
        ELSE '❌ Table historique_transferts_materiel manquante'
    END as resultat
FROM information_schema.tables 
WHERE table_name = 'historique_transferts_materiel';

-- Test 3: Vérifier les contraintes du champ depot
\echo ''
\echo '3. Vérification des contraintes du champ depot...'
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%depot%';

-- Test 4: Créer un matériel de test dans chaque dépôt
\echo ''
\echo '4. Test de création de matériel...'

-- Nettoyage des données de test précédentes
DELETE FROM materiel WHERE nom_equipement LIKE 'TEST_%';

-- Créer matériel AXECOM
INSERT INTO materiel (nom_equipement, type_materiel, depot, quantite, prix_unitaire)
VALUES ('TEST_ROUTEUR_AXECOM', 'Réseau', 'AXECOM', 1, 150.00)
RETURNING id, nom_equipement, depot;

-- Créer matériel ERT
INSERT INTO materiel (nom_equipement, type_materiel, depot, quantite, prix_unitaire)
VALUES ('TEST_SWITCH_ERT', 'Réseau', 'ERT', 1, 200.00)
RETURNING id, nom_equipement, depot;

\echo '✅ Matériels de test créés'

-- Test 5: Tester la valeur par défaut
\echo ''
\echo '5. Test de la valeur par défaut (depot = AXECOM)...'
INSERT INTO materiel (nom_equipement, type_materiel, quantite)
VALUES ('TEST_SANS_DEPOT', 'Test', 1)
RETURNING id, nom_equipement, depot;

SELECT 
    CASE 
        WHEN depot = 'AXECOM' THEN '✅ Valeur par défaut correcte (AXECOM)'
        ELSE '❌ Valeur par défaut incorrecte: ' || depot
    END as resultat
FROM materiel WHERE nom_equipement = 'TEST_SANS_DEPOT';

-- Test 6: Simuler un transfert
\echo ''
\echo '6. Test de transfert entre dépôts...'

DO $$
DECLARE
    test_materiel_id INTEGER;
BEGIN
    -- Récupérer l'ID du matériel de test
    SELECT id INTO test_materiel_id 
    FROM materiel 
    WHERE nom_equipement = 'TEST_ROUTEUR_AXECOM';
    
    -- Enregistrer le transfert dans l'historique
    INSERT INTO historique_transferts_materiel 
    (materiel_id, depot_origine, depot_destination, motif, utilisateur_nom)
    VALUES 
    (test_materiel_id, 'AXECOM', 'ERT', 'Test automatique', 'Script de test');
    
    -- Mettre à jour le dépôt du matériel
    UPDATE materiel 
    SET depot = 'ERT' 
    WHERE id = test_materiel_id;
    
    RAISE NOTICE '✅ Transfert simulé avec succès';
END $$;

-- Vérifier le transfert
SELECT 
    m.nom_equipement,
    m.depot as depot_actuel,
    htm.depot_origine,
    htm.depot_destination,
    htm.date_transfert,
    htm.motif
FROM materiel m
JOIN historique_transferts_materiel htm ON m.id = htm.materiel_id
WHERE m.nom_equipement = 'TEST_ROUTEUR_AXECOM';

-- Test 7: Statistiques par dépôt
\echo ''
\echo '7. Statistiques par dépôt...'
SELECT 
    depot,
    COUNT(*) as nombre_materiels,
    SUM(quantite) as quantite_totale,
    SUM(COALESCE(prix_unitaire, 0) * quantite) as valeur_totale
FROM materiel
GROUP BY depot
ORDER BY depot;

-- Test 8: Vérifier les index
\echo ''
\echo '8. Vérification des index...'
SELECT 
    indexname,
    tablename,
    CASE 
        WHEN indexname LIKE '%depot%' THEN '✅'
        ELSE '  '
    END as test_depot
FROM pg_indexes
WHERE tablename IN ('materiel', 'historique_transferts_materiel')
    AND schemaname = 'public'
ORDER BY tablename, indexname;

-- Test 9: Test de constraint (doit échouer)
\echo ''
\echo '9. Test de validation (dépôt invalide - doit échouer)...'
DO $$
BEGIN
    INSERT INTO materiel (nom_equipement, type_materiel, depot, quantite)
    VALUES ('TEST_INVALIDE', 'Test', 'AUTRE', 1);
    
    RAISE NOTICE '❌ ERREUR: Constraint pas appliquée';
EXCEPTION 
    WHEN check_violation THEN
        RAISE NOTICE '✅ Validation correcte: dépôt invalide rejeté';
END $$;

-- Test 10: Nettoyage des données de test
\echo ''
\echo '10. Nettoyage des données de test...'
DELETE FROM materiel WHERE nom_equipement LIKE 'TEST_%';
\echo '✅ Données de test supprimées'

-- Résumé final
\echo ''
\echo '====================================='
\echo 'RÉSUMÉ DES TESTS'
\echo '====================================='
\echo ''

SELECT 
    'Colonne depot' as composant,
    CASE WHEN COUNT(*) > 0 THEN '✅ OK' ELSE '❌ ERREUR' END as statut
FROM information_schema.columns 
WHERE table_name = 'materiel' AND column_name = 'depot'

UNION ALL

SELECT 
    'Table historique',
    CASE WHEN COUNT(*) > 0 THEN '✅ OK' ELSE '❌ ERREUR' END
FROM information_schema.tables 
WHERE table_name = 'historique_transferts_materiel'

UNION ALL

SELECT 
    'Index depot',
    CASE WHEN COUNT(*) > 0 THEN '✅ OK' ELSE '❌ ERREUR' END
FROM pg_indexes
WHERE indexname = 'idx_materiel_depot'

UNION ALL

SELECT 
    'Contraintes',
    CASE WHEN COUNT(*) > 0 THEN '✅ OK' ELSE '❌ ERREUR' END
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%depot%';

\echo ''
\echo '====================================='
\echo 'TESTS TERMINÉS'
\echo '====================================='
