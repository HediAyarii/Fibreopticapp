-- Table pour stocker les primes individuelles des employés
CREATE TABLE IF NOT EXISTS primes_employes (
    id SERIAL PRIMARY KEY,
    cout_par_salaire_id INTEGER NOT NULL REFERENCES cout_par_salaire(id) ON DELETE CASCADE,
    matricule VARCHAR(50),
    montant DECIMAL(10, 2) NOT NULL DEFAULT 0,
    note TEXT,
    deduit_rap BOOLEAN NOT NULL DEFAULT true,  -- true = se déduit du RAP, false = ne se déduit pas
    date_prime DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_primes_cout_par_salaire ON primes_employes(cout_par_salaire_id);
CREATE INDEX IF NOT EXISTS idx_primes_matricule ON primes_employes(matricule);

-- Fonction pour calculer le total des primes qui se déduisent du RAP
CREATE OR REPLACE FUNCTION calculer_total_primes_rap(p_cout_par_salaire_id INTEGER)
RETURNS DECIMAL(10, 2) AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(montant) FROM primes_employes 
         WHERE cout_par_salaire_id = p_cout_par_salaire_id AND deduit_rap = true),
        0
    );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer le total de toutes les primes
CREATE OR REPLACE FUNCTION calculer_total_primes(p_cout_par_salaire_id INTEGER)
RETURNS DECIMAL(10, 2) AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(montant) FROM primes_employes 
         WHERE cout_par_salaire_id = p_cout_par_salaire_id),
        0
    );
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le champ prime dans cout_par_salaire
CREATE OR REPLACE FUNCTION update_prime_total()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour le total des primes dans cout_par_salaire
    UPDATE cout_par_salaire 
    SET prime = calculer_total_primes(
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.cout_par_salaire_id 
            ELSE NEW.cout_par_salaire_id 
        END
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE id = CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.cout_par_salaire_id 
        ELSE NEW.cout_par_salaire_id 
    END;
    
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_update_prime_total ON primes_employes;
CREATE TRIGGER trigger_update_prime_total
AFTER INSERT OR UPDATE OR DELETE ON primes_employes
FOR EACH ROW EXECUTE FUNCTION update_prime_total();

-- Commentaires
COMMENT ON TABLE primes_employes IS 'Table des primes individuelles avec notes';
COMMENT ON COLUMN primes_employes.deduit_rap IS 'true = la prime se déduit du RAP, false = ne se déduit pas';
