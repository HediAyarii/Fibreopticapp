# Système de Traçabilité (Historiques)

## Vue d'ensemble

Le système d'historiques permet de tracer toutes les actions effectuées par les utilisateurs dans l'application. Chaque création, modification ou suppression est enregistrée avec des détails complets.

## Installation

### 1. Créer la table dans la base de données

```bash
node create_historiques.js
```

Ou exécutez directement le SQL :
```bash
psql -U votre_utilisateur -d votre_base -f create_historiques_table.sql
```

## Utilisation dans les APIs

### Importer les fonctions

```typescript
import { logHistorique, getClientIP, getUserAgent, generateDescription } from '@/lib/historique'
```

### Exemple pour CREATE

```typescript
// Après l'insertion dans la base de données
await logHistorique({
  action: 'CREATE',
  tableName: 'penalites',
  recordId: result.rows[0].id,
  section: 'Pénalités',
  description: generateDescription('CREATE', 'Pénalités', `Pénalité ${numero} créée`),
  newValues: result.rows[0],
  ipAddress: getClientIP(request),
  userAgent: getUserAgent(request)
})
```

### Exemple pour UPDATE

```typescript
// Récupérer les anciennes valeurs AVANT la mise à jour
const oldData = await query('SELECT * FROM ma_table WHERE id = $1', [id])

// Faire la mise à jour
const result = await query('UPDATE ma_table SET ... WHERE id = $1 RETURNING *', [id])

// Enregistrer dans l'historique
await logHistorique({
  action: 'UPDATE',
  tableName: 'ma_table',
  recordId: id,
  section: 'Ma Section',
  description: generateDescription('UPDATE', 'Ma Section', 'Détails de la modification'),
  oldValues: oldData.rows[0],
  newValues: result.rows[0],
  ipAddress: getClientIP(request),
  userAgent: getUserAgent(request)
})
```

### Exemple pour DELETE

```typescript
// Récupérer les données AVANT la suppression
const dataToDelete = await query('SELECT * FROM ma_table WHERE id = $1', [id])

// Faire la suppression
await query('DELETE FROM ma_table WHERE id = $1', [id])

// Enregistrer dans l'historique
await logHistorique({
  action: 'DELETE',
  tableName: 'ma_table',
  recordId: id,
  section: 'Ma Section',
  description: generateDescription('DELETE', 'Ma Section', 'Élément supprimé'),
  oldValues: dataToDelete.rows[0],
  ipAddress: getClientIP(request),
  userAgent: getUserAgent(request)
})
```

## API de consultation

### GET /api/historiques

Récupérer l'historique avec filtres optionnels :

```
GET /api/historiques?section=Pénalités&action=CREATE&date_debut=2025-01-01&limit=50
```

Paramètres disponibles :
- `user_id` : Filtrer par utilisateur
- `action` : CREATE, UPDATE, DELETE
- `table_name` : Nom de la table
- `section` : Section de l'application (Pénalités, Interventions, etc.)
- `date_debut` : Date de début
- `date_fin` : Date de fin
- `limit` : Nombre de résultats (défaut: 100)
- `offset` : Pagination

## Sections disponibles

- **Pénalités** : Gestion des pénalités
- **Interventions** : Gestion des interventions
- **Employés** : Gestion des employés
- **Réclamations** : Gestion des réclamations
- **Matériel** : Gestion du matériel
- **Charges** : Gestion des charges
- **Documents** : Gestion des documents

## Structure des données

### Champs de la table historiques

| Champ | Type | Description |
|-------|------|-------------|
| id | SERIAL | Identifiant unique |
| user_id | INTEGER | ID de l'utilisateur (optionnel) |
| user_name | VARCHAR(255) | Nom de l'utilisateur |
| action | VARCHAR(50) | Type d'action (CREATE/UPDATE/DELETE) |
| table_name | VARCHAR(100) | Table de la base de données affectée |
| record_id | INTEGER | ID de l'enregistrement affecté |
| section | VARCHAR(100) | Section de l'application |
| description | TEXT | Description détaillée de l'action |
| old_values | JSONB | Anciennes valeurs (UPDATE/DELETE) |
| new_values | JSONB | Nouvelles valeurs (CREATE/UPDATE) |
| ip_address | VARCHAR(45) | Adresse IP de l'utilisateur |
| user_agent | TEXT | Navigateur/Agent utilisateur |
| created_at | TIMESTAMP | Date et heure de l'action |

## Exemples d'intégration

### Dans une API Next.js

```typescript
// app/api/ma-route/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { logHistorique, getClientIP, getUserAgent } from '@/lib/historique'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Votre logique métier
    const result = await query('INSERT INTO ma_table (...) VALUES (...) RETURNING *', [...])
    
    // Enregistrer dans l'historique
    await logHistorique({
      action: 'CREATE',
      tableName: 'ma_table',
      recordId: result.rows[0].id,
      section: 'Ma Section',
      description: 'Nouvel enregistrement créé',
      newValues: result.rows[0],
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request)
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  }
}
```

## Bonnes pratiques

1. **Toujours enregistrer** : Chaque CREATE, UPDATE, DELETE doit être tracé
2. **Descriptions claires** : Utilisez `generateDescription()` pour des descriptions cohérentes
3. **Données complètes** : Incluez old_values ET new_values pour un audit complet
4. **Ne pas bloquer** : Le logging est async et ne bloque pas l'opération principale
5. **Gestion d'erreurs** : Le logging échoue silencieusement pour ne pas impacter l'utilisateur

## Requêtes SQL utiles

### Voir les dernières actions

```sql
SELECT * FROM historiques ORDER BY created_at DESC LIMIT 50;
```

### Actions par utilisateur

```sql
SELECT action, COUNT(*) as count
FROM historiques
WHERE user_id = 123
GROUP BY action;
```

### Actions sur une période

```sql
SELECT * FROM historiques
WHERE created_at BETWEEN '2025-01-01' AND '2025-01-31'
ORDER BY created_at DESC;
```

### Audit d'un enregistrement spécifique

```sql
SELECT * FROM historiques
WHERE table_name = 'penalites' AND record_id = 456
ORDER BY created_at DESC;
```

## Notes importantes

- Les erreurs de logging ne bloquent jamais l'opération principale
- Les données JSON (old_values, new_values) sont stockées en JSONB pour des requêtes efficaces
- Les index sont créés automatiquement pour optimiser les performances
- La table peut grossir rapidement : prévoir une stratégie d'archivage
