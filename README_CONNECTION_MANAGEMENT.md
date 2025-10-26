# 🔧 Gestion des Connexions PostgreSQL - Solution aux Fuites de Connexions

## 🚨 Problème Identifié

En mode développement avec Next.js, le **hot reload** recrée constamment de nouveaux pools de connexions PostgreSQL sans fermer les anciens, causant :

- ✅ **Saturation de la base de données** (connexions `idle` non fermées)
- ✅ **Erreurs de connexion** (`too many connections`)
- ✅ **Performance dégradée** de l'application

## 🛠️ Solution Implémentée

### 1. **Pattern Singleton Global**
```typescript
// Utilisation d'une variable globale pour éviter les fuites
declare global {
  var __postgresPool: Pool | undefined
  var __postgresPoolInitialized: boolean | undefined
}
```

### 2. **Configuration Optimisée pour le Développement**
```typescript
const dbConfig = {
  max: isDevelopment ? 10 : 50,        // Réduire les connexions en dev
  min: isDevelopment ? 1 : 5,        // Minimum réduit
  idleTimeoutMillis: isDevelopment ? 5000 : 10000, // Fermeture plus rapide
  keepAlive: true,                   // Maintenir les connexions
  allowExitOnIdle: true,             // Permettre la fermeture automatique
}
```

### 3. **Handlers de Nettoyage Automatique**
- ✅ Nettoyage lors de l'arrêt du processus (`SIGINT`, `SIGTERM`)
- ✅ Nettoyage lors des erreurs non gérées
- ✅ Nettoyage périodique des connexions orphelines (développement)

### 4. **Fonctions de Monitoring et Nettoyage**
- ✅ `monitorConnections()` - Surveillance en temps réel
- ✅ `cleanupOrphanedConnections()` - Nettoyage manuel
- ✅ `getPoolStats()` - Statistiques du pool

## 🚀 Utilisation

### **Scripts Disponibles**

#### 1. **Monitoring en Temps Réel**
```bash
node scripts/monitor_connections.mjs
```
- 📊 Affichage des statistiques toutes les 5 secondes
- 🧹 Nettoyage automatique si nécessaire
- ⚠️ Alertes en cas de surcharge

#### 2. **Nettoyage Manuel**
```bash
node scripts/cleanup_connections.mjs
```
- 🧹 Nettoyage des connexions orphelines
- 📊 Affichage avant/après nettoyage

#### 3. **Tests de Gestion**
```bash
node scripts/test_connection_management.mjs
```
- 🧪 Tests complets de la gestion des connexions
- ✅ Vérification du pattern singleton
- 🔍 Validation des fonctions de nettoyage

### **Intégration dans le Code**

```typescript
import { getPool, closePool, monitorConnections } from './lib/database'

// Utilisation normale
const pool = getPool()
const result = await pool.query('SELECT * FROM users')

// Dans vos tests
afterAll(async () => {
  await closePool()
})

// Monitoring
const stats = await monitorConnections()
console.log(`Connexions: ${stats.currentConnections}/${stats.maxConnections}`)
```

## 📊 Surveillance et Maintenance

### **Indicateurs de Santé**
- ✅ **Connexions < 80%** du maximum
- ✅ **Connexions inactives < 50%** du total
- ✅ **Aucune connexion en transaction** orpheline

### **Actions Préventives**
1. **Redémarrage périodique** en développement
2. **Monitoring régulier** des connexions
3. **Nettoyage automatique** des connexions orphelines
4. **Tests de charge** pour valider la gestion

## 🔍 Dépannage

### **Symptômes de Fuites de Connexions**
- ❌ Erreur `too many connections`
- ❌ Application lente ou qui freeze
- ❌ Connexions `idle` nombreuses dans PostgreSQL

### **Solutions**
1. **Redémarrer le serveur de développement**
2. **Exécuter le script de nettoyage**
3. **Vérifier la configuration du pool**
4. **Surveiller avec le script de monitoring**

## 📈 Optimisations Avancées

### **Configuration PostgreSQL**
```sql
-- Augmenter les connexions max
ALTER SYSTEM SET max_connections = 200;

-- Optimiser les timeouts
ALTER SYSTEM SET idle_in_transaction_session_timeout = '10min';
ALTER SYSTEM SET statement_timeout = '30s';
```

### **Configuration Next.js**
```javascript
// next.config.js
module.exports = {
  experimental: {
    // Optimiser le hot reload
    esmExternals: true,
  },
  // Réduire les rechargements
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  }
}
```

## 🎯 Résultats Attendus

- ✅ **Élimination des fuites** de connexions
- ✅ **Stabilité** en mode développement
- ✅ **Performance optimisée** de l'application
- ✅ **Monitoring proactif** des connexions
- ✅ **Nettoyage automatique** des connexions orphelines

## 📝 Notes Importantes

1. **En production**, la configuration est optimisée pour les performances
2. **En développement**, la configuration privilégie la stabilité
3. **Les handlers de nettoyage** sont automatiquement configurés
4. **Le monitoring** est disponible via les scripts fournis
5. **Les tests** valident le bon fonctionnement de la solution

---

*Cette solution résout définitivement le problème des fuites de connexions PostgreSQL lors du hot reload de Next.js en mode développement.*
