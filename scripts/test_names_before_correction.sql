-- ============================================================================
-- TEST : Vérifier que les noms dans cout_par_salaire correspondent à employes
-- ============================================================================

-- 1. Afficher les différences AVANT correction
SELECT 
    '=== DIFFÉRENCES AVANT CORRECTION ===' as titre,
    cps.id,
    cps.matricule,
    '❌ cout_par_salaire' as source,
    cps.nom as nom_actuel,
    cps.prenom as prenom_actuel,
    '✅ employes (correct)' as devrait_etre,
    e.nom as nom_employe,
    e.prenom as prenom_employe
FROM cout_par_salaire cps
JOIN employes e ON cps.matricule = e.matricule
WHERE cps.matricule IS NOT NULL
AND e.statut = 'actif'
AND (cps.nom != e.nom OR cps.prenom != e.prenom)
ORDER BY cps.matricule;

-- 2. Exemple concret pour TECH_BARYA
SELECT 
    '=== EXEMPLE TECH_BARYA ===' as titre,
    'Matricule' as champ,
    'TECH_BARYA' as valeur
UNION ALL
SELECT 
    '',
    '📊 Dans employes (SOURCE DE VÉRITÉ)',
    e.nom || ' ' || e.prenom
FROM employes e WHERE e.matricule = 'TECH_BARYA'
UNION ALL
SELECT 
    '',
    '📝 Dans cout_par_salaire (AVANT)',
    cps.nom || ' ' || cps.prenom
FROM cout_par_salaire cps WHERE cps.matricule = 'TECH_BARYA' LIMIT 1;

-- 3. Compter combien d'entrées doivent être corrigées
SELECT 
    '=== STATISTIQUES ===' as titre,
    COUNT(*) as total_a_corriger,
    STRING_AGG(DISTINCT cps.matricule, ', ') as matricules_concernes
FROM cout_par_salaire cps
JOIN employes e ON cps.matricule = e.matricule
WHERE cps.matricule IS NOT NULL
AND e.statut = 'actif'
AND (cps.nom != e.nom OR cps.prenom != e.prenom);
