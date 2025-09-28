# Système de Notifications Temps Réel

## Vue d'ensemble

Le système de notifications temps réel permet aux techniciens de recevoir instantanément des alertes lorsqu'une réclamation ou une pénalité leur est assignée depuis l'espace admin.

## Fonctionnalités

### 🔔 Notifications Temps Réel
- **Socket.IO** : Connexion WebSocket pour les notifications instantanées
- **Authentification** : Chaque technicien reçoit uniquement ses notifications
- **Persistance** : Les notifications restent visibles jusqu'à être lues/supprimées

### 🔊 Sons de Notification
- **Sons différenciés** : Sons différents pour réclamations et pénalités
- **Volume configurable** : Volume à 70% par défaut
- **Fallback silencieux** : Pas d'erreur si les sons ne peuvent pas être joués

### 📱 Notifications du Navigateur
- **Permission automatique** : Demande de permission au premier chargement
- **Notifications persistantes** : Restent visibles 5 secondes
- **Clic pour focus** : Cliquer sur la notification ramène au site

### 🎨 Interface Utilisateur
- **Badge de compteur** : Affiche le nombre de notifications non lues
- **Panneau déroulant** : Liste des 10 dernières notifications
- **Actions** : Marquer comme lu, supprimer, tout effacer
- **Statut de connexion** : Indicateur visuel de la connexion Socket.IO

## Architecture Technique

### Backend (Serveur)
```
lib/socketio.ts          # Serveur Socket.IO et gestion des connexions
pages/api/socketio.ts    # Route API pour initialiser Socket.IO
app/api/reclamations/    # Intégration notifications réclamations
app/api/penalites/       # Intégration notifications pénalités
```

### Frontend (Client)
```
hooks/useSocketIO.tsx           # Hook React pour Socket.IO
components/NotificationCenter.tsx # Composant interface notifications
app/technicien/dashboard/       # Intégration dans le dashboard
```

## Configuration

### Variables d'Environnement
```env
# Socket.IO Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000  # URL de l'application
NODE_ENV=development                       # Environnement (dev/prod)
```

### Installation des Dépendances
```bash
npm install socket.io
```

## Utilisation

### 1. Côté Technicien
1. **Connexion automatique** : Socket.IO se connecte au chargement du dashboard
2. **Authentification** : L'ID employé est envoyé pour l'authentification
3. **Réception** : Les notifications arrivent automatiquement
4. **Interaction** : Clic sur la cloche pour voir les notifications

### 2. Côté Admin
1. **Création** : Créer une réclamation ou pénalité depuis l'espace admin
2. **Assignation** : Assigner à un technicien spécifique
3. **Envoi automatique** : La notification est envoyée instantanément
4. **Confirmation** : Logs dans la console pour confirmer l'envoi

## Types de Notifications

### Réclamations
```typescript
{
  id: "reclamation_1234567890",
  type: "reclamation",
  title: "🚨 Nouvelle Réclamation",
  message: "Réclamation REC-2025-0001 - Client",
  timestamp: "2025-01-27T10:30:00Z",
  employeeId: 123,
  data: {
    numero_reclamation: "REC-2025-0001",
    type_reclamation: "Client",
    description: "Problème technique signalé",
    delai_resolution: 7,
    intervention_client: "Entreprise ABC"
  }
}
```

### Pénalités
```typescript
{
  id: "penalite_1234567890",
  type: "penalite", 
  title: "💰 Nouvelle Pénalité",
  message: "Pénalité de 60€ - dossier_non_cloture",
  timestamp: "2025-01-27T10:30:00Z",
  employeeId: 123,
  data: {
    montant: 60,
    type_penalite: "dossier_non_cloture",
    motif: "Dossier fermé en retard",
    intervention_num: "INT-2025-0001"
  }
}
```

## Gestion des Connexions

### Stockage des Connexions
- **Map globale** : `employeeConnections` stocke les connexions par employé
- **Multi-connexions** : Un employé peut avoir plusieurs onglets ouverts
- **Nettoyage automatique** : Les connexions fermées sont supprimées

### Authentification Socket.IO
1. **Connexion** : Client se connecte au serveur
2. **Authentification** : Client envoie son `employeeId`
3. **Validation** : Serveur stocke la connexion avec l'ID employé
4. **Confirmation** : Serveur confirme l'authentification

## Sécurité

### Isolation des Données
- **Filtrage par employé** : Chaque technicien ne voit que ses notifications
- **Validation côté serveur** : Vérification de l'ID employé avant envoi
- **CORS configuré** : Restriction des origines autorisées

### Gestion des Erreurs
- **Fallback silencieux** : Les erreurs de notification n'interrompent pas les opérations
- **Logs détaillés** : Toutes les erreurs sont loggées pour le debugging
- **Reconnexion automatique** : Socket.IO gère la reconnexion automatique

## Performance

### Optimisations
- **Ping/Pong** : Maintien de la connexion toutes les 30 secondes
- **Limite de notifications** : Maximum 10 notifications affichées
- **Nettoyage automatique** : Suppression des anciennes notifications

### Monitoring
- **Logs de connexion** : Suivi des connexions/déconnexions
- **Compteurs** : Nombre de connexions actives par employé
- **Statut en temps réel** : Indicateur de connexion dans l'interface

## Dépannage

### Problèmes Courants

1. **Notifications non reçues**
   - Vérifier la connexion Socket.IO (badge vert/rouge)
   - Vérifier les logs du serveur
   - Vérifier que l'employé est correctement assigné

2. **Sons ne se jouent pas**
   - Vérifier que les fichiers audio existent dans `public/sounds/`
   - Vérifier les permissions du navigateur
   - Tester avec des fichiers audio valides

3. **Notifications du navigateur bloquées**
   - Vérifier les permissions du navigateur
   - Cliquer sur "Autoriser" quand demandé
   - Vérifier les paramètres de notification du système

### Logs de Debug
```javascript
// Côté client
console.log('🔌 Connecté au serveur Socket.IO')
console.log('📨 Notification reçue:', notification)

// Côté serveur  
console.log('👤 Employé 123 connecté avec socket abc123')
console.log('📨 Notification réclamation envoyée à l\'employé 123')
```

## Évolutions Futures

### Fonctionnalités Possibles
- **Notifications push mobiles** : Intégration avec service workers
- **Templates personnalisés** : Messages de notification configurables
- **Historique complet** : Sauvegarde des notifications en base
- **Notifications groupées** : Regroupement par type ou période
- **Sons personnalisés** : Upload de sons par utilisateur

### Intégrations Possibles
- **Email** : Envoi d'emails en complément des notifications
- **SMS** : Notifications SMS pour les alertes critiques
- **Slack/Discord** : Intégration avec des plateformes de communication
- **Webhooks** : Notifications vers des systèmes externes











