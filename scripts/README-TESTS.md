# 🚀 Guide de Test de Charge - 10 Utilisateurs Simultanés

## 📋 Préparation

### 1. Vérifier que le serveur fonctionne
```bash
# Démarrer le serveur Next.js
npm run dev

# Dans un autre terminal, vérifier que l'API répond
curl http://localhost:3000/api/sections
```

### 2. Vérifier les utilisateurs de test
Assurez-vous que ces utilisateurs existent dans la base de données :
- `admin@fibertech.com` / `admin123`
- `admin@dgflow.com` / `admin@dgflow.com`
- `ttest@gmail.com` / `ttest@gmail.com`
- `test_user@gmail.com` / `test_user@gmail.com`
- `test@gmail.com` / `test@gmail.com`
- `chef@finalfibre.com` / `chef@finalfibre.com`
- `test_chef@example.com` / `test_chef@example.com`
- `test_new@example.com` / `test_new@example.com`
- `admin@finalfibre.com` / `admin@finalfibre.com`
- `test_user_new` / `test_user_new`

## 🧪 Tests Disponibles

### 1. Test Rapide (Recommandé pour commencer)
```bash
node scripts/quick-test.js
```
**Durée :** ~30 secondes  
**Utilisateurs :** 10 simultanés  
**Actions :** Login + quelques requêtes

### 2. Test Simple
```bash
node scripts/simple-load-test.js
```
**Durée :** 2 minutes  
**Utilisateurs :** 10 simultanés  
**Actions :** Login + navigation + requêtes répétées

### 3. Test Complet
```bash
node scripts/load-test.js
```
**Durée :** 5 minutes  
**Utilisateurs :** 10 avec montée en charge  
**Actions :** Scénarios complets

### 4. Monitoring des Performances
```bash
node scripts/monitor-performance.js
```
**Durée :** 5 minutes  
**Actions :** Surveillance continue du serveur

## 📊 Interprétation des Résultats

### ✅ Performance Excellente
- **Temps de réponse moyen :** < 1000ms
- **Taux d'erreur :** < 1%
- **Temps max :** < 2000ms

### ⚠️ Performance Acceptable
- **Temps de réponse moyen :** 1000-2000ms
- **Taux d'erreur :** 1-5%
- **Temps max :** 2000-5000ms

### ❌ Performance Dégradée
- **Temps de réponse moyen :** > 2000ms
- **Taux d'erreur :** > 5%
- **Temps max :** > 5000ms

## 🔧 Optimisations Recommandées

### Si les performances sont dégradées :

#### 1. Base de données PostgreSQL
```sql
-- Augmenter les connexions
ALTER SYSTEM SET max_connections = 200;

-- Optimiser les requêtes
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';

-- Redémarrer PostgreSQL
```

#### 2. Application Next.js
```javascript
// Dans next.config.js
module.exports = {
  experimental: {
    serverComponentsExternalPackages: ['pg']
  },
  // Optimiser les images
  images: {
    domains: ['localhost']
  }
}
```

#### 3. Requêtes SQL
- Ajouter des index sur les colonnes fréquemment utilisées
- Optimiser les requêtes avec EXPLAIN ANALYZE
- Utiliser la pagination pour les grandes listes

## 📈 Plan de Test Recommandé

### Phase 1 : Test de Base (5 min)
1. **Monitoring** : `node scripts/monitor-performance.js`
2. **Test rapide** : `node scripts/quick-test.js`
3. **Analyse** : Vérifier que tout fonctionne

### Phase 2 : Test de Charge (10 min)
1. **Test simple** : `node scripts/simple-load-test.js`
2. **Analyse** : Identifier les goulots d'étranglement
3. **Optimisation** : Appliquer les corrections

### Phase 3 : Test de Validation (5 min)
1. **Test complet** : `node scripts/load-test.js`
2. **Validation** : Vérifier que les optimisations fonctionnent
3. **Rapport** : Documenter les résultats

## 🎯 Objectifs de Performance

### Pour 10 utilisateurs simultanés :
- **Temps de réponse :** < 2 secondes
- **Taux d'erreur :** < 5%
- **Disponibilité :** > 99%
- **Requêtes/seconde :** > 10

### Métriques à surveiller :
- **CPU** : < 80%
- **RAM** : < 80%
- **Connexions DB** : < 50
- **Temps de réponse DB** : < 500ms

## 🚨 Dépannage

### Erreurs fréquentes :

#### 1. "Impossible de se connecter au serveur distant"
- Vérifiez que le serveur Next.js est démarré
- Vérifiez que le port 3000 est libre

#### 2. "Erreur 500" fréquentes
- Vérifiez les logs du serveur Next.js
- Vérifiez la connexion à la base de données
- Vérifiez les limites de connexions PostgreSQL

#### 3. "Timeout" des requêtes
- Augmentez les limites de connexions
- Optimisez les requêtes SQL
- Vérifiez la charge CPU/RAM

## 📝 Rapport de Test

Après chaque test, documentez :
1. **Configuration** : Nombre d'utilisateurs, durée
2. **Résultats** : Temps de réponse, erreurs, throughput
3. **Problèmes** : Erreurs identifiées, goulots d'étranglement
4. **Optimisations** : Actions correctives appliquées
5. **Validation** : Résultats après optimisations

## 🎉 Conclusion

Ces tests vous permettront de :
- ✅ Vérifier que votre application supporte 10 utilisateurs simultanés
- ✅ Identifier les goulots d'étranglement
- ✅ Optimiser les performances
- ✅ Valider la stabilité du système

**Commencez par le test rapide pour vérifier que tout fonctionne !**
