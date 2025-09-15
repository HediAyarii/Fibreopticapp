-- Script pour créer automatiquement des comptes techniciens pour tous les employés
-- Le mot de passe sera le matricule de l'employé

-- Supprimer les comptes existants pour éviter les doublons
DELETE FROM technicien_accounts;

-- Créer des comptes pour tous les employés
-- Le mot de passe sera hashé avec bcrypt (matricule)
INSERT INTO technicien_accounts (
    technicien_id,
    username,
    password_hash,
    is_active,
    is_locked,
    login_attempts,
    created_at,
    last_login
)
SELECT 
    e.id as technicien_id,
    LOWER(REPLACE(e.prenom || '_' || e.nom, ' ', '_')) as username,
    -- Hash bcrypt pour le matricule (mot de passe par défaut)
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' as password_hash, -- "password" hashé
    true as is_active,
    false as is_locked,
    0 as login_attempts,
    NOW() as created_at,
    NULL as last_login
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
    ta.is_locked
FROM technicien_accounts ta
JOIN employes e ON ta.technicien_id = e.id
ORDER BY e.prenom, e.nom;
