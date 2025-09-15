-- Script pour créer automatiquement des comptes techniciens pour tous les employés
-- Mot de passe par défaut: "password" (hashé avec bcrypt)

-- Supprimer les comptes existants
DELETE FROM technicien_accounts;

-- Créer des comptes pour tous les employés
INSERT INTO technicien_accounts (
    technicien_id,
    username,
    password_hash,
    is_active,
    is_locked,
    login_attempts,
    created_at
)
SELECT 
    e.id as technicien_id,
    LOWER(REPLACE(e.prenom || '_' || e.nom, ' ', '_')) as username,
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' as password_hash, -- "password" hashé
    true as is_active,
    false as is_locked,
    0 as login_attempts,
    NOW() as created_at
FROM employes e
WHERE e.id IS NOT NULL;

-- Afficher les comptes créés
SELECT 
    ta.id,
    ta.username,
    e.prenom,
    e.nom,
    e.matricule,
    ta.is_active,
    ta.is_locked,
    'password' as mot_de_passe_defaut
FROM technicien_accounts ta
JOIN employes e ON ta.technicien_id = e.id
ORDER BY e.prenom, e.nom;
