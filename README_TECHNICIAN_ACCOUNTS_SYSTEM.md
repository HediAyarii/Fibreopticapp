# Système de Gestion des Comptes Techniciens

## Vue d'ensemble

Ce système permet à l'administrateur de créer et gérer des comptes d'accès pour les techniciens. Chaque technicien peut se connecter à son espace personnel et voir uniquement ses propres données.

## Fonctionnalités

### Pour l'Administrateur

1. **Création de comptes techniciens**
   - Sélection d'un employé existant
   - Génération automatique du nom d'utilisateur
   - Mot de passe par défaut = matricule de l'employé
   - Validation des données

2. **Gestion des comptes**
   - Activation/désactivation des comptes
   - Verrouillage/déverrouillage des comptes
   - Suppression des comptes
   - Visualisation des tentatives de connexion

3. **Interface d'administration**
   - Accès via l'onglet "Comptes Techniciens" dans le dashboard principal
   - Page dédiée `/admin/technicien-accounts`
   - Interface intuitive avec boutons d'action

### Pour le Technicien

1. **Connexion sécurisée**
   - Page de connexion dédiée `/logintech`
   - Authentification JWT avec cookies HTTPOnly
   - Protection contre les attaques par force brute

2. **Espace personnel**
   - Dashboard responsive avec statistiques personnelles
   - Accès uniquement à ses propres données :
     - Ses interventions
     - Ses réclamations
     - Ses pénalités
     - Sa consommation carburant

3. **Fonctionnalités du dashboard**
   - Vue d'ensemble avec statistiques
   - Onglets pour chaque type de données
   - Recherche et pagination
   - Interface mobile-friendly

## Architecture Technique

### Base de Données

```sql
-- Table des comptes techniciens
CREATE TABLE technicien_accounts (
  id SERIAL PRIMARY KEY,
  technicien_id INTEGER REFERENCES employes(id),
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_locked BOOLEAN DEFAULT FALSE,
  login_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des sessions techniciens
CREATE TABLE technicien_sessions (
  id SERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES technicien_accounts(id),
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### APIs

1. **`/api/admin/technicien-accounts`** - Gestion des comptes (CRUD)
2. **`/api/auth/technicien`** - Authentification des techniciens
3. **`/api/employes`** - Liste des employés disponibles
4. **`/api/interventions?employe_id=X`** - Interventions filtrées par technicien
5. **`/api/reclamations?employe_id=X`** - Réclamations filtrées par technicien
6. **`/api/penalites?employe_id=X`** - Pénalités filtrées par technicien
7. **`/api/carburant-assignation?employe_id=X`** - Carburant filtré par technicien

### Sécurité

1. **Authentification JWT**
   - Tokens signés avec secret robuste
   - Expiration après 24h
   - Cookies HTTPOnly pour éviter XSS

2. **Protection contre les attaques**
   - Limitation des tentatives de connexion
   - Verrouillage automatique des comptes
   - Middleware de protection des routes

3. **Filtrage des données**
   - Chaque technicien ne voit que ses données
   - Validation côté serveur
   - Pas d'accès croisé entre techniciens

## Utilisation

### Créer un compte technicien

1. Aller dans le dashboard principal
2. Cliquer sur l'onglet "Comptes Techniciens"
3. Cliquer sur "Gérer les Comptes"
4. Cliquer sur "Nouveau Compte"
5. Sélectionner un employé
6. Vérifier les informations générées automatiquement
7. Cliquer sur "Créer le Compte"

### Connexion technicien

1. Aller sur `/logintech`
2. Saisir le nom d'utilisateur (généré automatiquement)
3. Saisir le mot de passe (matricule par défaut)
4. Cliquer sur "Se connecter"
5. Être redirigé vers le dashboard personnel

### Gestion des comptes

1. Aller sur `/admin/technicien-accounts`
2. Voir la liste de tous les comptes
3. Utiliser les boutons d'action :
   - 👁️ Activer/Désactiver
   - 🔒 Verrouiller/Déverrouiller
   - 🗑️ Supprimer

## Configuration

### Variables d'environnement

```env
JWT_SECRET=finalfibre-super-secret-jwt-key-2025-technicien-auth
```

### Middleware

Le fichier `middleware.ts` protège automatiquement :
- `/technicien/*` - Routes techniciens
- Redirection depuis `/logintech` si déjà connecté

## Dépannage

### Problèmes courants

1. **Erreur de connexion**
   - Vérifier que le compte est actif
   - Vérifier que le compte n'est pas verrouillé
   - Vérifier les identifiants

2. **Données non affichées**
   - Vérifier que l'API retourne les bonnes données
   - Vérifier le filtrage par `employe_id`
   - Vérifier les logs du serveur

3. **Problèmes de redirection**
   - Vérifier le middleware
   - Vérifier les cookies
   - Vérifier la configuration JWT

### Logs utiles

```bash
# Vérifier les connexions
docker exec -i finalfibre-postgres psql -U finalfibre_user -d finalfibre_db -c "SELECT * FROM technicien_accounts;"

# Vérifier les sessions
docker exec -i finalfibre-postgres psql -U finalfibre_user -d finalfibre_db -c "SELECT * FROM technicien_sessions;"
```

## Développement

### Ajouter de nouvelles fonctionnalités

1. Créer l'API avec filtrage par `employe_id`
2. Ajouter l'interface dans le dashboard technicien
3. Tester avec différents comptes techniciens
4. Vérifier la sécurité et l'isolation des données

### Tests

1. Créer plusieurs comptes techniciens
2. Se connecter avec chaque compte
3. Vérifier que chaque technicien ne voit que ses données
4. Tester les fonctionnalités d'administration

## Support

Pour toute question ou problème :
1. Vérifier les logs du serveur
2. Vérifier la base de données
3. Tester avec un compte simple
4. Consulter la documentation technique
