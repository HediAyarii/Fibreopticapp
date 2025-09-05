# 🐳 Configuration Docker pour FinalFibre

## 📋 Prérequis

- Docker et Docker Compose installés
- Python 3.x installé
- Accès en ligne de commande

## 🚀 Démarrage Rapide

### 1. Redémarrage Complet (Recommandé)

**Sur Windows (PowerShell):**
```powershell
.\scripts\reset_database.ps1
```

**Sur Linux/Mac:**
```bash
chmod +x scripts/reset_database.sh
./scripts/reset_database.sh
```

### 2. Démarrage Manuel

```bash
# Arrêter et supprimer tout
docker-compose down -v

# Redémarrer
docker-compose up -d

# Vérifier que tout fonctionne
python scripts/test_database_setup.py
```

## 🔧 Configuration

### Variables d'Environnement

Créez un fichier `.env` avec le contenu suivant :

```env
# Configuration de la base de données PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=finalfibre_db
POSTGRES_USER=finalfibre_user
POSTGRES_PASSWORD=finalfibre_password_2024

# Configuration PgAdmin
PGADMIN_DEFAULT_EMAIL=admin@finalfibre.com
PGADMIN_DEFAULT_PASSWORD=admin123
```

### Services Disponibles

| Service | URL | Description |
|---------|-----|-------------|
| **PostgreSQL** | `localhost:5432` | Base de données principale |
| **PgAdmin** | `http://localhost:8080` | Interface d'administration |
| **Next.js App** | `http://localhost:3000` | Application web |

### Connexion PgAdmin

- **URL:** http://localhost:8080
- **Email:** admin@finalfibre.com
- **Mot de passe:** admin123

### Connexion PostgreSQL

- **Host:** localhost
- **Port:** 5432
- **Database:** finalfibre_db
- **User:** finalfibre_user
- **Password:** finalfibre_password_2024

## 📊 Structure de la Base de Données

### Tables Principales

1. **`interventions`** - Données d'interventions techniques
   - Contrainte unique: `(num_inter, date_rdv)`
   - Permet les interventions reportées/reprogrammées

2. **`carburant_consommation`** - Consommation de carburant
   - Contrainte unique: `numero_justificatif`

3. **`employes`** - Informations des employés

4. **`materiel`** - Gestion du matériel

5. **`reclamations`** - Réclamations clients

6. **`penalites`** - Pénalités et sanctions

### Index et Contraintes

- Index sur les dates, techniciens, clients
- Clés étrangères entre les tables
- Contraintes d'unicité appropriées

## 🧪 Tests et Vérification

### Test de Configuration

```bash
python scripts/test_database_setup.py
```

Ce script vérifie :
- ✅ Connexion à la base de données
- ✅ Existence de toutes les tables
- ✅ Présence des contraintes importantes
- ✅ Configuration des clés étrangères
- ✅ Index de performance

### Test d'Import

```bash
# Test import interventions
python scripts/smart_import_interventions.py --file "votre_fichier.csv"

# Test import carburant
python scripts/import_carburant_universal.py --file "votre_fichier.xlsx"
```

## 🔄 Gestion des Données

### Import via Interface Web

1. **Interventions:** Bouton "Importer Interventions"
   - Utilise le script intelligent
   - Gère les doublons `Num Inter + Date RDV`

2. **Carburant:** Bouton "Importer Carburant"
   - Support CSV et Excel
   - Gère les doublons `numero_justificatif`

### Import via Scripts

```bash
# Interventions (script intelligent)
python scripts/smart_import_interventions.py --file "interventions.csv"

# Carburant (script universel)
python scripts/import_carburant_universal.py --file "carburant.xlsx"
```

## 🛠️ Dépannage

### Problèmes Courants

1. **Conteneur PostgreSQL non accessible**
   ```bash
   docker logs finalfibre-postgres
   ```

2. **Erreur de contrainte unique**
   - Vérifiez que le schéma est correctement appliqué
   - Utilisez le script de test

3. **Problème d'import**
   - Vérifiez l'encodage du fichier (UTF-8, ISO-8859-1)
   - Utilisez les scripts de diagnostic

### Logs et Debug

```bash
# Logs PostgreSQL
docker logs finalfibre-postgres

# Logs PgAdmin
docker logs finalfibre-pgadmin

# Statut des conteneurs
docker-compose ps
```

## 📝 Notes Importantes

- **Volume Persistant:** Les données sont sauvegardées dans le volume `postgres_data`
- **Schéma Automatique:** Le schéma SQL est appliqué automatiquement au premier démarrage
- **Contraintes Intelligentes:** Les contraintes permettent les cas d'usage réels (interventions reportées)
- **Scripts Spécialisés:** Chaque type de données a son script d'import optimisé

## 🎯 Commandes Utiles

```bash
# Redémarrage complet
docker-compose down -v && docker-compose up -d

# Vérification de l'état
docker-compose ps

# Accès direct à PostgreSQL
docker exec -it finalfibre-postgres psql -U finalfibre_user -d finalfibre_db

# Test de configuration
python scripts/test_database_setup.py

# Nettoyage complet (ATTENTION: supprime toutes les données)
docker-compose down -v
docker system prune -f
```
