-- Table pour les coûts par salarié
CREATE TABLE IF NOT EXISTS cout_par_salaire (
    id SERIAL PRIMARY KEY,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    salaire_net DECIMAL(10,2) NOT NULL DEFAULT 0,
    salaire_brut DECIMAL(10,2) NOT NULL DEFAULT 0,
    cout_total DECIMAL(10,2) NOT NULL DEFAULT 0,
    charge DECIMAL(10,2) NOT NULL DEFAULT 0,
    mois INTEGER NOT NULL,
    annee INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_cout_par_salaire_mois_annee ON cout_par_salaire(mois, annee);
CREATE INDEX IF NOT EXISTS idx_cout_par_salaire_nom_prenom ON cout_par_salaire(nom, prenom);
CREATE INDEX IF NOT EXISTS idx_cout_par_salaire_date ON cout_par_salaire(annee, mois);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_cout_par_salaire_updated_at
    BEFORE UPDATE ON cout_par_salaire
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Commentaire sur la table
COMMENT ON TABLE cout_par_salaire IS 'Coûts par salarié avec répartition par mois et année';









