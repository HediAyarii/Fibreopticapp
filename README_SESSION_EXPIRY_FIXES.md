# Gestion des Sessions Expirées - Améliorations

## Problème Résolu

Avant ces améliorations, quand la session d'un technicien expirait :
- L'utilisateur restait bloqué sur le dashboard
- Aucune redirection automatique vers `/logintech`
- Les cookies expirés n'étaient pas supprimés
- Pas de vérification périodique de la validité de la session

## Solutions Implémentées

### 1. **Suppression Automatique des Cookies Expirés**

**API d'authentification (`/api/auth/technicien`)**
- Supprime automatiquement le cookie quand le token est manquant
- Supprime le cookie quand le token est invalide ou expiré
- Supprime le cookie quand le compte est désactivé ou verrouillé

```typescript
// Exemple dans l'API
if (!token) {
  const response = NextResponse.json({ error: "Token manquant" }, { status: 401 })
  response.cookies.set('technicien_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0  // Supprime le cookie
  })
  return response
}
```

### 2. **Gestionnaire d'Authentification Global**

**Nouveau fichier : `lib/authManager.ts`**
- Classe singleton pour gérer les sessions expirées
- Détection automatique des erreurs 401
- Redirection automatique vers `/logintech`
- Suppression des cookies côté client

```typescript
// Utilisation
const response = await fetchWithAuth('/api/interventions?employe_id=1')
// Si session expirée → redirection automatique vers /logintech
```

### 3. **Vérification Périodique des Sessions**

**Dashboard technicien**
- Vérification automatique toutes les 5 minutes
- Détection des sessions expirées en temps réel
- Redirection immédiate si session invalide

```typescript
// Vérification périodique
useEffect(() => {
  const interval = setInterval(() => {
    if (user) {
      checkAuth()
    }
  }, 5 * 60 * 1000) // 5 minutes

  return () => clearInterval(interval)
}, [user])
```

### 4. **Amélioration de la Page de Login**

**Page `/logintech`**
- Vérification au chargement si déjà connecté
- Redirection automatique vers le dashboard si session valide
- Gestion des sessions existantes

### 5. **Hook d'Authentification Amélioré**

**Hook `useAuth`**
- Détection des erreurs 401
- Redirection automatique vers `/logintech`
- Gestion des sessions expirées

## Fonctionnalités

### ✅ **Redirection Automatique**
- Session expirée → Redirection vers `/logintech`
- Session valide sur `/logintech` → Redirection vers dashboard
- Détection en temps réel des sessions invalides

### ✅ **Nettoyage des Cookies**
- Suppression côté serveur (API)
- Suppression côté client (JavaScript)
- Prévention des cookies fantômes

### ✅ **Vérification Périodique**
- Contrôle automatique toutes les 5 minutes
- Détection des sessions expirées sans action utilisateur
- Maintien de la sécurité

### ✅ **Gestion d'Erreurs Robuste**
- Gestion des erreurs réseau
- Gestion des erreurs d'authentification
- Fallback vers la page de login

## Utilisation

### Pour les Développeurs

```typescript
// Utiliser le gestionnaire d'auth pour toutes les requêtes
import { fetchWithAuth } from '@/lib/authManager'

// Au lieu de fetch()
const response = await fetchWithAuth('/api/interventions?employe_id=1')
```

### Pour les Utilisateurs

1. **Connexion normale** : Fonctionne comme avant
2. **Session expirée** : Redirection automatique vers `/logintech`
3. **Déconnexion** : Suppression complète des cookies
4. **Vérification périodique** : Transparente pour l'utilisateur

## Tests

### Scénarios Testés

1. **Session expirée pendant navigation**
   - ✅ Redirection vers `/logintech`
   - ✅ Suppression des cookies
   - ✅ Message d'erreur approprié

2. **Session expirée après inactivité**
   - ✅ Détection par vérification périodique
   - ✅ Redirection automatique
   - ✅ Pas de blocage de l'interface

3. **Connexion avec session existante**
   - ✅ Redirection vers dashboard
   - ✅ Pas de double authentification

4. **Déconnexion manuelle**
   - ✅ Suppression des cookies
   - ✅ Redirection vers `/logintech`
   - ✅ Nettoyage de l'état

## Configuration

### Variables d'Environnement
```env
JWT_SECRET=finalfibre-super-secret-jwt-key-2025-technicien-auth
```

### Durée des Sessions
- **Token JWT** : 24 heures
- **Vérification périodique** : 5 minutes
- **Cookie** : HTTPOnly, Secure, SameSite

## Dépannage

### Problèmes Courants

1. **Redirection en boucle**
   - Vérifier le middleware
   - Vérifier les cookies
   - Vérifier la configuration JWT

2. **Session non détectée**
   - Vérifier les logs du serveur
   - Vérifier la base de données
   - Vérifier les cookies dans le navigateur

3. **Cookie non supprimé**
   - Vérifier les paramètres du cookie
   - Vérifier le domaine et le path
   - Vérifier les paramètres de sécurité

### Logs Utiles

```bash
# Vérifier les sessions actives
docker exec -i finalfibre-postgres psql -U finalfibre_user -d finalfibre_db -c "SELECT * FROM technicien_sessions;"

# Vérifier les comptes
docker exec -i finalfibre-postgres psql -U finalfibre_user -d finalfibre_db -c "SELECT * FROM technicien_accounts;"
```

## Sécurité

### Améliorations de Sécurité

1. **Suppression automatique des cookies expirés**
2. **Vérification périodique des sessions**
3. **Redirection forcée en cas de session invalide**
4. **Prévention des sessions fantômes**
5. **Gestion robuste des erreurs d'authentification**

### Bonnes Pratiques

- Utiliser `fetchWithAuth()` pour toutes les requêtes API
- Vérifier périodiquement l'état d'authentification
- Supprimer les cookies côté client et serveur
- Rediriger immédiatement en cas de session expirée
- Logger les événements d'authentification

## Conclusion

Ces améliorations garantissent une expérience utilisateur fluide et sécurisée :
- **Pas de blocage** sur des pages avec session expirée
- **Redirection automatique** vers la page de login
- **Nettoyage complet** des données de session
- **Vérification périodique** transparente
- **Gestion robuste** des erreurs

Le système est maintenant plus robuste et offre une meilleure expérience utilisateur ! 🎉
