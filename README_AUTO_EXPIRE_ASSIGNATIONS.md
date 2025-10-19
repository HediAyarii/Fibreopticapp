# Libération Automatique des Assignations de Cartes Carburant Expirées

Ce système permet de libérer automatiquement les cartes carburant assignées aux employés lorsque leur date de fin est atteinte.

## 🎯 Fonctionnalités

- **Libération automatique** : Les assignations expirées sont automatiquement désactivées
- **Historique complet** : Tous les mouvements sont enregistrés dans `carburant_mouvements`
- **Notifications** : Logs détaillés de toutes les opérations
- **Vérification préventive** : Détection des assignations qui vont expirer

## 🔧 Configuration

### 1. API Endpoints

#### `POST /api/carburant-auto-expire`
Libère automatiquement toutes les assignations expirées.

**Réponse :**
```json
{
  "success": true,
  "message": "Libération automatique terminée",
  "expired_count": 3,
  "liberated_count": 3,
  "liberated_assignations": [
    {
      "id": 123,
      "carte_id": "CARD001",
      "employe_id": 5,
      "date_fin": "2025-01-15"
    }
  ]
}
```

#### `GET /api/carburant-auto-expire`
Vérifie les assignations expirées et celles qui vont expirer.

**Réponse :**
```json
{
  "success": true,
  "upcoming_expiry": [...],
  "expired_assignations": [...],
  "summary": {
    "upcoming_count": 2,
    "expired_count": 1
  }
}
```

### 2. Script de Cron Job

#### Installation automatique
```bash
# Rendre le script exécutable
chmod +x scripts/setup-cron-job.sh

# Exécuter la configuration
./scripts/setup-cron-job.sh
```

#### Installation manuelle
```bash
# Éditer le crontab
crontab -e

# Ajouter les lignes suivantes :
# Libération quotidienne à 2h00
0 2 * * * cd /path/to/project && node scripts/auto-expire-assignations.js >> /var/log/carburant-auto-expire/auto-expire.log 2>&1

# Vérification hebdomadaire le lundi à 9h00
0 9 * * 1 cd /path/to/project && node scripts/auto-expire-assignations.js >> /var/log/carburant-auto-expire/auto-expire-weekly.log 2>&1
```

## 🚀 Utilisation

### Test manuel
```bash
# Tester le script
node scripts/auto-expire-assignations.js

# Vérifier les assignations expirantes
curl -X GET http://localhost:3000/api/carburant-auto-expire

# Libérer les assignations expirées
curl -X POST http://localhost:3000/api/carburant-auto-expire
```

### Surveillance des logs
```bash
# Logs quotidiens
tail -f /var/log/carburant-auto-expire/auto-expire.log

# Logs hebdomadaires
tail -f /var/log/carburant-auto-expire/auto-expire-weekly.log

# Vérifier le cron job
crontab -l
```

## 📊 Fonctionnement

### 1. Détection des assignations expirées
Le système identifie les assignations avec :
- `statut = 'active'`
- `date_fin IS NOT NULL`
- `date_fin < CURRENT_DATE`

### 2. Libération automatique
Pour chaque assignation expirée :
1. **Changement de statut** : `active` → `expired`
2. **Mise à jour des commentaires** : Ajout de la date d'expiration
3. **Création d'un mouvement** : Enregistrement dans `carburant_mouvements`
4. **Log de l'opération** : Traçabilité complète

### 3. Types de mouvements créés
- **Type** : `liberation_automatique`
- **Motif** : `Assignation expirée`
- **Commentaires** : `Libération automatique - date de fin atteinte`

## 🔍 Surveillance

### Vérification des assignations
```sql
-- Assignations expirées
SELECT ca.*, e.nom, e.prenom 
FROM carburant_assignations ca
LEFT JOIN employes e ON ca.employe_id = e.id
WHERE ca.statut = 'expired'
ORDER BY ca.date_fin DESC;

-- Assignations qui vont expirer
SELECT ca.*, e.nom, e.prenom 
FROM carburant_assignations ca
LEFT JOIN employes e ON ca.employe_id = e.id
WHERE ca.statut = 'active' 
  AND ca.date_fin IS NOT NULL 
  AND ca.date_fin BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
ORDER BY ca.date_fin ASC;
```

### Historique des mouvements
```sql
-- Mouvements de libération automatique
SELECT * FROM carburant_mouvements 
WHERE type_mouvement = 'liberation_automatique'
ORDER BY date_mouvement DESC;
```

## ⚙️ Configuration avancée

### Variables d'environnement
```bash
# URL de l'API (optionnel)
export NEXT_PUBLIC_API_URL="https://votre-domaine.com"

# Répertoire des logs (optionnel)
export CARBURANT_LOG_DIR="/var/log/carburant-auto-expire"
```

### Personnalisation du cron job
```bash
# Exécution toutes les 6 heures
0 */6 * * * cd /path/to/project && node scripts/auto-expire-assignations.js

# Exécution uniquement en semaine
0 2 * * 1-5 cd /path/to/project && node scripts/auto-expire-assignations.js

# Exécution avec notification par email
0 2 * * * cd /path/to/project && node scripts/auto-expire-assignations.js | mail -s "Libération assignations" admin@company.com
```

## 🛠️ Dépannage

### Problèmes courants

1. **Script ne s'exécute pas**
   ```bash
   # Vérifier les permissions
   ls -la scripts/auto-expire-assignations.js
   
   # Vérifier le cron job
   crontab -l
   ```

2. **Erreurs de connexion**
   ```bash
   # Vérifier que l'API est accessible
   curl -X GET http://localhost:3000/api/carburant-auto-expire
   ```

3. **Logs vides**
   ```bash
   # Vérifier les permissions du répertoire de logs
   ls -la /var/log/carburant-auto-expire/
   ```

### Logs de débogage
```bash
# Exécuter avec debug
DEBUG=* node scripts/auto-expire-assignations.js

# Vérifier les logs du système
journalctl -u cron | grep auto-expire
```

## 📈 Métriques

Le système génère des métriques utiles :
- Nombre d'assignations expirées détectées
- Nombre d'assignations libérées
- Temps d'exécution du script
- Historique des opérations

## 🔒 Sécurité

- **Authentification** : Le script utilise l'API interne (pas d'exposition publique)
- **Logs sécurisés** : Les logs ne contiennent pas d'informations sensibles
- **Permissions** : Le script s'exécute avec les permissions minimales nécessaires

## 📞 Support

En cas de problème :
1. Vérifier les logs dans `/var/log/carburant-auto-expire/`
2. Tester manuellement le script
3. Vérifier la configuration du cron job
4. Contacter l'équipe technique


