# 🗄️ Guide d'Installation et d'Utilisation de la Base de Données FinalFibre

## 📋 Vue d'ensemble

Ce guide vous explique comment configurer et utiliser la base de données PostgreSQL pour l'application FinalFibre, incluant l'importation des données CSV.

## 🚀 Installation Rapide

### 1. Démarrer PostgreSQL avec Docker

```bash
# Démarrer les conteneurs PostgreSQL et PgAdmin
docker-compose up -d

# Vérifier que les conteneurs sont en cours d'exécution
docker-compose ps
```

### 2. Configurer les variables d'environnement

```bash
# Copier le fichier d'exemple
cp env.example .env

# Éditer les variables si nécessaire
# Les valeurs par défaut sont déjà configurées
```

### 3. Installer les dépendances

```bash
# Dépendances Node.js
npm install

# Dépendances Python (optionnel pour les scripts)
pip install -r scripts/requirements.txt
```

## 🐳 Services Docker

### PostgreSQL
- **Port:** 5432
- **Base:** finalfibre_db
- **Utilisateur:** finalfibre_user
- **Mot de passe:** finalfibre_password_2024

### PgAdmin (Interface Web)
- **URL:** http://localhost:8080
- **Email:** admin@finalfibre.com
- **Mot de passe:** admin123

## 📊 Structure de la Base de Données

### Tables Principales

1. **`interventions`** - Données d'interventions techniques (120+ champs)
2. **`carburant_consommation`** - Consommation de carburant des véhicules
3. **`employes`** - Gestion des employés et techniciens
4. **`reclamations`** - Réclamations clients
5. **`penalites`** - Pénalités employés
6. **`materiel`** - Gestion du matériel et équipements

### Contraintes d'Unicité
- `interventions.num_inter` (Numéro d'intervention)
- `carburant_consommation.numero_justificatif` (Numéro de justificatif)

## 📥 Importation des Données

### Via l'Interface Web (Recommandé)

1. **Interventions:**
   - Aller dans l'interface web
   - Section "Import Interventions"
   - Sélectionner le fichier CSV
   - Cliquer sur "Importer"

2. **Carburant:**
   - Aller dans l'interface web
   - Section "Import Carburant"
   - Sélectionner le fichier CSV/XLSX
   - Cliquer sur "Importer"

### Via Script Python (Avancé)

```bash
# Import des interventions
python scripts/import_to_database.py --type interventions --file interventions.csv

# Import du carburant
python scripts/import_to_database.py --type carburant --file carburant.csv

# Mode test (sans insertion)
python scripts/import_to_database.py --type interventions --file test.csv --test
```

### Test de la Fonctionnalité

```bash
# Exécuter les tests
python scripts/test_import.py
```

## 🔧 Configuration Avancée

### Variables d'Environnement

```env
# Base de données
DATABASE_URL="postgresql://finalfibre_user:finalfibre_password_2024@localhost:5432/finalfibre_db"
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=finalfibre_db
POSTGRES_USER=finalfibre_user
POSTGRES_PASSWORD=finalfibre_password_2024

# Application
NEXTAUTH_SECRET="finalfibre-secret-key-2024"
NEXTAUTH_URL="http://localhost:3000"
```

### Connexion Directe à PostgreSQL

```bash
# Via psql
psql -h localhost -p 5432 -U finalfibre_user -d finalfibre_db

# Via Docker
docker exec -it finalfibre-postgres psql -U finalfibre_user -d finalfibre_db
```

## 📈 Monitoring et Maintenance

### Vérifier l'État des Services

```bash
# Statut des conteneurs
docker-compose ps

# Logs PostgreSQL
docker-compose logs postgres

# Logs PgAdmin
docker-compose logs pgadmin
```

### Sauvegarde de la Base

```bash
# Sauvegarde complète
docker exec finalfibre-postgres pg_dump -U finalfibre_user finalfibre_db > backup_$(date +%Y%m%d).sql

# Restauration
docker exec -i finalfibre-postgres psql -U finalfibre_user finalfibre_db < backup_20240115.sql
```

### Nettoyage

```bash
# Arrêter les services
docker-compose down

# Supprimer les volumes (ATTENTION: supprime toutes les données)
docker-compose down -v
```

## 🐛 Dépannage

### Problèmes Courants

1. **Erreur de connexion PostgreSQL:**
   ```bash
   # Vérifier que le conteneur est démarré
   docker-compose ps
   
   # Redémarrer si nécessaire
   docker-compose restart postgres
   ```

2. **Port déjà utilisé:**
   ```bash
   # Changer les ports dans docker-compose.yml
   ports:
     - "5433:5432"  # Utiliser un port différent
   ```

3. **Erreur d'import CSV:**
   ```bash
   # Vérifier le format du fichier
   python scripts/test_import.py
   
   # Vérifier les logs
   tail -f import_log.txt
   ```

### Logs et Debug

```bash
# Logs d'importation
tail -f scripts/import_log.txt

# Logs de l'application Next.js
npm run dev  # Vérifier la console

# Logs PostgreSQL
docker-compose logs -f postgres
```

## 📚 API Endpoints

### Interventions
- `POST /api/interventions` - Importer des interventions
- `GET /api/interventions` - Récupérer les interventions

### Carburant
- `POST /api/carburant` - Importer des données carburant
- `GET /api/carburant` - Récupérer les données carburant

## 🔒 Sécurité

### Bonnes Pratiques

1. **Changer les mots de passe par défaut en production**
2. **Utiliser HTTPS en production**
3. **Configurer un firewall approprié**
4. **Sauvegarder régulièrement les données**
5. **Monitorer les accès à la base**

### Variables Sensibles

```env
# Production - Changer ces valeurs
POSTGRES_PASSWORD=votre_mot_de_passe_securise
NEXTAUTH_SECRET=votre_secret_jwt_securise
```

## 📞 Support

En cas de problème:

1. Vérifier les logs: `docker-compose logs`
2. Tester la connexion: `python scripts/test_import.py`
3. Vérifier la configuration: `.env` et `docker-compose.yml`
4. Consulter la documentation PostgreSQL

---

**Note:** Ce guide assume que Docker et Docker Compose sont installés sur votre système.

