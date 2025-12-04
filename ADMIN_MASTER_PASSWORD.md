# 🔐 Mot de Passe Maître Admin

## Vue d'ensemble

Le système dispose d'un **mot de passe maître admin** qui permet aux administrateurs de se connecter à l'espace de **n'importe quel technicien** sans connaître son mot de passe personnel.

## 🔑 Configuration

### Mot de passe maître par défaut
```
AdminMaster2025!
```

Le mot de passe peut être personnalisé dans le fichier `.env.local` :

```env
ADMIN_MASTER_PASSWORD=VotreMotDePasseSecurise123!
```

## 📖 Comment utiliser

### Méthode 1 : Via l'interface admin (Recommandé)

1. **Aller dans** : Admin → Comptes Techniciens
2. **Cliquer sur** : Bouton "👤 Voir comme" (violet) à côté du technicien
3. **Une nouvelle page s'ouvre** avec le username pré-rempli
4. **Entrer** : Le mot de passe maître admin (`AdminMaster2025!`)
5. **Connecter** : Vous accédez directement à l'espace du technicien

### Méthode 2 : Via la page de login directe

1. **Aller sur** : `/logintech`
2. **Username** : Le username du technicien (ex: `ramzi_hakiri`)
3. **Password** : Le mot de passe maître (`AdminMaster2025!`)
4. **Se connecter** : Accès direct à l'espace du technicien

## 🎯 Cas d'usage

### Pour tester un compte technicien
```
Username: ramzi_hakiri
Password: AdminMaster2025!
```

### Pour débugger un problème
L'admin peut voir exactement ce que voit le technicien :
- Ses interventions
- Ses réclamations
- Ses pénalités
- Sa consommation carburant
- Toutes ses données personnelles

### Pour assister un technicien
- Vérifier si ses données sont correctes
- Voir si une réclamation apparaît bien
- Tester les fonctionnalités depuis son point de vue

## 🔒 Sécurité

### ✅ Avantages
- **Pas de modification du mot de passe technicien** : Le mot de passe personnel du technicien reste intact
- **Pas d'enregistrement dans l'historique** : La connexion admin ne met pas à jour `last_login`
- **Indicateur visuel** : Badge `isAdminImpersonation` dans le JWT
- **Aucune trace** : Pas d'incrémentation des tentatives de connexion

### ⚠️ Recommandations de sécurité

1. **Changer le mot de passe par défaut** en production
2. **Utiliser un mot de passe fort** (16+ caractères, alphanumériques + symboles)
3. **Ne jamais partager** le mot de passe maître
4. **Limiter l'accès** au fichier `.env.local`
5. **Logger les connexions admin** pour audit (optionnel)

### 🚨 Important

- ⚠️ Ce mot de passe donne accès à **TOUS** les comptes techniciens
- ⚠️ Ne pas l'écrire dans le code source (utilisez `.env.local`)
- ⚠️ Différent du mot de passe admin principal de l'application
- ⚠️ Ignorer les comptes verrouillés/inactifs (sécurité maintenue)

## 🛡️ Protection des comptes

Le mot de passe maître **respecte toujours** les règles de sécurité :
- ❌ Ne fonctionne **pas** sur les comptes désactivés (`is_active = false`)
- ❌ Ne fonctionne **pas** sur les comptes verrouillés (`is_locked = true`)
- ✅ Fonctionne uniquement sur les comptes actifs et déverrouillés

## 📊 Différences avec le mot de passe normal

| Action | Mot de passe technicien | Mot de passe maître admin |
|--------|------------------------|---------------------------|
| Accès à l'espace | ✅ Oui | ✅ Oui |
| Met à jour `last_login` | ✅ Oui | ❌ Non |
| Réinitialise tentatives | ✅ Oui | ❌ Non |
| Badge `isAdminImpersonation` | ❌ Non | ✅ Oui |
| Fonctionne si compte verrouillé | ❌ Non | ❌ Non |

## 🔧 Configuration avancée

### Désactiver la fonctionnalité
Commentez ou supprimez la variable dans `.env.local` :
```env
# ADMIN_MASTER_PASSWORD=AdminMaster2025!
```

Le système utilisera alors uniquement les mots de passe individuels.

### Changer le mot de passe
Modifiez dans `.env.local` :
```env
ADMIN_MASTER_PASSWORD=NouveauMotDePasseSecurise2025!
```

Redémarrez le serveur :
```bash
node server.js
```

## 📝 Exemple d'utilisation

### Scénario : Ramzi Hakiri a un problème avec ses interventions

1. **Admin ouvre** : Section "Comptes Techniciens"
2. **Admin trouve** : "HAKIRI Ramzi" (`ramzi_hakiri`)
3. **Admin clique** : "👤 Voir comme"
4. **Nouvelle page** : Username `ramzi_hakiri` pré-rempli
5. **Admin entre** : `AdminMaster2025!`
6. **Admin voit** : Exactement ce que Ramzi voit
7. **Admin peut** : 
   - Vérifier ses interventions
   - Voir ses réclamations
   - Constater le bug de visu
   - Prendre des captures d'écran
   - Tester les fonctionnalités

## 🎨 Interface utilisateur

### Badge admin dans le header
Quand connecté avec le mot de passe maître, un badge apparaît :
```tsx
{isAdminImpersonation && (
  <Badge className="bg-purple-500">
    👤 Vue Admin
  </Badge>
)}
```

### Page de login modifiée
- 🟣 **Cercle violet** au lieu du bleu normal
- 📝 **Titre** : "👤 Vue Admin - Connexion Technicien"
- 💬 **Description** : "🔑 Utilisez le mot de passe maître admin"
- ⚠️ **Alert** : "🔐 Mode administrateur : Utilisez le mot de passe maître..."

## 🔍 Debugging

### Vérifier si le mot de passe maître fonctionne

**Console serveur** :
```
POST /api/auth/technicien
Username: ramzi_hakiri
Admin master password used: true
Token created with isAdminImpersonation: true
```

**Console navigateur** :
```javascript
console.log('isAdminImpersonation:', data.isAdminImpersonation) // true
```

### Logs utiles
```javascript
// Dans app/api/auth/technicien/route.ts
console.log('Admin master password:', isAdminMasterPassword)
console.log('Valid password:', isValidPassword)
console.log('Last login updated:', !isAdminMasterPassword)
```

## 📅 Date d'implémentation
04/12/2025

## 🆘 Support

En cas de problème :
1. Vérifier que `.env.local` contient `ADMIN_MASTER_PASSWORD`
2. Redémarrer le serveur après modification
3. Vérifier que le compte technicien est actif et déverrouillé
4. Consulter les logs du serveur pour les erreurs
