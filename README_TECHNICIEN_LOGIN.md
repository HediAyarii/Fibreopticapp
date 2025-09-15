# Système de Login Technicien - FinalFibre

## 📋 Vue d'ensemble

Ce système permet aux techniciens de se connecter via une page de login séparée à l'adresse `/logintech` et d'accéder à leur dashboard personnel.

## 🚀 Fonctionnalités

### ✅ **Page de Login Technicien** (`/logintech`)
- Interface moderne et responsive
- Validation des identifiants
- Gestion des erreurs de connexion
- Redirection automatique vers le dashboard

### ✅ **Dashboard Technicien** (`/technicien/dashboard`)
- Interface personnalisée pour les techniciens
- Affichage des informations personnelles
- Statistiques des interventions
- Gestion des réclamations
- Déconnexion sécurisée

### ✅ **Système d'Authentification**
- Authentification JWT avec cookies HTTPOnly
- Protection des routes techniciens
- Gestion des sessions
- Sécurité renforcée (verrouillage après tentatives)

### ✅ **API de Gestion des Comptes**
- Création de comptes techniciens par l'admin
- Activation/désactivation des comptes
- Verrouillage/déverrouillage des comptes
- Réinitialisation des mots de passe

## 🛠️ Installation

### 1. **Base de données**
Exécutez le script SQL pour créer les tables nécessaires :

```sql
-- Exécuter le fichier scripts/create_technicien_accounts.sql
```

### 2. **Variables d'environnement**
Ajoutez à votre fichier `.env` :

```env
JWT_SECRET=votre_secret_jwt_tres_securise
```

### 3. **Dépendances**
Les dépendances sont déjà installées :
- `jsonwebtoken` - Gestion des tokens JWT
- `bcryptjs` - Hachage des mots de passe

## 📁 Structure des fichiers

```
app/
├── logintech/
│   └── page.tsx                    # Page de login technicien
├── technicien/
│   ├── layout.tsx                  # Layout avec AuthProvider
│   └── dashboard/
│       └── page.tsx               # Dashboard technicien
├── api/
│   ├── auth/
│   │   └── technicien/
│   │       └── route.ts           # API d'authentification
│   └── admin/
│       └── technicien-accounts/
│           └── route.ts            # API de gestion des comptes
hooks/
└── useAuth.tsx                     # Hook d'authentification
middleware.ts                       # Protection des routes
scripts/
└── create_technicien_accounts.sql  # Script de création des tables
```

## 🔐 Utilisation

### **Pour les Techniciens**

1. **Connexion** :
   - Accédez à `http://localhost:3000/logintech`
   - Entrez vos identifiants (nom d'utilisateur + mot de passe)
   - Vous êtes redirigé vers le dashboard

2. **Dashboard** :
   - Consultez vos interventions
   - Gérez vos réclamations
   - Accédez à vos paramètres

### **Pour les Administrateurs**

1. **Créer un compte technicien** :
   ```javascript
   POST /api/admin/technicien-accounts
   {
     "technicien_id": 1,
     "username": "technicien1",
     "password": "motdepasse123", // optionnel
     "is_active": true
   }
   ```

2. **Gérer les comptes** :
   - Lister tous les comptes : `GET /api/admin/technicien-accounts`
   - Activer/désactiver : `PUT /api/admin/technicien-accounts`
   - Supprimer : `DELETE /api/admin/technicien-accounts?id=1`

## 🔒 Sécurité

### **Fonctionnalités de sécurité** :
- ✅ **Mots de passe hachés** avec bcrypt
- ✅ **Cookies HTTPOnly** pour les tokens
- ✅ **Verrouillage automatique** après 5 tentatives
- ✅ **Tokens JWT** avec expiration (24h)
- ✅ **Protection des routes** via middleware
- ✅ **Validation des sessions** côté serveur

### **Gestion des erreurs** :
- Compte inexistant
- Mot de passe incorrect
- Compte désactivé
- Compte verrouillé
- Session expirée

## 📊 Base de données

### **Tables créées** :

1. **`technicien_accounts`** :
   - `id` - Identifiant unique
   - `technicien_id` - Référence vers la table employes
   - `username` - Nom d'utilisateur unique
   - `password_hash` - Mot de passe haché
   - `is_active` - Compte actif/inactif
   - `is_locked` - Compte verrouillé/déverrouillé
   - `login_attempts` - Nombre de tentatives de connexion
   - `last_login` - Dernière connexion

2. **`technicien_sessions`** (optionnel) :
   - Suivi détaillé des sessions
   - Gestion des tokens
   - Nettoyage automatique

3. **`technicien_accounts_view`** :
   - Vue combinant comptes et informations employés
   - Facilite les requêtes complexes

## 🚀 Démarrage

1. **Démarrer l'application** :
   ```bash
   npm run dev
   ```

2. **Accéder au login technicien** :
   ```
   http://localhost:3000/logintech
   ```

3. **Accéder au dashboard** :
   ```
   http://localhost:3000/technicien/dashboard
   ```

## 🔧 Configuration

### **Personnalisation** :
- Modifiez les délais d'expiration des tokens
- Ajustez le nombre de tentatives avant verrouillage
- Personnalisez l'interface du dashboard
- Ajoutez des fonctionnalités spécifiques

### **Intégration** :
- Le système s'intègre parfaitement avec l'interface admin existante
- Les comptes techniciens peuvent être gérés depuis l'onglet admin
- Compatible avec le système de réclamations et interventions

## 📝 Notes importantes

- Les mots de passe par défaut sont générés automatiquement (matricule + "123")
- Les sessions sont automatiquement nettoyées après expiration
- Le middleware protège toutes les routes `/technicien/*`
- Les erreurs sont loggées côté serveur pour le debugging

## 🆘 Support

En cas de problème :
1. Vérifiez les logs de la console
2. Vérifiez la connexion à la base de données
3. Vérifiez les variables d'environnement
4. Consultez les erreurs dans les outils de développement du navigateur
