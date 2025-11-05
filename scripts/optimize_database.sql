-- ============================================
-- OPTIMISATION BASE DE DONNÉES - INDEX
-- Application FinalFibre
-- ============================================

-- Active l'affichage des informations
\echo '🚀 Début de l''optimisation de la base de données...'
\echo ''

-- ============================================
-- 1. INDEX POUR LA TABLE INTERVENTIONS
-- ============================================
\echo '📊 Création des index pour la table interventions...'

-- Index sur le statut (filtrage fréquent)
CREATE INDEX IF NOT EXISTS idx_interventions_statut 
ON interventions(statut);

-- Index sur les noms de techniciens (jointures fréquentes)
CREATE INDEX IF NOT EXISTS idx_interventions_technicien 
ON interventions(nom_technicien, prenom_technicien);

-- Index sur les dates (tri et filtrage)
CREATE INDEX IF NOT EXISTS idx_interventions_date_rdv 
ON interventions(date_rdv) 
WHERE date_rdv IS NOT NULL AND date_rdv != '' AND date_rdv != 'nan';

CREATE INDEX IF NOT EXISTS idx_interventions_cloture_tech 
ON interventions(cloture_tech) 
WHERE cloture_tech IS NOT NULL AND cloture_tech != '' AND cloture_tech != 'nan';

CREATE INDEX IF NOT EXISTS idx_interventions_cloture_hotline 
ON interventions(cloture_hotline) 
WHERE cloture_hotline IS NOT NULL AND cloture_hotline != '' AND cloture_hotline != 'nan';

-- Index sur le type d'intervention
CREATE INDEX IF NOT EXISTS idx_interventions_type 
ON interventions(type_intervention);

-- Index sur la grille (filtrage fréquent)
CREATE INDEX IF NOT EXISTS idx_interventions_grille 
ON interventions(grille);

-- Index sur les articles (recherche dans revenue calculation)
CREATE INDEX IF NOT EXISTS idx_interventions_articles 
ON interventions(articles) 
WHERE articles IS NOT NULL AND articles != '';

\echo '✅ Index interventions créés'
\echo ''

-- ============================================
-- 2. INDEX POUR LA TABLE CARBURANT_CONSOMMATION
-- ============================================
\echo '⛽ Création des index pour la table carburant_consommation...'

-- Index sur la date de livraison (filtrage très fréquent)
CREATE INDEX IF NOT EXISTS idx_carburant_date_livraison 
ON carburant_consommation(date_livraison);

-- Index sur le numéro de carte (filtrage et jointures)
CREATE INDEX IF NOT EXISTS idx_carburant_numero_carte 
ON carburant_consommation(numero_carte);

-- Index sur l'employé assigné (jointures)
CREATE INDEX IF NOT EXISTS idx_carburant_employe 
ON carburant_consommation(employe_assigné) 
WHERE employe_assigné IS NOT NULL;

-- Index sur le numéro de justificatif (unique, déjà existant mais on vérifie)
CREATE UNIQUE INDEX IF NOT EXISTS idx_carburant_numero_justificatif 
ON carburant_consommation(numero_justificatif);

-- Index composite pour les requêtes de consommation par employé
CREATE INDEX IF NOT EXISTS idx_carburant_employe_date 
ON carburant_consommation(employe_assigné, date_livraison) 
WHERE employe_assigné IS NOT NULL;

\echo '✅ Index carburant créés'
\echo ''

-- ============================================
-- 3. INDEX POUR LA TABLE CARBURANT_ASSIGNATIONS
-- ============================================
\echo '🔗 Création des index pour la table carburant_assignations...'

-- Index sur carte_id (jointures fréquentes)
CREATE INDEX IF NOT EXISTS idx_assignations_carte 
ON carburant_assignations(carte_id);

-- Index sur employe_id (jointures fréquentes)
CREATE INDEX IF NOT EXISTS idx_assignations_employe 
ON carburant_assignations(employe_id);

-- Index sur le statut
CREATE INDEX IF NOT EXISTS idx_assignations_statut 
ON carburant_assignations(statut);

-- Index composite pour les requêtes de période active
CREATE INDEX IF NOT EXISTS idx_assignations_periode 
ON carburant_assignations(date_assignation, date_fin, statut);

\echo '✅ Index assignations créés'
\echo ''

-- ============================================
-- 4. INDEX POUR LA TABLE EMPLOYES
-- ============================================
\echo '👥 Création des index pour la table employes...'

-- Index sur nom et prénom (jointures avec interventions)
CREATE INDEX IF NOT EXISTS idx_employes_nom_prenom 
ON employes(nom, prenom);

-- Index sur le matricule (clé métier)
CREATE INDEX IF NOT EXISTS idx_employes_matricule 
ON employes(matricule) 
WHERE matricule IS NOT NULL;

-- Index sur le statut (filtrage)
CREATE INDEX IF NOT EXISTS idx_employes_statut 
ON employes(statut) 
WHERE statut IS NOT NULL;

\echo '✅ Index employés créés'
\echo ''

-- ============================================
-- 5. INDEX POUR LA TABLE COMPANY_PRICING
-- ============================================
\echo '💰 Création des index pour la table company_pricing...'

-- Index composite pour les jointures dans revenue calculation
CREATE INDEX IF NOT EXISTS idx_pricing_lookup 
ON company_pricing(service_code, company_name, category);

-- Index sur service_code seul
CREATE INDEX IF NOT EXISTS idx_pricing_service_code 
ON company_pricing(service_code);

-- Index sur company_name
CREATE INDEX IF NOT EXISTS idx_pricing_company 
ON company_pricing(company_name);

\echo '✅ Index company_pricing créés'
\echo ''

-- ============================================
-- 6. INDEX POUR LA TABLE PENALITES
-- ============================================
\echo '⚠️ Création des index pour la table penalites...'

-- Index sur employe_id
CREATE INDEX IF NOT EXISTS idx_penalites_employe 
ON penalites(employe_id);

-- Index sur la date
CREATE INDEX IF NOT EXISTS idx_penalites_date 
ON penalites(date_penalite);

\echo '✅ Index pénalités créés'
\echo ''

-- ============================================
-- 7. INDEX POUR LA TABLE RECLAMATIONS
-- ============================================
\echo '📝 Création des index pour la table reclamations...'

-- Index sur employe_id
CREATE INDEX IF NOT EXISTS idx_reclamations_employe 
ON reclamations(employe_id);

-- Index sur la date
CREATE INDEX IF NOT EXISTS idx_reclamations_date 
ON reclamations(date_reclamation);

\echo '✅ Index réclamations créés'
\echo ''

-- ============================================
-- 8. AFFICHER LES STATISTIQUES DES INDEX
-- ============================================
\echo ''
\echo '📈 Statistiques des index créés:'
\echo ''

SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_indexes
JOIN pg_class ON pg_indexes.indexname = pg_class.relname
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================
-- 9. ANALYSE DES TABLES
-- ============================================
\echo ''
\echo '🔍 Analyse des tables pour mettre à jour les statistiques...'

ANALYZE interventions;
ANALYZE carburant_consommation;
ANALYZE carburant_assignations;
ANALYZE employes;
ANALYZE company_pricing;
ANALYZE penalites;
ANALYZE reclamations;

\echo '✅ Analyse terminée'
\echo ''

-- ============================================
-- FIN DE L'OPTIMISATION
-- ============================================
\echo '🎉 Optimisation de la base de données terminée avec succès!'
\echo ''
\echo 'Résumé:'
\echo '  - Index sur interventions: ✅'
\echo '  - Index sur carburant: ✅'
\echo '  - Index sur assignations: ✅'
\echo '  - Index sur employés: ✅'
\echo '  - Index sur pricing: ✅'
\echo '  - Index sur pénalités: ✅'
\echo '  - Index sur réclamations: ✅'
\echo '  - Statistiques mises à jour: ✅'
\echo ''
\echo '💡 Les performances des requêtes devraient être significativement améliorées!'
