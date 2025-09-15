-- Mise à jour des mots de passe avec les matricules correspondants

UPDATE technicien_accounts SET password_hash = '$2b$10$GQ.S.hHmpym5qviZUAv8ruRoMi8hFbvChUioxQJK7n8HqPsS.a/Py' WHERE username = 'ben_chedli_hamdi';
UPDATE technicien_accounts SET password_hash = '$2b$10$omoEVTEaTCplksiZ8xWr5O1p7yYTCfEcU22JXxoFMQ9cIP.Rv/pga' WHERE username = 'aymen_ben_khalifa';
UPDATE technicien_accounts SET password_hash = '$2b$10$SzjlQK3MLperMzK04M3kc.LbtivV6yqUuQ/Yo9QpF3YTqwmJqAzWW' WHERE username = 'marouen_bouaffoura';
UPDATE technicien_accounts SET password_hash = '$2b$10$Yw/yOlWeSfeLYDPMSr5h..cn8WzP9bnhy36GO8pRH.hkN1hYs3peu' WHERE username = 'wahid_lotfi';
UPDATE technicien_accounts SET password_hash = '$2b$10$EfGWPeeCIhl1beirlRwUSuHF4DmzNE0vJiWmQUukNF/gvMw36a3ay' WHERE username = 'ramzi_hakiri';
UPDATE technicien_accounts SET password_hash = '$2b$10$lQvPPB.UlGGDNeDbLSeWj.2c0KexW7aEtn/9BntJyv1qVqLkep5qS' WHERE username = 'mohamed-bechir_moulahi';
UPDATE technicien_accounts SET password_hash = '$2b$10$vDy1.YOovQ8vXBfgT8WqxeFhbcwZdiXcwOi7FA7tgg1bOnVNXRnva' WHERE username = 'fares_ben_trad';
UPDATE technicien_accounts SET password_hash = '$2b$10$3.1WfF0hHIlJWjS8Nl2AAebSigIE3UTw3hN57SgRyTORdOJjl/3zO' WHERE username = 'salmen_houimdi';
UPDATE technicien_accounts SET password_hash = '$2b$10$oLrGQwn/X3VJVsDWUq2wPeXGX9aC0LoterFjiKjSrICsNgSiL0H8m' WHERE username = 'karim_ben_rabeh';
UPDATE technicien_accounts SET password_hash = '$2b$10$/O4YEEnH9r57H4Khw0rZPed.PpI/7CztgF21qllhFQ/f.L1UXn4oW' WHERE username = 'hamza_ben_salah';

-- Vérification des comptes mis à jour
SELECT 
    ta.username,
    e.prenom,
    e.nom,
    e.matricule,
    ta.is_active,
    'Matricule' as mot_de_passe
FROM technicien_accounts ta
JOIN employes e ON ta.technicien_id = e.id
ORDER BY e.prenom, e.nom;
