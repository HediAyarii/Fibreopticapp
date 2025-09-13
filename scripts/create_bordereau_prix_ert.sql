-- Table pour le bordereau de prix ERT
CREATE TABLE IF NOT EXISTS bordereau_prix_ert (
    id SERIAL PRIMARY KEY,
    article TEXT UNIQUE NOT NULL,
    intitule TEXT NOT NULL,
    unite TEXT NOT NULL,
    pu_ht_euros DECIMAL(10,2) NOT NULL,
    description TEXT,
    categorie TEXT, -- intervention, bonus, penalite, etc.
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_bordereau_prix_ert_article ON bordereau_prix_ert(article);
CREATE INDEX IF NOT EXISTS idx_bordereau_prix_ert_categorie ON bordereau_prix_ert(categorie);
CREATE INDEX IF NOT EXISTS idx_bordereau_prix_ert_actif ON bordereau_prix_ert(actif);

-- Insertion des données du bordereau de prix ERT
INSERT INTO bordereau_prix_ert (article, intitule, unite, pu_ht_euros, categorie) VALUES
-- Interventions de base
('RECOIP', 'Reconnexion Immeuble ou Pavillon', 'Unité', 40.00, 'intervention'),
('RACHI', 'Forfait immeuble – y compris kit – sans mise en service', 'Unité', 75.00, 'intervention'),
('RACPAV', 'Forfait pavillon – y compris kit – sans mise en service', 'Unité', 140.00, 'intervention'),
('CLEM', 'Mise en service des équipements de l''abonné et validation des services (TV, Internet, téléphone…)', 'Unité', 5.00, 'intervention'),
('RACPRO_S', 'Raccordement B2B FTTB et FTTH (simple)', 'Unité', 195.00, 'intervention'),
('RACPRO_C', 'Raccordement B2B FTTB et FTTH (complexe)', 'Unité', 245.00, 'intervention'),

-- Plus-values câble pavillon
('CABLE_PAV_1', 'Plus value par tranche de 50 ml au-delà de 100 ml', 'Unité', 20.00, 'plus_value'),
('CABLE_PAV_2', 'Plus value par tranche de 100 ml au-delà de 100 ml', 'Unité', 40.00, 'plus_value'),
('CABLE_PAV_3', 'Plus value par tranche de 150 ml au-delà de 100 ml', 'Unité', 60.00, 'plus_value'),
('CABLE_PAV_4', 'Plus value par tranche de 200 ml au-delà de 100 ml', 'Unité', 80.00, 'plus_value'),
('CABLE_PAV_SL', 'Plus-value longueur câble pavillon au ml, linéaires au-delà de 300 m', 'ml', 0.30, 'plus_value'),

-- Réparations
('REPFOU_ASPHA', 'Réparation/débouchage de fourreau sous asphalte, enrobé ou béton', 'Unité', 450.00, 'reparation'),
('REPFOU_PUB', 'Réparation/débouchage fourreau en terrain naturel, domaine public', 'Unité', 200.00, 'reparation'),
('REPFOU_PRI', 'Réparation/débouchage fourreau en terrain naturel, domaine privé', 'Unité', 200.00, 'reparation'),

-- Services additionnels
('DEMO', 'Démonstration des services (TV, décodeur, VOD, replay, etc.)', 'Unité', 10.00, 'service'),
('REFRAC', 'Réfection/modification du raccordement existant hors garantie (2 ans)', 'Unité', 50.00, 'service'),
('DEPLPRISE', 'Déplacement de prise à la demande de l''abonné', 'Unité', 40.00, 'service'),
('REFC_DGR', 'Réfection installation suite à dégradation client', 'Unité', 50.00, 'service'),

-- Bonus SAV
('SAV_REPEAT', 'Bonus challenge – Repeat SAV inf. à 18%', 'Unité', 2.50, 'bonus'),
('SAV_REPARATION_VOISIN', 'Bonus challenge – Taux réparation voisinage sup. à 70%', 'Unité', 2.50, 'bonus'),
('SAV_CASSE_VOISIN', 'Bonus challenge – Taux casse voisinage inf. à 3%', 'Unité', 2.50, 'bonus'),
('SAV_R_SUR_P', 'Bonus si 2 critères atteints parmi SAV_REPEAT, SAV_RÉPARATION_VOISIN, etc.', 'Unité', 2.50, 'bonus'),
('BONUS_SAV_2AT', 'Bonus appliqué si 2 critères atteints parmi SAV_REPEAT – SAV VOISIN', 'Unité', 5.00, 'bonus'),
('BONUS_SAV_4AT', 'Bonus appliqué si 4 critères SAV atteints (cumulable avec BONUS_SAV 2AT)', 'Unité', 5.00, 'bonus'),

-- Pénalités
('PEN_INS', 'Pénalité : Résiliation client suite instance non traitée', 'Unité', -200.00, 'penalite'),
('PEN_RES', 'Pénalité : Résiliation client suite instance non traitée', 'Unité', -358.00, 'penalite'),
('PEN_SURL', 'Déclaration sur-longueur erronée', 'Unité', 0.00, 'penalite'),
('PEN_REC_7j', 'Réclamation traitée hors délai (7 jours)', 'Semaine', -200.00, 'penalite'),
('PEN_A_TORT', 'Pénalité clôture en succès à tort', 'Unité', -400.00, 'penalite'),
('PEN_NON_HONORE', 'Pénalité rendez-vous non honoré sans prévenance', 'Unité', -200.00, 'penalite'),
('PEN_MALFA', 'Pénalité suite à malfaçon / non-respect procédure', 'Unité', -200.00, 'penalite'),
('PEN_NON_CLOS', 'Pénalité suite à rdv non-clos 24h ou report technicien', 'Unité', -66.00, 'penalite'),
('PEN_EXPLOIT', 'Pénalité suite à intervention non conforme (étiquetage, photo, etc.)', 'Unité', -66.00, 'penalite'),
('PEN_FIBRE_NON_CONFORME', 'Fibre non conforme au cahier des charges ERT/Altice', 'Unité', -200.00, 'penalite'),

-- Services spéciaux
('NACELLE', 'Mise à disposition nacelle avec chauffeur (30 min max)', 'Unité', -50.00, 'service_special'),
('SINISTRE', 'Refacturation frais réels (litige non traité par prestataire)', 'Frais réels', 0.00, 'service_special')
ON CONFLICT (article) DO UPDATE SET
    intitule = EXCLUDED.intitule,
    unite = EXCLUDED.unite,
    pu_ht_euros = EXCLUDED.pu_ht_euros,
    categorie = EXCLUDED.categorie,
    updated_at = CURRENT_TIMESTAMP;
