# Fix du Cache pour les Réclamations

## Problème
Les réclamations n'apparaissaient pas immédiatement après leur création/modification. Il fallait faire Ctrl+F5 pour forcer le rechargement et voir les nouvelles données.

## Solution Implémentée

### 1. Headers de Cache
Ajout de headers HTTP pour éviter la mise en cache côté serveur et navigateur :

```typescript
// Headers ajoutés à toutes les réponses API des réclamations
response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
response.headers.set('Pragma', 'no-cache')
response.headers.set('Expires', '0')
response.headers.set('Surrogate-Control', 'no-store')
```

### 2. Directive Next.js
Ajout de `export const dynamic = 'force-dynamic'` aux routes API pour forcer le rendu dynamique.

### 3. Fonction Utilitaire
Création de `lib/cache-headers.ts` avec une fonction réutilisable :

```typescript
export function addNoCacheHeaders(response: NextResponse): NextResponse
```

### 4. Routes Modifiées
- `app/api/reclamations/route.ts` (GET, POST, PUT)
- `app/api/reclamations/resolve/route.ts` (POST)
- `app/api/reclamations/validate/route.ts` (POST)

## Résultat
- ✅ Les réclamations apparaissent immédiatement sans Ctrl+F5
- ✅ Pas de cache côté serveur ou navigateur
- ✅ Données toujours fraîches
- ✅ Performance maintenue

## Test
1. Créer une nouvelle réclamation
2. Vérifier qu'elle apparaît immédiatement dans la liste
3. Modifier une réclamation existante
4. Vérifier que les changements sont visibles sans rechargement forcé
