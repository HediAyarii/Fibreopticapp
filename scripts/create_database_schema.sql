-- Creating database schema for interventions and fuel consumption
-- Table for interventions data
CREATE TABLE IF NOT EXISTS interventions (
    id SERIAL PRIMARY KEY,
    date_rdv TEXT,
    region TEXT,
    plaque TEXT,
    societe TEXT,
    nom_technicien TEXT,
    prenom_technicien TEXT,
    debut TEXT,
    duree TEXT,
    type_intervention TEXT,
    sav24 TEXT,
    sav_rouge TEXT,
    client TEXT,
    num_inter TEXT, -- Allow duplicates with different dates
    commande_id TEXT,
    statut TEXT,
    cloture_hotline TEXT,
    cloture_tech TEXT,
    debut_intervention TEXT,
    non_clos_pda TEXT,
    creneau_plus_2h TEXT,
    articles TEXT,
    garantie TEXT,
    motif_echec TEXT,
    echec_niveau_1 TEXT,
    echec_niveau_2 TEXT,
    panne_reseau TEXT,
    commentaires_technicien TEXT,
    commentaires_cloture TEXT,
    num_abonne TEXT,
    nom_abonne TEXT,
    numero TEXT,
    rue TEXT,
    mobile TEXT,
    domicile TEXT,
    bureau TEXT,
    voip TEXT,
    code_postal TEXT,
    ville TEXT,
    id_osiris TEXT,
    tap_fttla TEXT,
    noeud TEXT,
    numero_efacture TEXT,
    montant_efacture TEXT,
    sav_apres_sav TEXT,
    drapeau TEXT,
    type_logement TEXT,
    codes_secondaires TEXT,
    motif_delai_wig TEXT,
    dernier_rdv TEXT,
    occurences_abo_90_jours TEXT,
    gestionnaire_infra TEXT,
    idra TEXT,
    cause_sav TEXT,
    action_sav TEXT,
    longueur_cable TEXT,
    infos_racco_pavillon TEXT,
    type_pbo TEXT,
    nom_sro TEXT,
    be1 TEXT,
    ref_pbo TEXT,
    type_operation TEXT,
    type_habitation TEXT,
    ref_ephem TEXT,
    activite TEXT,
    statut_wig TEXT,
    raison_sociale TEXT,
    type_offre_ref TEXT,
    type_offre_lib TEXT,
    type_pon TEXT,
    marque TEXT,
    marque_gp TEXT,
    grille TEXT,
    commentaire_modif_echec TEXT,
    id_immeuble TEXT,
    ndi_contrat TEXT,
    sct TEXT,
    affectation_bpi_vertical_1 TEXT,
    affectation_bpi_horizontale TEXT,
    ref_prise TEXT,
    statut_box_4g TEXT,
    presta_precedent_succes TEXT,
    tech_precedent_succes TEXT,
    liste_prestations_realisees TEXT,
    prise_existante TEXT,
    nb_echange_materiel TEXT,
    commentaire_inter TEXT,
    inter_prioritaire TEXT,
    gem TEXT,
    transfo_cable TEXT,
    a_securiser TEXT,
    vip TEXT,
    decharge_check_voisinage TEXT,
    inter_cloturee_par TEXT,
    decharge_blocage_jy_suis TEXT,
    deblocage_blocage_jy_suis_par TEXT,
    check_voisinage TEXT,
    numero_ig_pr TEXT,
    note_gem TEXT,
    parcours_type TEXT,
    parcours_lib TEXT,
    reco_racc TEXT,
    date_racc TEXT,
    dernier_gem TEXT,
    motif_decharge TEXT,
    lignes_dechargees TEXT,
    commentaire_decharge TEXT,
    date_import TEXT,
    ref_maestro TEXT,
    ref_cmd TEXT,
    categorie_rdv TEXT,
    date_1er_rdv TEXT,
    presence_amiante TEXT,
    fil_nu TEXT,
    flag_bot TEXT,
    flag_appel_hors_presence_client TEXT,
    sav_regroupe TEXT,
    sav_rattachement TEXT,
    idur TEXT,
    adresse_pm TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for employees data
CREATE TABLE IF NOT EXISTS employes (
    id SERIAL PRIMARY KEY,
    matricule TEXT UNIQUE, -- Employee ID number
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    email TEXT UNIQUE,
    telephone TEXT,
    poste TEXT, -- Job position
    departement TEXT,
    manager_id INTEGER REFERENCES employes(id), -- Self-reference for hierarchy
    date_embauche DATE,
    statut TEXT DEFAULT 'actif', -- actif, inactif, suspendu
    niveau_acces TEXT DEFAULT 'technicien', -- technicien, chef_equipe, superadmin
    region TEXT,
    plaque_vehicule TEXT,
    numero_carte_carburant TEXT,
    salaire_base DECIMAL(10,2),
    taux_horaire DECIMAL(8,2),
    pourcentage_taxe DECIMAL(5,2) DEFAULT 0.00,
    heures_travaillees DECIMAL(5,2) DEFAULT 0,
    heures_supplementaires DECIMAL(5,2) DEFAULT 0,
    prime_performance DECIMAL(8,2) DEFAULT 0,
    penalites_total DECIMAL(8,2) DEFAULT 0,
    notes_performance TEXT,
    competences TEXT[], -- Array of skills
    certifications TEXT[], -- Array of certifications
    date_derniere_evaluation DATE,
    commentaires TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for fuel consumption data
CREATE TABLE IF NOT EXISTS carburant_consommation (
    id SERIAL PRIMARY KEY,
    date_fact TEXT,
    date_livraison TEXT,
    heure_livraison TEXT,
    immat_vehicule TEXT,
    numero_carte TEXT,
    km TEXT,
    poste_1 TEXT,
    poste_2 TEXT,
    pays TEXT,
    numero_station TEXT,
    point_acceptation TEXT,
    identifiant_autoroute TEXT,
    cp TEXT,
    type_marchandises TEXT,
    quantite TEXT,
    taux_tva TEXT,
    ca_ht TEXT,
    tva TEXT,
    ca_ttc TEXT,
    numero_justificatif TEXT UNIQUE, -- Unique constraint to prevent duplicates
    employe_assigné INTEGER REFERENCES employes(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for complaints/reclamations
CREATE TABLE IF NOT EXISTS reclamations (
    id SERIAL PRIMARY KEY,
    numero_reclamation TEXT UNIQUE, -- Unique complaint number
    date_reclamation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    type_reclamation TEXT, -- technique, service, facturation, autre
    priorite TEXT DEFAULT 'normale', -- basse, normale, haute, critique
    statut TEXT DEFAULT 'ouverte', -- ouverte, en_cours, resolue, fermee, annulee
    client_id TEXT,
    nom_client TEXT,
    telephone_client TEXT,
    email_client TEXT,
    adresse_client TEXT,
    intervention_id INTEGER REFERENCES interventions(id), -- Link to intervention if related
    employe_id INTEGER REFERENCES employes(id), -- Assigned employee
    technicien_responsable TEXT,
    description_probleme TEXT NOT NULL,
    description_solution TEXT,
    date_resolution TIMESTAMP,
    temps_resolution INTEGER, -- Resolution time in minutes
    satisfaction_client INTEGER CHECK (satisfaction_client >= 1 AND satisfaction_client <= 5), -- 1-5 scale
    commentaires_client TEXT,
    commentaires_internes TEXT,
    cout_reclamation DECIMAL(8,2) DEFAULT 0,
    indemnisation DECIMAL(8,2) DEFAULT 0,
    materiel_defectueux TEXT,
    garantie_applicable BOOLEAN DEFAULT FALSE,
    escalade_requise BOOLEAN DEFAULT FALSE,
    manager_notifie BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for equipment/materiel
CREATE TABLE IF NOT EXISTS materiel (
    id SERIAL PRIMARY KEY,
    numero_serie TEXT UNIQUE, -- Serial number
    nom_equipement TEXT NOT NULL,
    type_materiel TEXT NOT NULL, -- routeur, modem, cable, outil, vehicule, autre
    marque TEXT,
    modele TEXT,
    statut TEXT DEFAULT 'disponible', -- disponible, utilise, en_maintenance, defectueux, perdu, vole
    localisation TEXT, -- depot, vehicule, chez_client, maintenance
    quantite INTEGER DEFAULT 1, -- Stock quantity
    date_acquisition DATE,
    cout_acquisition DECIMAL(10,2),
    garantie_jusqu_a DATE,
    maintenance_derniere DATE,
    maintenance_prochaine DATE,
    kilometrage_vehicule INTEGER DEFAULT 0, -- For vehicles
    consommation_carburant DECIMAL(5,2), -- L/100km for vehicles
    capacite_reservoir DECIMAL(5,2), -- Liters for vehicles
    niveau_carburant DECIMAL(5,2), -- Current fuel level
    etat_general TEXT, -- excellent, bon, moyen, mauvais
    notes_maintenance TEXT,
    accessoires_inclus TEXT[], -- Array of accessories
    certificats_conformite TEXT[], -- Array of compliance certificates
    photos TEXT[], -- Array of photo URLs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for penalties/penalites
CREATE TABLE IF NOT EXISTS penalites (
    id SERIAL PRIMARY KEY,
    numero_penalite TEXT UNIQUE, -- Unique penalty number
    date_penalite TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    employe_id INTEGER REFERENCES employes(id) NOT NULL,
    type_penalite TEXT NOT NULL, -- retard, absence, erreur_technique, comportement, autre
    motif TEXT NOT NULL,
    montant DECIMAL(8,2) NOT NULL,
    statut TEXT DEFAULT 'active', -- active, annulee, remboursee
    date_echeance DATE,
    date_paiement TIMESTAMP,
    methode_paiement TEXT, -- prelevement, virement, especes
    reference_paiement TEXT,
    manager_approbateur TEXT,
    commentaires TEXT,
    intervention_concernee INTEGER REFERENCES interventions(id),
    reclamation_concernee INTEGER REFERENCES reclamations(id),
    materiel_concerne INTEGER REFERENCES materiel(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for material assignments to employees
CREATE TABLE IF NOT EXISTS affectations_materiel (
    id SERIAL PRIMARY KEY,
    materiel_id INTEGER REFERENCES materiel(id) NOT NULL,
    employe_id INTEGER REFERENCES employes(id) NOT NULL,
    quantite_assignee INTEGER NOT NULL DEFAULT 1,
    date_affectation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_retour TIMESTAMP,
    statut TEXT DEFAULT 'active', -- active, retourne, perdu
    commentaires TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for better performance on frequent queries
CREATE INDEX IF NOT EXISTS idx_interventions_num_inter ON interventions(num_inter);
CREATE INDEX IF NOT EXISTS idx_interventions_technicien ON interventions(nom_technicien, prenom_technicien);
CREATE INDEX IF NOT EXISTS idx_interventions_date ON interventions(date_rdv);
CREATE INDEX IF NOT EXISTS idx_carburant_carte ON carburant_consommation(numero_carte);
CREATE INDEX IF NOT EXISTS idx_carburant_date ON carburant_consommation(date_livraison);

-- Index for new tables
CREATE INDEX IF NOT EXISTS idx_employes_matricule ON employes(matricule);
CREATE INDEX IF NOT EXISTS idx_employes_nom_prenom ON employes(nom, prenom);
CREATE INDEX IF NOT EXISTS idx_employes_departement ON employes(departement);
CREATE INDEX IF NOT EXISTS idx_employes_statut ON employes(statut);

CREATE INDEX IF NOT EXISTS idx_reclamations_numero ON reclamations(numero_reclamation);
CREATE INDEX IF NOT EXISTS idx_reclamations_statut ON reclamations(statut);
CREATE INDEX IF NOT EXISTS idx_reclamations_priorite ON reclamations(priorite);
CREATE INDEX IF NOT EXISTS idx_reclamations_date ON reclamations(date_reclamation);
CREATE INDEX IF NOT EXISTS idx_reclamations_employe ON reclamations(employe_id);

CREATE INDEX IF NOT EXISTS idx_penalites_employe ON penalites(employe_id);
CREATE INDEX IF NOT EXISTS idx_penalites_type ON penalites(type_penalite);
CREATE INDEX IF NOT EXISTS idx_penalites_statut ON penalites(statut);
CREATE INDEX IF NOT EXISTS idx_penalites_date ON penalites(date_penalite);

CREATE INDEX IF NOT EXISTS idx_materiel_numero_serie ON materiel(numero_serie);
CREATE INDEX IF NOT EXISTS idx_materiel_type ON materiel(type_materiel);
CREATE INDEX IF NOT EXISTS idx_materiel_statut ON materiel(statut);
CREATE INDEX IF NOT EXISTS idx_materiel_quantite ON materiel(quantite);

CREATE INDEX IF NOT EXISTS idx_affectations_materiel ON affectations_materiel(materiel_id);
CREATE INDEX IF NOT EXISTS idx_affectations_employe ON affectations_materiel(employe_id);
CREATE INDEX IF NOT EXISTS idx_affectations_statut ON affectations_materiel(statut);
CREATE INDEX IF NOT EXISTS idx_affectations_date ON affectations_materiel(date_affectation);

-- Unique constraint for interventions: Num Inter + Date RDV combination
CREATE UNIQUE INDEX IF NOT EXISTS interventions_num_inter_date_rdv_key ON interventions (num_inter, date_rdv);
