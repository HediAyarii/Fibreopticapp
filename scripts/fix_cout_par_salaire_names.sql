-- ============================================================================
-- Script de correction automatique des noms dans cout_par_salaire
-- Utilise le MATRICULE comme clé de correspondance avec employes
-- ============================================================================

-- 1. Afficher l'état actuel (avant correction)
SELECT 
    '=== ÉTAT AVANT CORRECTION ===' as message,
    COUNT(*) as total,
    SUM(CASE WHEN employe_id IS NULL THEN 1 ELSE 0 END) as sans_employe_id,
    SUM(CASE WHEN employe_id IS NOT NULL THEN 1 ELSE 0 END) as avec_employe_id
FROM cout_par_salaire;

-- 2. Corriger les noms et prénoms en utilisant le MATRICULE
-- Les noms dans cout_par_salaire DOIVENT correspondre EXACTEMENT aux noms dans employes
UPDATE cout_par_salaire cps
SET 
    nom = e.nom,
    prenom = e.prenom,
    employe_id = e.id,
    updated_at = CURRENT_TIMESTAMP
FROM employes e
WHERE cps.matricule = e.matricule
AND cps.matricule IS NOT NULL
AND cps.matricule != ''
AND (
    cps.nom != e.nom 
    OR cps.prenom != e.prenom
    OR cps.employe_id IS NULL
    OR cps.employe_id != e.id
);

-- 3. Afficher les corrections effectuées
SELECT 
    '=== CORRECTIONS EFFECTUÉES ===' as message,
    cps.id,
    cps.matricule,
    cps.nom as nom_cout,
    cps.prenom as prenom_cout,
    e.nom as nom_employe,
    e.prenom as prenom_employe,
    cps.employe_id,
    cps.mois,
    cps.annee
FROM cout_par_salaire cps
JOIN employes e ON cps.matricule = e.matricule
WHERE cps.matricule IS NOT NULL
ORDER BY cps.updated_at DESC
LIMIT 20;

-- 4. Identifier les entrées SANS matricule qui ne peuvent pas être corrigées automatiquement
SELECT 
    '=== ENTRÉES SANS MATRICULE (CORRECTION MANUELLE REQUISE) ===' as message,
    cps.id,
    cps.nom,
    cps.prenom,
    cps.matricule,
    cps.mois,
    cps.annee,
    cps.employe_id
FROM cout_par_salaire cps
WHERE cps.matricule IS NULL OR cps.matricule = ''
ORDER BY cps.nom, cps.prenom;

-- 5. Afficher l'état final (après correction)
SELECT 
    '=== ÉTAT APRÈS CORRECTION ===' as message,
    COUNT(*) as total,
    SUM(CASE WHEN employe_id IS NULL THEN 1 ELSE 0 END) as sans_employe_id,
    SUM(CASE WHEN employe_id IS NOT NULL THEN 1 ELSE 0 END) as avec_employe_id,
    SUM(CASE 
        WHEN cps.matricule IS NOT NULL 
        AND EXISTS (
            SELECT 1 FROM employes e 
            WHERE e.matricule = cps.matricule 
            AND LOWER(e.nom) = LOWER(cps.nom) 
            AND LOWER(e.prenom) = LOWER(cps.prenom)
        ) THEN 1 
        ELSE 0 
    END) as noms_corrects
FROM cout_par_salaire cps;

-- 6. Vérifier la synchronisation avec employes
SELECT 
    '=== VÉRIFICATION FINALE ===' as message,
    CASE 
        WHEN e.id IS NULL THEN '❌ Employé introuvable'
        WHEN e.statut != 'actif' THEN '⚠️ Employé inactif'
        WHEN cps.nom != e.nom OR cps.prenom != e.prenom THEN '⚠️ Nom différent'
        ELSE '✅ OK'
    END as statut,
    COUNT(*) as nombre
FROM cout_par_salaire cps
LEFT JOIN employes e ON cps.matricule = e.matricule
WHERE cps.mois = 10 AND cps.annee = 2025
GROUP BY 
    CASE 
        WHEN e.id IS NULL THEN '❌ Employé introuvable'
        WHEN e.statut != 'actif' THEN '⚠️ Employé inactif'
        WHEN cps.nom != e.nom OR cps.prenom != e.prenom THEN '⚠️ Nom différent'
        ELSE '✅ OK'
    END
ORDER BY nombre DESC;
