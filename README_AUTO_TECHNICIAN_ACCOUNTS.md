# Système de Comptes Techniciens Automatiques

## 📋 Résumé

Un système automatique a été créé pour générer des comptes techniciens pour tous les employés existants dans la base de données. Chaque employé peut maintenant se connecter avec son propre compte et voir uniquement ses données personnelles.

## 🔐 Comptes Créés

| Username | Nom Complet | Matricule (Mot de passe) | Statut |
|----------|-------------|---------------------------|--------|
| `ben_chedli_hamdi` | BEN CHEDLI HAMDI | EMPHAMBE | ✅ Actif |
| `aymen_ben_khalifa` | Aymen BEN KHALIFA | EMPBENAY | ✅ Actif |
| `marouen_bouaffoura` | Marouen BOUAFFOURA | EMPBOUMA | ✅ Actif |
| `wahid_lotfi` | Wahid LOTFI | EMPLOTWA | ✅ Actif |
| `ramzi_hakiri` | Ramzi HAKIRI | EMPHAKRA | ✅ Actif |
| `mohamed-bechir_moulahi` | Mohamed-Bechir MOULAHI | EMPMOUMO | ✅ Actif |
| `fares_ben_trad` | Fares BEN TRAD | EMPBENFA | ✅ Actif |
| `salmen_houimdi` | Salmen HOUIMDI | EMPHOUSA | ✅ Actif |
| `karim_ben_rabeh` | Karim BEN RABEH | EMPBENKA | ✅ Actif |
| `hamza_ben_salah` | Hamza BEN SALAH | EMPBENHA | ✅ Actif |

## 🚀 Comment se connecter

1. **Aller sur :** `http://localhost:3000/logintech`
2. **Username :** Utiliser le nom d'utilisateur de la table ci-dessus
3. **Password :** Utiliser le matricule correspondant

### Exemple pour Hamza BEN SALAH :
- **Username :** `hamza_ben_salah`
- **Password :** `EMPBENHA`

## 📊 Données Filtrées par Employé

Chaque technicien connecté ne peut voir que :

### ✅ Ses Interventions
- Filtrées par `nom_technicien` et `prenom_technicien`
- Accès via `/api/interventions?employe_id={id}`

### ✅ Ses Réclamations
- Filtrées par `employe_id`
- Accès via `/api/reclamations?employe_id={id}`

### ✅ Ses Pénalités
- Filtrées par `employe_id`
- Accès via `/api/penalites?employe_id={id}`

### ✅ Sa Consommation Carburant
- Filtrée par `employe_id`
- Accès via `/api/carburant-assignation?employe_id={id}`

## 🎯 Dashboard Technicien

Le dashboard (`/technicien/dashboard`) affiche :

1. **Vue d'ensemble :**
   - Total interventions du technicien
   - Interventions du mois en cours
   - Chiffre d'affaires généré (placeholder)
   - Total pénalités
   - Total réclamations

2. **Mes Interventions :**
   - Liste paginée et recherchable
   - Statuts avec couleurs
   - Détails des articles

3. **Réclamations :**
   - Réclamations assignées au technicien
   - Priorités et statuts avec badges

4. **Pénalités :**
   - Pénalités du technicien
   - Montants et motifs

## 🔧 APIs Modifiées

### `/api/interventions`
- **GET** : Supporte `?employe_id={id}` pour filtrer par technicien

### `/api/reclamations`
- **GET** : Supporte `?employe_id={id}` pour filtrer par employé

### `/api/penalites`
- **GET** : Supporte `?employe_id={id}` pour filtrer par employé

### `/api/carburant-assignation`
- **GET** : Supporte déjà `?employe_id={id}` pour filtrer par employé

## 🛡️ Sécurité

- **Authentification JWT** avec cookies HTTPOnly
- **Middleware de protection** des routes `/technicien/*`
- **Filtrage automatique** des données par employé connecté
- **Mots de passe hashés** avec bcrypt

## 📁 Fichiers Créés/Modifiés

### Scripts SQL :
- `scripts/create_all_technician_accounts.sql` - Création des comptes
- `scripts/update_passwords_to_matricules.sql` - Mise à jour des mots de passe

### APIs Modifiées :
- `app/api/interventions/route.ts` - Filtrage par employé
- `app/api/reclamations/route.ts` - Filtrage par employé
- `app/api/penalites/route.ts` - Filtrage par employé

### Frontend :
- `app/technicien/dashboard/page.tsx` - Dashboard filtré par employé

## 🧪 Test du Système

Pour tester avec Hamza BEN SALAH :

1. **Connexion :**
   ```
   URL: http://localhost:3000/logintech
   Username: hamza_ben_salah
   Password: EMPBENHA
   ```

2. **Vérification :**
   - Redirection automatique vers `/technicien/dashboard`
   - Affichage des données uniquement pour Hamza BEN SALAH
   - Pas d'accès aux données des autres techniciens

## 🔄 Maintenance

Pour ajouter de nouveaux employés :

1. Ajouter l'employé dans la table `employes`
2. Exécuter le script de création de compte :
   ```sql
   INSERT INTO technicien_accounts (technicien_id, username, password_hash, is_active, is_locked, login_attempts, created_at)
   SELECT 
     e.id,
     LOWER(REPLACE(e.prenom || '_' || e.nom, ' ', '_')),
     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- "password" hashé
     true, false, 0, NOW()
   FROM employes e
   WHERE e.id = {nouvel_employe_id};
   ```
3. Mettre à jour le mot de passe avec le matricule :
   ```sql
   UPDATE technicien_accounts 
   SET password_hash = '{hash_bcrypt_du_matricule}' 
   WHERE technicien_id = {nouvel_employe_id};
   ```
