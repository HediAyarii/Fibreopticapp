-- ====================================================================
-- SCRIPT D'OPTIMISATION : AJOUT D'INDEX POUR AMÉLIORER LES PERFORMANCES
-- ====================================================================
-- Date: 2025-11-04
-- Objectif: Réduire les temps de réponse de 50-70%
-- ====================================================================

-- Désactiver les notices pour une sortie plus propre
SET client_min_messages TO WARNING;

BEGIN;

-- ====================================================================
-- 1. TABLE: interventions (table la plus sollicitée)
-- ====================================================================

-- Index sur le statut (filtré dans presque toutes les requêtes)
DROP INDEX IF EXISTS idx_interventions_statut;
CREATE INDEX idx_interventions_statut ON interventions(statut)
WHERE statut IS NOT NULL;
COMMENT ON INDEX idx_interventions_statut IS 'Optimise les filtres par statut (CLOTURE TERMINEE, etc.)';

-- Index sur les noms de techniciens (jointures fréquentes avec employes)
DROP INDEX IF EXISTS idx_interventions_technicien;
CREATE INDEX idx_interventions_technicien ON interventions(nom_technicien, prenom_technicien)
WHERE nom_technicien IS NOT NULL;
COMMENT ON INDEX idx_interventions_technicien IS 'Optimise les jointures avec la table employes';

-- Index sur date_rdv (tri et filtres par date)
DROP INDEX IF EXISTS idx_interventions_date_rdv;
CREATE INDEX idx_interventions_date_rdv ON interventions(date_rdv)
WHERE date_rdv IS NOT NULL AND date_rdv != '' AND date_rdv != 'nan';
COMMENT ON INDEX idx_interventions_date_rdv IS 'Optimise les filtres et tris par date de RDV';

-- Index sur cloture_tech (utilisé pour les calculs de revenu)
DROP INDEX IF EXISTS idx_interventions_cloture_tech;
CREATE INDEX idx_interventions_cloture_tech ON interventions(cloture_tech)
WHERE cloture_tech IS NOT NULL AND cloture_tech != '' AND cloture_tech != 'nan';
COMMENT ON INDEX idx_interventions_cloture_tech IS 'Optimise les requêtes de revenu par date de clôture';

-- Index sur cloture_hotline
DROP INDEX IF EXISTS idx_interventions_cloture_hotline;
CREATE INDEX idx_interventions_cloture_hotline ON interventions(cloture_hotline)
WHERE cloture_hotline IS NOT NULL AND cloture_hotline != '' AND cloture_hotline != 'nan';
COMMENT ON INDEX idx_interventions_cloture_hotline IS 'Optimise les requêtes de revenu par date de clôture hotline';

-- Index sur type_intervention (utilisé dans revenue-calculation)
DROP INDEX IF EXISTS idx_interventions_type;
CREATE INDEX idx_interventions_type ON interventions(type_intervention)
WHERE type_intervention IS NOT NULL;
COMMENT ON INDEX idx_interventions_type IS 'Optimise les filtres par type (FTTH, ADSL, etc.)';

-- Index sur grille (filtrage ERT vs AXECOM)
DROP INDEX IF EXISTS idx_interventions_grille;
CREATE INDEX idx_interventions_grille ON interventions(grille)
WHERE grille IS NOT NULL;
COMMENT ON INDEX idx_interventions_grille IS 'Optimise les filtres par grille tarifaire';

-- Index composite pour revenue-calculation (requête complexe)
DROP INDEX IF EXISTS idx_interventions_revenue_calc;
CREATE INDEX idx_interventions_revenue_calc ON interventions(statut, type_intervention, articles)
WHERE statut = 'CLOTURE TERMINEE' AND articles IS NOT NULL AND articles != '';
COMMENT ON INDEX idx_interventions_revenue_calc IS 'Optimise la requête de calcul des revenus';

-- Index sur num_inter pour les recherches rapides
DROP INDEX IF EXISTS idx_interventions_num_inter;
CREATE INDEX idx_interventions_num_inter ON interventions(num_inter);
COMMENT ON INDEX idx_interventions_num_inter IS 'Optimise les recherches par numéro d intervention';

-- ====================================================================
-- 2. TABLE: carburant_consommation
-- ====================================================================

-- Index sur date_livraison (filtres de dates fréquents)
DROP INDEX IF EXISTS idx_carburant_date_livraison;
CREATE INDEX idx_carburant_date_livraison ON carburant_consommation(date_livraison)
WHERE date_livraison IS NOT NULL;
COMMENT ON INDEX idx_carburant_date_livraison IS 'Optimise les filtres par date de livraison';

-- Index sur numero_carte (jointure avec carburant_assignations)
DROP INDEX IF EXISTS idx_carburant_numero_carte;
CREATE INDEX idx_carburant_numero_carte ON carburant_consommation(numero_carte)
WHERE numero_carte IS NOT NULL;
COMMENT ON INDEX idx_carburant_numero_carte IS 'Optimise les jointures avec carburant_assignations';

-- Index sur employe_assigné (filtres par employé)
DROP INDEX IF EXISTS idx_carburant_employe;
CREATE INDEX idx_carburant_employe ON carburant_consommation(employe_assigné)
WHERE employe_assigné IS NOT NULL;
COMMENT ON INDEX idx_carburant_employe IS 'Optimise les filtres par employé assigné';

-- Index sur immatriculation (recherche de véhicules)
DROP INDEX IF EXISTS idx_carburant_immat;
CREATE INDEX idx_carburant_immat ON carburant_consommation(immat_vehicule)
WHERE immat_vehicule IS NOT NULL;
COMMENT ON INDEX idx_carburant_immat IS 'Optimise les recherches par immatriculation';

-- Index composite pour l'historique (requête fréquente)
DROP INDEX IF EXISTS idx_carburant_historique;
CREATE INDEX idx_carburant_historique ON carburant_consommation(date_livraison, numero_carte, employe_assigné)
WHERE date_livraison IS NOT NULL;
COMMENT ON INDEX idx_carburant_historique IS 'Optimise les requêtes d historique de consommation';

-- ====================================================================
-- 3. TABLE: carburant_assignations
-- ====================================================================

-- Index sur carte_id (jointure principale)
DROP INDEX IF EXISTS idx_assignations_carte;
CREATE INDEX idx_assignations_carte ON carburant_assignations(carte_id)
WHERE carte_id IS NOT NULL;
COMMENT ON INDEX idx_assignations_carte IS 'Optimise les jointures par numéro de carte';

-- Index sur employe_id (filtres par employé)
DROP INDEX IF EXISTS idx_assignations_employe;
CREATE INDEX idx_assignations_employe ON carburant_assignations(employe_id)
WHERE employe_id IS NOT NULL;
COMMENT ON INDEX idx_assignations_employe IS 'Optimise les filtres par employé';

-- Index sur date_assignation et date_fin pour la logique d'assignation
DROP INDEX IF EXISTS idx_assignations_dates;
CREATE INDEX idx_assignations_dates ON carburant_assignations(date_assignation, date_fin);
COMMENT ON INDEX idx_assignations_dates IS 'Optimise la logique de recherche des assignations par dates';

-- ====================================================================
-- 4. TABLE: employes
-- ====================================================================

-- Index sur nom et prenom (jointure avec interventions)
DROP INDEX IF EXISTS idx_employes_nom_prenom;
CREATE INDEX idx_employes_nom_prenom ON employes(nom, prenom)
WHERE nom IS NOT NULL;
COMMENT ON INDEX idx_employes_nom_prenom IS 'Optimise les jointures avec interventions par nom';

-- Index sur nom seul (recherche)
DROP INDEX IF EXISTS idx_employes_nom;
CREATE INDEX idx_employes_nom ON employes(LOWER(nom));
COMMENT ON INDEX idx_employes_nom IS 'Optimise les recherches case-insensitive par nom';

-- Index sur prenom seul (recherche)
DROP INDEX IF EXISTS idx_employes_prenom;
CREATE INDEX idx_employes_prenom ON employes(LOWER(prenom));
COMMENT ON INDEX idx_employes_prenom IS 'Optimise les recherches case-insensitive par prénom';

-- Index sur matricule (clé unique métier)
DROP INDEX IF EXISTS idx_employes_matricule;
CREATE INDEX idx_employes_matricule ON employes(matricule)
WHERE matricule IS NOT NULL;
COMMENT ON INDEX idx_employes_matricule IS 'Optimise les recherches par matricule';

-- Index sur statut (filtrer actifs/inactifs)
DROP INDEX IF EXISTS idx_employes_statut;
CREATE INDEX idx_employes_statut ON employes(statut)
WHERE statut IS NOT NULL;
COMMENT ON INDEX idx_employes_statut IS 'Optimise les filtres par statut employé';

-- ====================================================================
-- 5. TABLE: company_pricing (table de référence)
-- ====================================================================

-- Index composite pour les jointures de pricing
DROP INDEX IF EXISTS idx_pricing_lookup;
CREATE INDEX idx_pricing_lookup ON company_pricing(service_code, company_name, category)
WHERE service_code IS NOT NULL;
COMMENT ON INDEX idx_pricing_lookup IS 'Optimise les lookups de prix dans revenue-calculation';

-- Index sur service_code seul
DROP INDEX IF EXISTS idx_pricing_service;
CREATE INDEX idx_pricing_service ON company_pricing(service_code);
COMMENT ON INDEX idx_pricing_service IS 'Optimise les recherches par code service';

-- Index sur company_name
DROP INDEX IF EXISTS idx_pricing_company;
CREATE INDEX idx_pricing_company ON company_pricing(company_name);
COMMENT ON INDEX idx_pricing_company IS 'Optimise les filtres par entreprise';

-- ====================================================================
-- 6. TABLE: penalites
-- ====================================================================

-- Index sur employe_id (jointure principale)
DROP INDEX IF EXISTS idx_penalites_employe;
CREATE INDEX idx_penalites_employe ON penalites(employe_id)
WHERE employe_id IS NOT NULL;
COMMENT ON INDEX idx_penalites_employe IS 'Optimise les jointures par employé';

-- Index sur date_penalite (tri et filtres)
DROP INDEX IF EXISTS idx_penalites_date;
CREATE INDEX idx_penalites_date ON penalites(date_penalite)
WHERE date_penalite IS NOT NULL;
COMMENT ON INDEX idx_penalites_date IS 'Optimise les tris et filtres par date';

-- Index sur statut
DROP INDEX IF EXISTS idx_penalites_statut;
CREATE INDEX idx_penalites_statut ON penalites(statut)
WHERE statut IS NOT NULL;
COMMENT ON INDEX idx_penalites_statut IS 'Optimise les filtres par statut de pénalité';

-- ====================================================================
-- 7. TABLE: reclamations
-- ====================================================================

-- Index sur employe_id
DROP INDEX IF EXISTS idx_reclamations_employe;
CREATE INDEX idx_reclamations_employe ON reclamations(employe_id)
WHERE employe_id IS NOT NULL;
COMMENT ON INDEX idx_reclamations_employe IS 'Optimise les jointures par employé';

-- Index sur date_reclamation
DROP INDEX IF EXISTS idx_reclamations_date;
CREATE INDEX idx_reclamations_date ON reclamations(date_reclamation)
WHERE date_reclamation IS NOT NULL;
COMMENT ON INDEX idx_reclamations_date IS 'Optimise les tris et filtres par date';

-- Index sur statut
DROP INDEX IF EXISTS idx_reclamations_statut;
CREATE INDEX idx_reclamations_statut ON reclamations(statut)
WHERE statut IS NOT NULL;
COMMENT ON INDEX idx_reclamations_statut IS 'Optimise les filtres par statut de réclamation';

-- ====================================================================
-- 8. TABLE: materiel
-- ====================================================================

-- Index sur nom_equipement (recherche)
DROP INDEX IF EXISTS idx_materiel_nom;
CREATE INDEX idx_materiel_nom ON materiel(nom_equipement)
WHERE nom_equipement IS NOT NULL;
COMMENT ON INDEX idx_materiel_nom IS 'Optimise les recherches par nom d équipement';

-- Index sur statut
DROP INDEX IF EXISTS idx_materiel_statut;
CREATE INDEX idx_materiel_statut ON materiel(statut)
WHERE statut IS NOT NULL;
COMMENT ON INDEX idx_materiel_statut IS 'Optimise les filtres par statut matériel';

-- ====================================================================
-- 9. TABLE: affectations_materiel
-- ====================================================================

-- Index sur employe_id
DROP INDEX IF EXISTS idx_affectations_employe;
CREATE INDEX idx_affectations_employe ON affectations_materiel(employe_id)
WHERE employe_id IS NOT NULL;
COMMENT ON INDEX idx_affectations_employe IS 'Optimise les jointures par employé';

-- Index sur materiel_id
DROP INDEX IF EXISTS idx_affectations_materiel;
CREATE INDEX idx_affectations_materiel ON affectations_materiel(materiel_id)
WHERE materiel_id IS NOT NULL;
COMMENT ON INDEX idx_affectations_materiel IS 'Optimise les jointures par matériel';

-- Index sur date_affectation
DROP INDEX IF EXISTS idx_affectations_date;
CREATE INDEX idx_affectations_date ON affectations_materiel(date_affectation)
WHERE date_affectation IS NOT NULL;
COMMENT ON INDEX idx_affectations_date IS 'Optimise les tris par date d affectation';

-- ====================================================================
-- ANALYSE ET STATISTIQUES
-- ====================================================================

-- Mettre à jour les statistiques pour optimiser le query planner
ANALYZE interventions;
ANALYZE carburant_consommation;
ANALYZE carburant_assignations;
ANALYZE employes;
ANALYZE company_pricing;
ANALYZE penalites;
ANALYZE reclamations;
ANALYZE materiel;
ANALYZE affectations_materiel;

COMMIT;

-- ====================================================================
-- AFFICHAGE DES INDEX CRÉÉS
-- ====================================================================

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ====================================================================
-- RÉSUMÉ
-- ====================================================================

DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public' AND indexname LIKE 'idx_%';
    
    RAISE NOTICE '✅ Script d''optimisation terminé avec succès!';
    RAISE NOTICE '📊 Total d''index créés: %', index_count;
    RAISE NOTICE '🚀 Amélioration des performances estimée: 50-70%%';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Prochaines étapes recommandées:';
    RAISE NOTICE '   1. Surveiller les performances avec EXPLAIN ANALYZE';
    RAISE NOTICE '   2. Activer pg_stat_statements pour le monitoring';
    RAISE NOTICE '   3. Configurer autovacuum pour maintenir les statistiques';
END $$;
