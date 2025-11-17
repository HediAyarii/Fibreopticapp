# ✅ Checklist Déploiement Production - Notifications

## 📦 Modifications Locales (Déjà Fait ✅)

- [x] Mise à jour `.env` avec `NEXT_PUBLIC_APP_URL=https://tech.networkcom.paris`
- [x] Mise à jour `.env.local` avec `NEXT_PUBLIC_APP_URL=https://tech.networkcom.paris`
- [x] Suppression de la détection ngrok dans `hooks/useSocketIO.tsx`
- [x] Configuration Socket.IO dynamique (utilise `window.location.origin` en production)
- [x] Ajout du support HTTPS dans Socket.IO client
- [x] Configuration CORS dans `lib/socketio.ts` pour autoriser `tech.networkcom.paris`
- [x] Ajout des timeouts et configuration reverse proxy

## 🚀 À Faire sur le Serveur de Production

### 1. Transférer les Fichiers Modifiés
```bash
# Sur votre machine locale, pushez vers Git:
git add .
git commit -m "Fix: Configuration Socket.IO pour production HTTPS"
git push origin main

# Sur le serveur de production:
cd /chemin/vers/FinalFibre-app
git pull origin main
```

**OU si vous ne utilisez pas Git:**
```bash
# Transférer les fichiers via SCP/FTP:
# - hooks/useSocketIO.tsx
# - lib/socketio.ts
# - .env
# - .env.local
```

### 2. Vérifier les Variables d'Environnement sur le Serveur
```bash
# Sur le serveur de production, éditez .env:
nano .env

# Assurez-vous que ces lignes existent:
NEXT_PUBLIC_APP_URL=https://tech.networkcom.paris
NODE_ENV=production

# Les clés VAPID doivent aussi être présentes:
VAPID_PUBLIC_KEY=BLZZNzGYoo6KLhGm_qVQDIjPWcLZVYeWwPILUwBwaBKL7lEKUQ24f7CWR2GmFhaEiKU_jDDTLv9fo52Ym8xqmak
VAPID_PRIVATE_KEY=(votre clé privée)
```

### 3. Rebuild l'Application
```bash
# Sur le serveur de production:
npm run build
```

### 4. Redémarrer le Serveur Node.js
```bash
# Si vous utilisez PM2:
pm2 restart all

# OU si vous utilisez systemd:
sudo systemctl restart finalfibre

# OU si vous utilisez directement node:
# Tuez le processus actuel et relancez:
npm run start
```

### 5. Vérifier Nginx (SI APPLICABLE)
```bash
# Vérifiez votre configuration nginx:
sudo nano /etc/nginx/sites-available/tech.networkcom.paris

# Assurez-vous que WebSocket est activé (voir NOTIFICATION_PRODUCTION_FIX.md)
# Ensuite:
sudo nginx -t
sudo systemctl reload nginx
```

## 🧪 Tests Après Déploiement

### Test 1: Vérifier Socket.IO
```bash
# Depuis votre machine ou le serveur:
curl https://tech.networkcom.paris/api/socketio
```

**Résultat attendu:**
```json
{
  "connected": true,
  "message": "Socket.IO opérationnel",
  "activeConnections": 0
}
```

### Test 2: Console Navigateur
1. Allez sur `https://tech.networkcom.paris/logintech`
2. Connectez-vous en tant que technicien
3. Ouvrez la console développeur (F12)
4. Cherchez ces messages:
   - ✅ `🔌 Connexion Socket.IO à: https://tech.networkcom.paris`
   - ✅ `🔌 Connecté au serveur Socket.IO`
   - ✅ `✅ Authentification Socket.IO réussie`

### Test 3: Notification Réelle
1. Connectez un technicien sur `https://tech.networkcom.paris/logintech`
2. Depuis l'interface admin, créez une pénalité pour ce technicien
3. **Vérification:**
   - [ ] Notification apparaît instantanément dans NotificationCenter
   - [ ] Son de notification joue
   - [ ] Notification système apparaît (si autorisée)

### Test 4: Logs Serveur
```bash
# Surveillez les logs:
pm2 logs finalfibre --lines 50

# OU
tail -f /var/log/finalfibre/app.log
```

**Messages attendus:**
```
🔌 Initialisation du serveur Socket.IO...
🔐 CORS autorisés: [ 'https://tech.networkcom.paris', 'http://localhost:3000' ]
🔌 Nouvelle connexion Socket.IO: [socket-id]
👤 Employé 123 connecté avec socket [socket-id]
📨 Notification Socket.IO pénalité: OUI
```

## ⚠️ Problèmes Possibles et Solutions

### ❌ Socket.IO ne se connecte pas
**Symptômes:** Console montre des erreurs CORS ou timeout

**Solutions:**
1. Vérifier que `NEXT_PUBLIC_APP_URL` est correct dans `.env` du serveur
2. Reconstruire: `npm run build`
3. Vérifier nginx autorise WebSocket (voir NOTIFICATION_PRODUCTION_FIX.md)
4. Vérifier firewall n'bloque pas le port 3000

### ❌ Notifications n'apparaissent pas
**Symptômes:** Connexion OK mais pas de notifications

**Solutions:**
1. Vérifier les logs serveur: `pm2 logs | grep "Notification"`
2. Vérifier la table `push_subscriptions` dans PostgreSQL
3. Vérifier que le technicien a autorisé les notifications navigateur
4. Tester avec un autre technicien

### ❌ Erreur "Socket.IO non initialisé"
**Symptômes:** API retourne 503

**Solutions:**
1. Le serveur n'utilise pas `server.js` custom
2. Vérifier comment vous démarrez l'app: doit être `node server.js`
3. Vérifier dans package.json: `"start": "node server.js"`

## 📊 Commandes Utiles Debug

```bash
# Voir tous les processus Node:
ps aux | grep node

# Voir l'utilisation des ports:
sudo netstat -tulpn | grep :3000

# Tester la connexion WebSocket:
wscat -c wss://tech.networkcom.paris/api/socketio

# Vérifier les variables d'environnement:
pm2 env 0  # où 0 est l'ID du processus PM2
```

## ✅ Validation Finale

Une fois TOUT testé et fonctionnel:
- [ ] Socket.IO se connecte correctement
- [ ] Notifications pénalités fonctionnent
- [ ] Notifications réclamations fonctionnent
- [ ] Notifications push système fonctionnent
- [ ] Pas d'erreurs dans les logs serveur
- [ ] Pas d'erreurs dans console navigateur

## 📝 Notes
Date de déploiement: _______________
Testé par: _______________
Version: _______________

**Si tout fonctionne:** 🎉 Les notifications sont maintenant opérationnelles en production!

**Si problèmes persistent:** Consultez `NOTIFICATION_PRODUCTION_FIX.md` section Troubleshooting.
