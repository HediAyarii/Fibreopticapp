# Fix: Mise à jour en temps réel des réclamations techniques

## Problème
Les réclamations techniques ne se mettaient pas à jour automatiquement en temps réel :
- ✅ Technicien → Admin : Fonctionnait (création de réclamation visible immédiatement)
- ❌ Admin → Technicien : Ne fonctionnait pas (changement de statut nécessitait un refresh de page)

## Cause racine
1. **Socket.IO non accessible côté serveur** : Dans Next.js 14 App Router, les routes API s'exécutent dans des workers séparés et n'avaient pas accès à l'instance Socket.IO globale initialisée dans `server.js`
2. **Émission serveur défaillante** : Les fonctions `sendReclamationTechniqueCreated` et `sendReclamationTechniqueUpdated` ne pouvaient pas récupérer l'instance Socket.IO

## Solution implémentée

### 1. Stockage global de Socket.IO (`lib/socketio.js`)
Utilisation d'une propriété globale stable `global._socketIO` pour partager l'instance entre tous les contextes Node.js :

```javascript
// Avant
let io = null
global.socketIOInstance = null

// Après
if (typeof global !== 'undefined' && !global._socketIO) {
  global._socketIO = null;
}

function getIO() {
  return global._socketIO;
}

function setIO(instance) {
  global._socketIO = instance;
}
```

### 2. Émission côté client comme fallback (`components/ReclamationsTechniques.tsx`)
Quand l'admin met à jour une réclamation, le client Socket.IO émet l'événement qui est ensuite rebroadcasté par le serveur :

```typescript
if (data.success) {
  // Émettre l'événement Socket.IO pour mise à jour en temps réel
  if (socket && data.reclamation) {
    socket.emit('reclamation_technique_updated', data.reclamation)
    console.log('✅ Événement Socket.IO émis depuis le client admin')
  }
  
  await fetchReclamations();
  // ...
}
```

### 3. Listeners Socket.IO côté technicien (`components/TechnicienReclamations.tsx`)
Écoute des événements Socket.IO avec rechargement automatique des données :

```typescript
useEffect(() => {
  if (!socket) return;

  const handleUpdatedReclamation = (updatedReclamation: Reclamation) => {
    console.log('🔄 [Socket.IO] Réclamation mise à jour:', updatedReclamation);
    fetchReclamations(); // Recharge toutes les réclamations
  };

  socket.on('reclamation_technique_created', handleCreatedReclamation);
  socket.on('reclamation_technique_updated', handleUpdatedReclamation);
  
  return () => {
    socket.off('reclamation_technique_created', handleCreatedReclamation);
    socket.off('reclamation_technique_updated', handleUpdatedReclamation);
  };
}, [socket, fetchReclamations]);
```

### 4. Broadcast serveur (`lib/socketio.js`)
Le serveur Socket.IO écoute les événements des clients et les rebroadcaste à tous :

```javascript
socket.on('reclamation_technique_updated', (reclamation) => {
  console.log('📢 Broadcast reclamation_technique_updated à tous les clients:', reclamation.id)
  io.emit('reclamation_technique_updated', reclamation)
})
```

### 5. Monitoring des événements (`contexts/SocketContext.tsx`)
Ajout d'un logger universel pour débugger tous les événements Socket.IO :

```typescript
socketInstance.onAny((eventName, ...args) => {
  console.log(`🔔 [Socket.IO Event] ${eventName}:`, args);
});
```

## Fichiers modifiés

1. **`lib/socketio.js`**
   - Utilisation de `global._socketIO` au lieu de variables locales
   - Fonctions `getIO()` et `setIO()` pour accès centralisé
   - Amélioration des logs de broadcast

2. **`components/ReclamationsTechniques.tsx`**
   - Ajout d'émission Socket.IO dans `handleUpdateStatut`
   - Émission via le client quand l'admin change le statut

3. **`components/TechnicienReclamations.tsx`**
   - Listeners Socket.IO pour `reclamation_technique_created` et `reclamation_technique_updated`
   - Rechargement automatique via `fetchReclamations()`
   - Logs détaillés pour monitoring

4. **`contexts/SocketContext.tsx`**
   - Ajout de `socketInstance.onAny()` pour logger tous les événements
   - Meilleure visibilité du flux d'événements

5. **`app/api/reclamations/signal/route.ts`**
   - Insertion dans `reclamations_techniques` au lieu de `reclamations`
   - Récupération des infos technicien depuis la table `employes`

6. **`app/api/reclamations-techniques/route.ts`**
   - Recherche par `technicien_id` en priorité (plus fiable que nom/prénom)
   - Recherche insensible à la casse avec `UPPER()`
   - Correction du champ `technicien_id` au lieu de `employe_id`

7. **`lib/socketio.ts`** (supprimé)
   - Fichier TypeScript supprimé pour éviter les conflits avec `socketio.js`

## Flux de mise à jour en temps réel

### Création de réclamation (Technicien → Admin)
```
1. Technicien clique "Signaler un problème"
2. POST /api/reclamations/signal → INSERT dans reclamations_techniques
3. API émet window.dispatchEvent('reclamationCreated')
4. TechnicienReclamations écoute 'reclamationCreated' → fetchReclamations()
5. Statistiques mises à jour instantanément
```

### Mise à jour de statut (Admin → Technicien)
```
1. Admin marque réclamation comme "Résolue"
2. PATCH /api/reclamations-techniques → UPDATE reclamations_techniques
3. Client admin émet socket.emit('reclamation_technique_updated', reclamation)
4. Serveur Socket.IO reçoit l'événement
5. Serveur broadcast io.emit('reclamation_technique_updated', reclamation)
6. Client technicien reçoit l'événement via socket.on('reclamation_technique_updated')
7. TechnicienReclamations → fetchReclamations()
8. Statistiques mises à jour instantanément
```

## Logs de débogage

### Démarrage serveur
```
🔌 Initialisation du serveur Socket.IO...
✅ Instance Socket.IO stockée dans global._socketIO
✅ Serveur Socket.IO initialisé avec succès
🚀 Serveur démarré sur http://localhost:3000
```

### Connexion client
```
🔌 Nouvelle connexion Socket.IO: xyz123
👤 Employé 28 connecté avec socket xyz123
```

### Mise à jour réclamation (Admin)
```
[Console Admin]
✅ Événement Socket.IO émis depuis le client admin (statut): {id: 42, statut: 'resolu'}

[Console Serveur]
📢 Broadcast reclamation_technique_updated à tous les clients: 42

[Console Technicien]
🔔 [Socket.IO Event] reclamation_technique_updated: [{id: 42, statut: 'resolu', ...}]
🔄 [Socket.IO] Réclamation mise à jour: {id: 42, statut: 'resolu'}
🔍 TechnicienReclamations: Chargement avec params...
📊 TechnicienReclamations: Réponse API: {success: true, count: 12}
```

## Commandes de démarrage

```bash
# Démarrage avec Socket.IO
node server.js

# OU
npm start

# NOT: npm run dev (utilise next dev sans Socket.IO custom)
```

## Tests de validation

1. **Test création réclamation**
   - Ouvrir dashboard technicien
   - Signaler un problème sur une intervention
   - ✅ Statistiques "Total" et "En Attente" s'incrémentent sans refresh

2. **Test mise à jour statut**
   - Ouvrir admin (section Réclamations Techniques)
   - Ouvrir dashboard technicien dans un autre onglet
   - Admin marque réclamation comme "Résolue"
   - ✅ Côté technicien : "Résolus" s'incrémente, "En Attente" décrémente sans refresh

3. **Test multi-utilisateurs**
   - Connecter plusieurs techniciens
   - Admin change statut d'une réclamation
   - ✅ Tous les techniciens concernés voient la mise à jour

## Notes importantes

- ⚠️ Toujours utiliser `node server.js` ou `npm start` (pas `npm run dev` seul)
- ⚠️ Socket.IO nécessite un serveur HTTP custom (défini dans `server.js`)
- ✅ En production, Socket.IO fonctionne nativement avec Next.js standalone
- ✅ Les événements window ('reclamationCreated') servent de fallback local
- ✅ Les événements Socket.IO assurent la synchronisation multi-clients

## Date de résolution
04/12/2025
