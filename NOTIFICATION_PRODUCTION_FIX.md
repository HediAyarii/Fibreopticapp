# Fix des Notifications en Production 🔔

## 📋 Problème Identifié

Les notifications ne fonctionnaient pas sur le domaine de production `https://tech.networkcom.paris` pour deux raisons principales:

1. **URL ngrok obsolète**: Les fichiers `.env` contenaient encore l'ancienne URL ngrok
2. **Socket.IO désactivé**: Le code détectait "ngrok" dans l'URL et désactivait complètement Socket.IO
3. **CORS mal configuré**: Socket.IO n'autorisait pas les connexions depuis le domaine de production

## ✅ Modifications Effectuées

### 1. Fichiers `.env` et `.env.local`
```env
# AVANT
NEXT_PUBLIC_APP_URL=https://1c82e58d62af.ngrok-free.app

# APRÈS
NEXT_PUBLIC_APP_URL=https://tech.networkcom.paris
```

### 2. `hooks/useSocketIO.tsx`
**Changements:**
- ❌ **Supprimé**: Détection et désactivation de Socket.IO pour ngrok
- ✅ **Ajouté**: Connexion dynamique basée sur `window.location.origin` en production
- ✅ **Ajouté**: Support HTTPS avec `secure: true` quand nécessaire

```typescript
// AVANT - Socket.IO désactivé pour ngrok
const isNgrok = window.location.hostname.includes('ngrok-free.app')
if (isNgrok) {
  console.log('🔇 Socket.IO désactivé pour ngrok')
  return
}

// APRÈS - Socket.IO toujours actif avec URL dynamique
const socketUrl = process.env.NODE_ENV === 'production' 
  ? window.location.origin
  : 'http://localhost:3000'
```

### 3. `lib/socketio.ts`
**Changements:**
- ✅ **Ajouté**: CORS pour `tech.networkcom.paris`
- ✅ **Ajouté**: Configuration pour reverse proxy
- ✅ **Ajouté**: Timeout augmentés pour connexions plus stables

```typescript
// AVANT - CORS limité
cors: {
  origin: process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'
}

// APRÈS - CORS avec plusieurs origines autorisées
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      'https://tech.networkcom.paris',
      'http://localhost:3000'
    ]
  : ['http://localhost:3000', 'http://127.0.0.1:3000']

cors: {
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
  credentials: true
}
```

## 🚀 Déploiement en Production

### Étape 1: Vérifier les Variables d'Environnement
Sur votre serveur de production, vérifiez que les variables suivantes sont correctement définies:

```bash
# Dans votre fichier .env sur le serveur
NEXT_PUBLIC_APP_URL=https://tech.networkcom.paris
NODE_ENV=production
```

### Étape 2: Rebuild l'Application
```bash
# Sur le serveur de production
npm run build
```

### Étape 3: Redémarrer le Serveur
```bash
# Arrêter le serveur actuel
pm2 stop all  # ou votre méthode de gestion

# Redémarrer avec le nouveau code
pm2 start server.js --name finalfibre
# ou
npm run start
```

### Étape 4: Vérifier la Configuration Nginx (si applicable)

Si vous utilisez nginx comme reverse proxy, assurez-vous que la configuration permet WebSocket:

```nginx
server {
    listen 443 ssl;
    server_name tech.networkcom.paris;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # Important pour Socket.IO
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts pour Socket.IO
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
}
```

### Étape 5: Test de Connexion Socket.IO

Après le déploiement, testez la connexion Socket.IO:

1. Ouvrez la console développeur sur `https://tech.networkcom.paris/logintech`
2. Cherchez les messages de log:
   - ✅ `🔌 Connexion Socket.IO à: https://tech.networkcom.paris`
   - ✅ `🔌 Connecté au serveur Socket.IO`
   - ✅ `✅ Authentification Socket.IO réussie`

3. Testez une notification:
   - Créez une pénalité pour un technicien
   - Le technicien devrait recevoir la notification instantanément

## 🔍 Vérification et Debug

### Vérifier les Logs du Serveur
```bash
# Voir les logs en temps réel
pm2 logs finalfibre

# Cherchez ces messages:
# ✅ 🔌 Initialisation du serveur Socket.IO...
# ✅ 🔐 CORS autorisés: [...]
# ✅ 🔌 Nouvelle connexion Socket.IO: [socket-id]
```

### Tester l'API Socket.IO
```bash
# Test depuis le serveur
curl https://tech.networkcom.paris/api/socketio

# Réponse attendue:
# {"connected":true,"message":"Socket.IO opérationnel","activeConnections":X}
```

### Console Navigateur
Ouvrez la console dans le navigateur du technicien et vérifiez:

```javascript
// Vérifier l'état de connexion
// Devrait afficher "connected"
```

## ⚙️ Architecture des Notifications

Le système utilise **deux méthodes** complémentaires:

### 1. Socket.IO (Temps Réel)
- Pour les notifications instantanées quand l'application est ouverte
- Connexion WebSocket persistante
- Notifications visibles immédiatement dans NotificationCenter

### 2. Web Push API (Notifications Système)
- Pour les notifications même quand l'application est fermée
- Affichage dans les notifications système (écran de verrouillage)
- Nécessite l'autorisation du navigateur

**Les deux systèmes fonctionnent ensemble** pour garantir que le technicien reçoit toujours ses notifications.

## 🐛 Troubleshooting

### Socket.IO ne se connecte pas
1. Vérifiez les logs du serveur: `pm2 logs`
2. Vérifiez la console navigateur pour les erreurs CORS
3. Testez l'endpoint: `curl https://tech.networkcom.paris/api/socketio`
4. Vérifiez la configuration nginx (si applicable)

### Notifications Push ne fonctionnent pas
1. Vérifiez que l'utilisateur a autorisé les notifications
2. Vérifiez les clés VAPID dans `.env`:
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
3. Vérifiez les subscriptions dans la DB: `SELECT * FROM push_subscriptions`

### Les deux ne fonctionnent pas
1. Vérifiez que `NEXT_PUBLIC_APP_URL=https://tech.networkcom.paris` est bien défini
2. Reconstruisez l'application: `npm run build`
3. Redémarrez complètement: `pm2 restart all`

## 📊 Monitoring

### Vérifier les Connexions Actives
```bash
# Via l'API
curl https://tech.networkcom.paris/api/socketio

# Via les logs serveur
pm2 logs | grep "connexion Socket.IO"
```

### Tester l'Envoi de Notification
Créez une pénalité via l'interface admin et vérifiez:
1. Les logs serveur montrent: `📨 Notification Socket.IO pénalité: OUI`
2. Le technicien reçoit la notification immédiatement
3. La notification apparaît dans son NotificationCenter

## ✨ Améliorations Futures

1. **Dashboard de Monitoring**: Créer une page admin pour voir toutes les connexions Socket.IO actives
2. **Retry Logic**: Ajouter une logique de reconnexion automatique si Socket.IO se déconnecte
3. **Notification History**: Stocker l'historique des notifications dans la DB
4. **Multi-Device Support**: Gérer plusieurs appareils connectés par technicien

## 📞 Support

Si les notifications ne fonctionnent toujours pas après ces modifications:
1. Partagez les logs du serveur (`pm2 logs`)
2. Partagez les erreurs de la console navigateur
3. Vérifiez votre configuration nginx/reverse proxy
