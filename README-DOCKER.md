# 🐳 Docker Setup pour FinalFibre

## 📋 **Fichiers créés :**

- `Dockerfile` - Image avec Node.js + Python
- `docker-compose.app.yml` - Orchestration app + DB
- `scripts/docker-entrypoint.sh` - Script d'entrée Linux
- `scripts/docker-build.bat` - Script de build Windows
- `scripts/init-db.sql` - Initialisation base de données
- `.dockerignore` - Fichiers à exclure

## 🚀 **Démarrage rapide :**

### **Windows :**
```bash
# Construire et démarrer
scripts\docker-build.bat
```

### **Linux/Mac :**
```bash
# Rendre le script exécutable
chmod +x scripts/docker-build.sh

# Construire et démarrer
./scripts/docker-build.sh
```

## 🔧 **Configuration :**

### **Variables d'environnement :**
- `DB_HOST=postgres`
- `DB_PORT=5432`
- `DB_NAME=finalfibre_db`
- `DB_USER=finalfibre_user`
- `DB_PASSWORD=finalfibre_password_2024`

### **Ports exposés :**
- **Application :** `3000`
- **Base de données :** `5432`

## 📊 **Commandes utiles :**

```bash
# Voir les logs
docker-compose -f docker-compose.app.yml logs -f

# Arrêter les services
docker-compose -f docker-compose.app.yml down

# Redémarrer
docker-compose -f docker-compose.app.yml restart

# Reconstruire l'image
docker build -t finalfibre-app .

# Accéder au conteneur
docker exec -it finalfibre-app sh
```

## 🔐 **Connexion par défaut :**

- **Email :** `admin@fibertech.com`
- **Mot de passe :** `admin123`

## 🐍 **Python intégré :**

L'image inclut Python 3 avec pip pour exécuter les scripts Python de l'application.

## 📁 **Volumes :**

- `postgres-data` - Données PostgreSQL persistantes
- `app-logs` - Logs de l'application

## 🔍 **Health Checks :**

- **App :** Vérifie `/api/sections` toutes les 30s
- **DB :** Vérifie la connexion PostgreSQL toutes les 10s
